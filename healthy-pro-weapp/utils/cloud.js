const CLOUD_ENV_ID = "cloud1-d3g79qnvd808824c9";
const APP_ID = "wx9f1d623ecc4ce4ae";
const CLOUD_STORE_SCHEMA = "healthy-pro-store-v1";

function clone(value) {
  return JSON.parse(JSON.stringify(value || null));
}

function compact(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function canUseCloud() {
  return typeof wx !== "undefined" && wx.cloud;
}

function initCloud() {
  if (!canUseCloud()) return false;
  wx.cloud.init({
    env: CLOUD_ENV_ID,
    traceUser: false
  });
  return true;
}

function getDatabase() {
  return wx.cloud.database({ env: CLOUD_ENV_ID });
}

function userDocId(openid) {
  return `user_${openid}`;
}

function planDocId(openid) {
  return `plan_${openid}`;
}

function logDocId(openid, logId) {
  return `log_${openid}_${String(logId || Date.now()).replace(/[^\w-]/g, "_")}`;
}

function feedbackDocId(openid, feedbackId) {
  return `feedback_${openid}_${String(feedbackId || Date.now()).replace(/[^\w-]/g, "_")}`;
}

async function getCloudIdentity() {
  const result = await wx.cloud.callFunction({ name: "login" });
  const data = result && result.result ? result.result : {};
  if (!data.openid) {
    throw new Error("没有拿到微信身份");
  }
  return data;
}

async function readCloudStore(openid) {
  try {
    const result = await getDatabase()
      .collection("users")
      .doc(userDocId(openid))
      .get();
    return result && result.data ? result.data : null;
  } catch (error) {
    if (String(error && error.errMsg).indexOf("does not exist") >= 0) {
      return null;
    }
    throw error;
  }
}

async function writeCloudStore(store, identity, options = {}) {
  const openid = identity && identity.openid;
  if (!openid) throw new Error("缺少微信身份");

  const now = new Date().toISOString();
  const safeStore = compact(store);
  const social = safeStore.social || {};
  const friendProfile = social.friendProfile || {};
  const basePayload = {
    schema: CLOUD_STORE_SCHEMA,
    appId: APP_ID,
    openid,
    store: safeStore,
    user: compact(safeStore.user),
    profile: compact(safeStore.profile),
    friendCode: friendProfile.friendCode || "",
    friendNickname: friendProfile.nickname || safeStore.profile && safeStore.profile.nickname || "微信用户",
    shareLeaderboard: friendProfile.shareLeaderboard !== false,
    shareWeeklySummary: friendProfile.shareWeeklySummary !== false,
    socialSummary: compact(social.summary),
    logsCount: Array.isArray(safeStore.logs) ? safeStore.logs.length : 0,
    updatedAt: now
  };
  const db = getDatabase();

  await db.collection("users").doc(userDocId(openid)).set({
    data: basePayload
  });

  if (safeStore.user && safeStore.user.plan) {
    await db.collection("plans").doc(planDocId(openid)).set({
      data: {
        schema: CLOUD_STORE_SCHEMA,
        appId: APP_ID,
        openid,
        assessment: compact(safeStore.user.assessment),
        plan: compact(safeStore.user.plan),
        updatedAt: now
      }
    });
  }

  if (options.mirrorLogs) {
    const logs = Array.isArray(safeStore.logs) ? safeStore.logs.slice(-100) : [];
    await Promise.all(logs.map((log) => writeCloudLog(log, identity, now)));
  }

  return {
    updatedAt: now,
    userDocId: userDocId(openid)
  };
}

async function callSocialFunction(action, payload = {}) {
  const result = await wx.cloud.callFunction({
    name: "social",
    data: {
      action,
      ...payload
    }
  });
  const data = result && result.result ? result.result : {};
  if (!data.ok) {
    throw new Error(data.message || "好友服务暂不可用");
  }
  return data.data || {};
}

async function sendCloudFriendRequest(friendCode, store, identity) {
  const openid = identity && identity.openid;
  if (!openid) throw new Error("缺少微信身份");
  const code = String(friendCode || "").trim().toUpperCase();
  if (!code) throw new Error("请输入好友码");
  return callSocialFunction("sendFriendRequest", { friendCode: code });
}

async function respondCloudFriendship(friendshipId, status) {
  return callSocialFunction("respondFriendship", { friendshipId, status });
}

async function deleteCloudFriendship(friendshipId) {
  return callSocialFunction("removeFriendship", { friendshipId });
}

async function readCloudSocial(openid, store = {}) {
  if (!openid) throw new Error("缺少微信身份");
  const result = await callSocialFunction("getSocial");
  const localProfile = store && store.social && store.social.friendProfile || {};
  return {
    friendProfile: {
      nickname: localProfile.nickname || "微信用户",
      friendCode: localProfile.friendCode || "",
      shareLeaderboard: localProfile.shareLeaderboard !== false,
      shareWeeklySummary: localProfile.shareWeeklySummary !== false,
      ...(result.friendProfile || {})
    },
    friendships: Array.isArray(result.friendships) ? result.friendships : [],
    leaderboard: Array.isArray(result.leaderboard) ? result.leaderboard : [],
    lastSyncedAt: result.lastSyncedAt || new Date().toISOString()
  };
}

async function writeCloudLog(log, identity, syncedAt) {
  const openid = identity && identity.openid;
  if (!openid || !log) throw new Error("缺少训练记录或微信身份");

  const now = syncedAt || new Date().toISOString();
  return getDatabase().collection("training_logs").doc(logDocId(openid, log.id)).set({
    data: {
      schema: CLOUD_STORE_SCHEMA,
      appId: APP_ID,
      openid,
      log: compact(log),
      workoutId: log.workoutId || "",
      workoutTitle: log.workoutTitle || "",
      week: log.week || 1,
      createdAt: log.createdAt || now,
      updatedAt: now
    }
  });
}

async function writeCloudFeedback(feedback, identity, syncedAt) {
  const openid = identity && identity.openid;
  if (!openid || !feedback) throw new Error("缺少反馈或微信身份");

  const now = syncedAt || new Date().toISOString();
  return getDatabase().collection("feedbacks").doc(feedbackDocId(openid, feedback.id)).set({
    data: {
      schema: CLOUD_STORE_SCHEMA,
      appId: APP_ID,
      openid,
      feedback: compact(feedback),
      rating: Number(feedback.rating || 0),
      category: feedback.category || "other",
      message: feedback.message || feedback.content || "",
      page: feedback.page || "",
      source: feedback.source || "weapp",
      createdAt: feedback.createdAt || now,
      updatedAt: now
    }
  });
}

module.exports = {
  APP_ID,
  CLOUD_ENV_ID,
  CLOUD_STORE_SCHEMA,
  clone,
  deleteCloudFriendship,
  getCloudIdentity,
  initCloud,
  readCloudSocial,
  readCloudStore,
  respondCloudFriendship,
  sendCloudFriendRequest,
  userDocId,
  writeCloudFeedback,
  writeCloudLog,
  writeCloudStore
};
