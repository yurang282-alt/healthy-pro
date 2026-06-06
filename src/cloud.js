import { RUNTIME_CONFIG } from "./runtime-config.js?v=supabase-v1";

const CLOUD_SESSION_KEY = "healthy-pro-cloud-session-v1";

const config = {
  supabaseUrl: cleanUrl(RUNTIME_CONFIG.supabaseUrl),
  supabaseAnonKey: String(RUNTIME_CONFIG.supabaseAnonKey || "").trim()
};

export function isCloudConfigured() {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}

export function getCloudConfigStatus() {
  return isCloudConfigured()
    ? { ready: true, label: "云端 Supabase" }
    : { ready: false, label: "本地模式", detail: "还没有配置 Supabase URL 和 anon key。" };
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
  const rows = await restRequest("/training_logs", {
    method: "POST",
    body: {
      user_id: session.user.id,
      plan_id: planId || null,
      workout_id: log.workoutId,
      workout_title: log.workoutTitle,
      week: log.week,
      completed_count: log.completedCount,
      intensity_feedback: log.intensityFeedback || "right",
      note: log.note || null,
      exercises: log.exercises || [],
      created_at: log.createdAt
    },
    prefer: "return=representation"
  });
  return fromTrainingLogRow(rows[0]);
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
    apikey: config.supabaseAnonKey,
    Authorization: session ? `Bearer ${session.accessToken}` : `Bearer ${config.supabaseAnonKey}`,
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

function cleanUrl(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

function assertCloudConfigured() {
  if (!isCloudConfigured()) {
    throw new Error("Supabase 还没有配置。");
  }
}
