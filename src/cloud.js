import { RUNTIME_CONFIG } from "./runtime-config.js?v=__HEALTHY_PRO_BUILD_VERSION__";

const CLOUD_SESSION_KEY = "healthy-pro-cloud-session-v1";

const config = {
  supabaseUrl: cleanUrl(RUNTIME_CONFIG.supabaseUrl),
  supabaseKey: String(RUNTIME_CONFIG.supabaseKey || RUNTIME_CONFIG.supabaseAnonKey || "").trim()
};

export function isCloudConfigured() {
  return Boolean(config.supabaseUrl && config.supabaseKey);
}

export function getCloudConfigStatus() {
  return isCloudConfigured()
    ? { ready: true, label: "云端保存" }
    : { ready: false, label: "本地模式", detail: "还没有连接云端保存服务。" };
}

export function getStoredCloudSession() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CLOUD_SESSION_KEY));
    if (parsed?.accessToken && parsed?.refreshToken && parsed?.user?.id) return parsed;
  } catch {
    return null;
  }
  return null;
}

export function clearCloudSession() {
  localStorage.removeItem(CLOUD_SESSION_KEY);
}

export async function signUpCloud(email, password) {
  assertCloudConfigured();
  const data = await authRequest("/signup", { email, password });
  const session = normalizeSession(data);
  if (session) persistCloudSession(session);
  return { session, user: data.user || session?.user || null };
}

export async function signInCloud(email, password) {
  assertCloudConfigured();
  const data = await authRequest("/token?grant_type=password", { email, password });
  const session = normalizeSession(data);
  if (!session) throw new Error("没有拿到云端登录状态。");
  persistCloudSession(session);
  return session;
}

export async function signOutCloud() {
  const session = getStoredCloudSession();
  clearCloudSession();
  if (!session) return;
  try {
    await fetch(`${config.supabaseUrl}/auth/v1/logout`, {
      method: "POST",
      headers: getHeaders(session)
    });
  } catch {
    // Local logout should still succeed even if the network is gone.
  }
}

export async function getActiveCloudSession() {
  const session = getStoredCloudSession();
  if (!session) return null;

  const expiresAt = Number(session.expiresAt || 0);
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt && expiresAt - now > 90) return session;

  return refreshCloudSession(session);
}

export async function loadCloudUser() {
  const session = await requireSession();
  await ensureProfile(session);

  const [assessmentRows, planRows, trainingRows, bodyRows] = await Promise.all([
    restRequest("/assessments?select=*&order=created_at.desc&limit=1"),
    restRequest("/plans?select=*&order=created_at.desc&limit=1"),
    restRequest("/training_logs?select=*&order=created_at.asc&limit=200"),
    restRequest("/body_logs?select=*&order=created_at.asc&limit=200")
  ]);

  const latestAssessment = assessmentRows[0] || null;
  const latestPlan = planRows[0] || null;

  return {
    id: session.user.id,
    email: session.user.email,
    dataMode: "cloud",
    assessment: latestAssessment ? fromAssessmentRow(latestAssessment) : null,
    assessmentRowId: latestAssessment?.id || null,
    plan: latestPlan?.plan_json || null,
    planRowId: latestPlan?.id || null,
    logs: trainingRows.map(fromTrainingLogRow),
    bodyLogs: bodyRows.map(fromBodyLogRow),
    drafts: {}
  };
}

export async function loadCloudSocial() {
  const session = await requireSession();
  try {
    const friendProfile = await ensureFriendProfile(session);
    const friendships = await loadFriendships(session.user.id);
    const friendIds = [...new Set(friendships.map((row) => row.requester_id === session.user.id ? row.addressee_id : row.requester_id))];
    const friendProfiles = await loadFriendProfiles(friendIds);
    const profileById = Object.fromEntries([friendProfile, ...friendProfiles].filter(Boolean).map((profile) => [profile.user_id, profile]));

    return {
      schemaReady: true,
      friendProfile: fromFriendProfileRow(friendProfile),
      friendships: friendships.map((row) => fromFriendshipRow(row, session.user.id, profileById)),
      leaderboard: buildLeaderboard(friendProfile, friendProfiles, friendships, session.user.id)
    };
  } catch (error) {
    if (isMissingSocialSchema(error)) {
      return {
        schemaReady: false,
        message: "好友功能需要先更新 Supabase 表结构。"
      };
    }
    throw error;
  }
}

export async function saveCloudFriendProfile(settings) {
  const session = await requireSession();
  await ensureFriendProfile(session);
  const body = {
    nickname: settings.nickname,
    share_leaderboard: Boolean(settings.shareLeaderboard),
    share_weekly_summary: Boolean(settings.shareWeeklySummary),
    updated_at: new Date().toISOString()
  };
  if (settings.summary) Object.assign(body, toFriendSummaryRow(settings.summary));

  const rows = await restRequest(`/friend_profiles?user_id=eq.${session.user.id}`, {
    method: "PATCH",
    body,
    prefer: "return=representation"
  });
  return fromFriendProfileRow(rows[0]);
}

export async function saveCloudFriendSummary(summary) {
  const session = await requireSession();
  try {
    await ensureFriendProfile(session);
    await restRequest(`/friend_profiles?user_id=eq.${session.user.id}`, {
      method: "PATCH",
      body: {
        ...toFriendSummaryRow(summary),
        updated_at: new Date().toISOString()
      }
    });
    return true;
  } catch (error) {
    if (isMissingSocialSchema(error)) return false;
    throw error;
  }
}

export async function addCloudFriend(friendCode) {
  const session = await requireSession();
  const code = normalizeFriendCode(friendCode);
  if (!code) throw new Error("请输入好友码。");
  await ensureFriendProfile(session);
  const matches = await restRequest(`/friend_profiles?select=*&friend_code=eq.${code}&limit=1`);
  const target = matches[0];
  if (!target) throw new Error("没有找到这个好友码。");
  if (target.user_id === session.user.id) throw new Error("不能添加自己。");

  try {
    const rows = await restRequest("/friendships", {
      method: "POST",
      body: {
        requester_id: session.user.id,
        addressee_id: target.user_id,
        status: "pending"
      },
      prefer: "return=representation"
    });
    return rows[0];
  } catch (error) {
    if (String(error?.message || "").includes("duplicate")) throw new Error("你们已经有好友关系或待确认请求。");
    throw error;
  }
}

export async function respondCloudFriendship(friendshipId, status) {
  const cleanStatus = status === "accepted" ? "accepted" : "declined";
  const rows = await restRequest(`/friendships?id=eq.${friendshipId}`, {
    method: "PATCH",
    body: {
      status: cleanStatus,
      updated_at: new Date().toISOString()
    },
    prefer: "return=representation"
  });
  return rows[0];
}

export async function deleteCloudFriendship(friendshipId) {
  await restRequest(`/friendships?id=eq.${friendshipId}`, {
    method: "DELETE"
  });
}

export async function saveCloudFeedback(feedback) {
  const session = await requireSession();
  const rows = await restRequest("/feedback", {
    method: "POST",
    body: {
      user_id: session.user.id,
      rating: feedback.rating,
      category: feedback.category,
      page: feedback.page || null,
      message: feedback.message
    },
    prefer: "return=representation"
  });
  return rows[0];
}

export async function loadCloudReleases() {
  const session = await requireSession();
  try {
    const [releaseRows, readRows] = await Promise.all([
      restRequest("/app_releases?select=*&is_published=eq.true&order=published_at.desc&limit=10"),
      restRequest(`/user_release_reads?select=release_id,read_at&user_id=eq.${session.user.id}`)
    ]);
    const readsByReleaseId = Object.fromEntries((readRows || []).map((row) => [row.release_id, row.read_at]));
    const releases = (releaseRows || []).map((row) => fromReleaseRow(row, readsByReleaseId[row.id]));

    return {
      schemaReady: true,
      releases,
      unreadCount: releases.filter((release) => !release.isRead).length
    };
  } catch (error) {
    if (isMissingReleaseSchema(error)) {
      return {
        schemaReady: false,
        message: "更新公告需要先更新 Supabase 表结构。",
        releases: [],
        unreadCount: 0
      };
    }
    throw error;
  }
}

export async function markCloudReleaseRead(releaseId) {
  const session = await requireSession();
  const rows = await restRequest("/user_release_reads?on_conflict=user_id,release_id", {
    method: "POST",
    body: {
      user_id: session.user.id,
      release_id: releaseId,
      read_at: new Date().toISOString()
    },
    prefer: "resolution=merge-duplicates,return=representation"
  });
  return rows[0];
}

export async function saveCloudAssessment(assessment) {
  const session = await requireSession();
  const rows = await restRequest("/assessments", {
    method: "POST",
    body: toAssessmentRow(session.user.id, assessment),
    prefer: "return=representation"
  });
  return rows[0];
}

export async function saveCloudPlan(assessmentId, plan) {
  const session = await requireSession();
  const rows = await restRequest("/plans", {
    method: "POST",
    body: {
      user_id: session.user.id,
      assessment_id: assessmentId || null,
      coach_spec_version: plan.version || "unknown",
      plan_json: plan
    },
    prefer: "return=representation"
  });
  return rows[0];
}

export async function saveCloudTrainingLog(planId, log) {
  const session = await requireSession();
  const body = {
    user_id: session.user.id,
    plan_id: planId || null,
    workout_id: log.workoutId,
    workout_title: log.workoutTitle,
    week: log.week,
    completed_count: log.completedCount,
    intensity_feedback: log.intensityFeedback || "right",
    note: log.note || null,
    exercises: log.exercises || [],
    coach_feedback: log.coachFeedback || null,
    created_at: log.createdAt
  };
  let rows;
  try {
    rows = await restRequest("/training_logs", {
      method: "POST",
      body,
      prefer: "return=representation"
    });
  } catch (error) {
    const message = String(error?.message || error || "");
    if (!message.includes("coach_feedback")) throw error;
    const { coach_feedback, ...fallbackBody } = body;
    rows = await restRequest("/training_logs", {
      method: "POST",
      body: fallbackBody,
      prefer: "return=representation"
    });
  }
  return {
    ...fromTrainingLogRow(rows[0]),
    coachFeedback: log.coachFeedback || rows[0]?.coach_feedback || null
  };
}

export async function saveCloudBodyLog(record) {
  const session = await requireSession();
  const rows = await restRequest("/body_logs", {
    method: "POST",
    body: {
      user_id: session.user.id,
      weight_kg: record.weight,
      body_fat_percent: record.bodyFat,
      sleep_hours: record.sleep,
      note: record.note || null,
      created_at: record.createdAt
    },
    prefer: "return=representation"
  });
  return fromBodyLogRow(rows[0]);
}

async function refreshCloudSession(session) {
  const data = await authRequest("/token?grant_type=refresh_token", {
    refresh_token: session.refreshToken
  });
  const refreshed = normalizeSession(data);
  if (!refreshed) {
    clearCloudSession();
    return null;
  }
  persistCloudSession(refreshed);
  return refreshed;
}

async function ensureProfile(session) {
  await restRequest("/profiles?on_conflict=id", {
    method: "POST",
    body: {
      id: session.user.id,
      email: session.user.email
    },
    prefer: "resolution=merge-duplicates"
  });
}

async function ensureFriendProfile(session) {
  const existing = await restRequest(`/friend_profiles?select=*&user_id=eq.${session.user.id}&limit=1`);
  if (existing[0]) return existing[0];

  const rows = await restRequest("/friend_profiles", {
    method: "POST",
    body: {
      user_id: session.user.id,
      nickname: getDefaultNickname(session.user.email),
      friend_code: createFriendCode()
    },
    prefer: "return=representation"
  });
  return rows[0];
}

async function loadFriendships(userId) {
  return restRequest(`/friendships?select=*&or=(requester_id.eq.${userId},addressee_id.eq.${userId})&order=created_at.desc`);
}

async function loadFriendProfiles(userIds) {
  if (!userIds.length) return [];
  return restRequest(`/friend_profiles?select=*&user_id=in.(${userIds.join(",")})`);
}

async function authRequest(path, body) {
  const response = await fetch(`${config.supabaseUrl}/auth/v1${path}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  return parseResponse(response);
}

async function restRequest(path, options = {}) {
  const session = await requireSession();
  const headers = getHeaders(session);
  if (options.prefer) headers.Prefer = options.prefer;

  const response = await fetch(`${config.supabaseUrl}/rest/v1${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  return parseResponse(response);
}

async function parseResponse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.msg || data?.message || data?.error_description || data?.error || "云端请求失败。";
    throw new Error(message);
  }
  return data;
}

async function requireSession() {
  const session = await getActiveCloudSession();
  if (!session) throw new Error("请先登录云端账号。");
  return session;
}

function getHeaders(session) {
  return {
    apikey: config.supabaseKey,
    ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
    "Content-Type": "application/json"
  };
}

function persistCloudSession(session) {
  localStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify(session));
}

function normalizeSession(data) {
  const source = data?.session || data;
  if (!source?.access_token) return null;
  const expiresAt = source.expires_at || Math.floor(Date.now() / 1000) + Number(source.expires_in || 3600);
  return {
    accessToken: source.access_token,
    refreshToken: source.refresh_token,
    expiresAt,
    user: source.user || data.user
  };
}

function toAssessmentRow(userId, assessment) {
  return {
    user_id: userId,
    gender: assessment.gender,
    age: assessment.age,
    height_cm: assessment.height,
    weight_kg: assessment.weight,
    body_fat_percent: assessment.bodyFat === "" ? null : assessment.bodyFat,
    training_experience: assessment.trainingExperience,
    target_preference: assessment.targetPreference,
    focus_areas: assessment.focusAreas || [],
    weekly_limit: assessment.weeklyLimit,
    session_budget_minutes: assessment.sessionBudget,
    injury: assessment.injury
  };
}

function fromAssessmentRow(row) {
  return {
    gender: row.gender,
    age: Number(row.age),
    height: Number(row.height_cm),
    weight: Number(row.weight_kg),
    bodyFat: row.body_fat_percent === null ? "" : Number(row.body_fat_percent),
    trainingExperience: row.training_experience,
    targetPreference: row.target_preference,
    focusAreas: row.focus_areas || [],
    weeklyLimit: row.weekly_limit,
    sessionBudget: Number(row.session_budget_minutes),
    injury: row.injury
  };
}

function fromTrainingLogRow(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    workoutId: row.workout_id,
    workoutTitle: row.workout_title,
    week: Number(row.week),
    completedCount: Number(row.completed_count || 0),
    exercises: row.exercises || [],
    coachFeedback: row.coach_feedback || null,
    intensityFeedback: row.intensity_feedback || "right",
    note: row.note || ""
  };
}

function fromBodyLogRow(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    weight: Number(row.weight_kg),
    bodyFat: row.body_fat_percent === null ? null : Number(row.body_fat_percent),
    sleep: row.sleep_hours === null ? null : Number(row.sleep_hours),
    note: row.note || ""
  };
}

function fromFriendProfileRow(row) {
  return {
    userId: row.user_id,
    nickname: row.nickname,
    friendCode: row.friend_code,
    shareLeaderboard: Boolean(row.share_leaderboard),
    shareWeeklySummary: Boolean(row.share_weekly_summary),
    currentWeekCount: Number(row.current_week_count || 0),
    currentWeekCompleted: Number(row.current_week_completed || 0),
    currentWeekCompletionRate: Number(row.current_week_completion_rate || 0),
    streakWeeks: Number(row.streak_weeks || 0),
    latestTrainingAt: row.latest_training_at || null,
    updatedAt: row.updated_at || row.created_at
  };
}

function fromFriendshipRow(row, currentUserId, profileById = {}) {
  const friendId = row.requester_id === currentUserId ? row.addressee_id : row.requester_id;
  const profile = profileById[friendId] || {};
  return {
    id: row.id,
    status: row.status,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    friendId,
    direction: row.requester_id === currentUserId ? "outgoing" : "incoming",
    nickname: profile.nickname || "训练伙伴",
    friendCode: profile.friend_code || "",
    shareLeaderboard: Boolean(profile.share_leaderboard),
    shareWeeklySummary: Boolean(profile.share_weekly_summary),
    currentWeekCount: Number(profile.current_week_count || 0),
    currentWeekCompletionRate: Number(profile.current_week_completion_rate || 0),
    streakWeeks: Number(profile.streak_weeks || 0),
    createdAt: row.created_at
  };
}

function buildLeaderboard(ownProfile, friendProfiles, friendships, currentUserId) {
  const acceptedIds = new Set(friendships
    .filter((row) => row.status === "accepted")
    .map((row) => row.requester_id === currentUserId ? row.addressee_id : row.requester_id));
  return [ownProfile, ...friendProfiles]
    .filter((profile) => profile && (profile.user_id === currentUserId || acceptedIds.has(profile.user_id)))
    .filter((profile) => profile.share_leaderboard || profile.user_id === currentUserId)
    .map((profile) => ({
      userId: profile.user_id,
      nickname: profile.nickname,
      isSelf: profile.user_id === currentUserId,
      currentWeekCount: Number(profile.current_week_count || 0),
      currentWeekCompletionRate: Number(profile.current_week_completion_rate || 0),
      streakWeeks: Number(profile.streak_weeks || 0),
      latestTrainingAt: profile.latest_training_at || null,
      shareLeaderboard: Boolean(profile.share_leaderboard)
    }))
    .sort((a, b) =>
      b.currentWeekCompletionRate - a.currentWeekCompletionRate ||
      b.currentWeekCount - a.currentWeekCount ||
      b.streakWeeks - a.streakWeeks
    );
}

function toFriendSummaryRow(summary = {}) {
  return {
    current_week_count: Number(summary.currentWeekCount || 0),
    current_week_completed: Number(summary.currentWeekCompleted || 0),
    current_week_completion_rate: Number(summary.currentWeekCompletionRate || 0),
    streak_weeks: Number(summary.streakWeeks || 0),
    latest_training_at: summary.latestTrainingAt || null
  };
}

function fromReleaseRow(row, readAt = null) {
  const highlights = Array.isArray(row.highlights)
    ? row.highlights
    : [];
  return {
    id: row.id,
    version: row.version,
    title: row.title,
    summary: row.summary,
    highlights: highlights.map((item) => String(item)).filter(Boolean).slice(0, 6),
    details: row.details || "",
    releaseType: row.release_type || "improvement",
    publishedAt: row.published_at,
    readAt,
    isRead: Boolean(readAt)
  };
}

function createFriendCode() {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function normalizeFriendCode(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function getDefaultNickname(email) {
  const prefix = String(email || "").split("@")[0] || "训练伙伴";
  return prefix.slice(0, 12);
}

function isMissingSocialSchema(error) {
  const message = String(error?.message || error || "");
  return message.includes("friend_profiles") ||
    message.includes("friendships") ||
    message.includes("feedback") ||
    message.includes("schema cache") ||
    message.includes("relation") && message.includes("does not exist");
}

function isMissingReleaseSchema(error) {
  const message = String(error?.message || error || "");
  return message.includes("app_releases") ||
    message.includes("user_release_reads") ||
    message.includes("schema cache") ||
    message.includes("relation") && message.includes("does not exist");
}

function cleanUrl(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

function assertCloudConfigured() {
  if (!isCloudConfigured()) {
    throw new Error("云端保存还没有配置。");
  }
}
