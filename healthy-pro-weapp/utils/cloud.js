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
  const basePayload = {
    schema: CLOUD_STORE_SCHEMA,
    appId: APP_ID,
    openid,
    store: safeStore,
    user: compact(safeStore.user),
    profile: compact(safeStore.profile),
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

module.exports = {
  APP_ID,
  CLOUD_ENV_ID,
  CLOUD_STORE_SCHEMA,
  clone,
  getCloudIdentity,
  initCloud,
  readCloudStore,
  userDocId,
  writeCloudLog,
  writeCloudStore
};
