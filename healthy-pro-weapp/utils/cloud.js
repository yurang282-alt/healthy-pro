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

function friendshipDocId(leftOpenid, rightOpenid) {
  return `friendship_${[leftOpenid, rightOpenid].sort().join("_")}`.replace(/[^\w-]/g, "_");
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

async function findCloudUserByFriendCode(friendCode) {
  const code = String(friendCode || "").trim().toUpperCase();
  if (!code) throw new Error("请输入好友码");

  const result = await getDatabase()
    .collection("users")
    .where({ friendCode: code })
    .limit(1)
    .get();
  const list = result && Array.isArray(result.data) ? result.data : [];
  return list[0] || null;
}

async function sendCloudFriendRequest(friendCode, store, identity) {
  const openid = identity && identity.openid;
  if (!openid) throw new Error("缺少微信身份");
  const code = String(friendCode || "").trim().toUpperCase();
  const target = await findCloudUserByFriendCode(code);
  if (!target || !target.openid) throw new Error("没有找到这个好友码");
  if (target.openid === openid) throw new Error("不能添加自己");

  const now = new Date().toISOString();
  const db = getDatabase();
  const docId = friendshipDocId(openid, target.openid);
  const social = store && store.social || {};
  const profile = social.friendProfile || {};

  try {
    const existing = await db.collection("friendships").doc(docId).get();
    const current = existing && existing.data;
    if (current && current.status === "accepted") throw new Error("已经是好友了");
    if (current && current.status === "pending") throw new Error("好友请求已发送，等待确认");
  } catch (error) {
    if (String(error && error.errMsg).indexOf("does not exist") < 0) throw error;
  }

  await db.collection("friendships").doc(docId).set({
    data: {
      schema: CLOUD_STORE_SCHEMA,
      appId: APP_ID,
      requesterOpenid: openid,
      recipientOpenid: target.openid,
      requesterNickname: profile.nickname || "微信用户",
      recipientNickname: target.friendNickname || "微信用户",
      status: "pending",
      createdAt: now,
      updatedAt: now
    }
  });

  return { id: docId, targetOpenid: target.openid };
}

async function respondCloudFriendship(friendshipId, status) {
  const nextStatus = status === "accepted" ? "accepted" : "declined";
  await getDatabase().collection("friendships").doc(friendshipId).update({
    data: {
      status: nextStatus,
      updatedAt: new Date().toISOString()
    }
  });
}

async function deleteCloudFriendship(friendshipId) {
  await getDatabase().collection("friendships").doc(friendshipId).update({
    data: {
      status: "removed",
      updatedAt: new Date().toISOString()
    }
  });
}

async function readCloudSocial(openid, store = {}) {
  if (!openid) throw new Error("缺少微信身份");
  const db = getDatabase();
  const [sentResult, receivedResult, ownRecord] = await Promise.all([
    db.collection("friendships").where({ requesterOpenid: openid }).get(),
    db.collection("friendships").where({ recipientOpenid: openid }).get(),
    readCloudStore(openid).catch(() => null)
  ]);

  const records = [
    ...((sentResult && sentResult.data) || []),
    ...((receivedResult && receivedResult.data) || [])
  ].filter((item) => item && item.status !== "removed" && item.status !== "declined");

  const otherOpenids = Array.from(new Set(records.map((item) => (
    item.requesterOpenid === openid ? item.recipientOpenid : item.requesterOpenid
  )).filter(Boolean)));
  const otherRecords = await Promise.all(otherOpenids.map((targetOpenid) => readCloudStore(targetOpenid).catch(() => null)));
  const byOpenid = otherRecords.reduce((map, item) => {
    if (item && item.openid) map[item.openid] = item;
    return map;
  }, {});

  const ownStore = ownRecord && ownRecord.store || store;
  const ownSocial = ownStore.social || {};
  const ownProfile = ownSocial.friendProfile || {};
  const friendProfile = {
    nickname: ownRecord && ownRecord.friendNickname || ownProfile.nickname || "微信用户",
    friendCode: ownRecord && ownRecord.friendCode || ownProfile.friendCode || "",
    shareLeaderboard: ownRecord ? ownRecord.shareLeaderboard !== false : ownProfile.shareLeaderboard !== false,
    shareWeeklySummary: ownRecord ? ownRecord.shareWeeklySummary !== false : ownProfile.shareWeeklySummary !== false
  };

  const friendships = records.map((item) => {
    const isRequester = item.requesterOpenid === openid;
    const otherOpenid = isRequester ? item.recipientOpenid : item.requesterOpenid;
    const other = byOpenid[otherOpenid] || {};
    const otherSummary = other.socialSummary || other.store && other.store.social && other.store.social.summary || {};
    return {
      id: item._id || friendshipDocId(item.requesterOpenid, item.recipientOpenid),
      status: item.status,
      direction: isRequester ? "outgoing" : "incoming",
      openid: otherOpenid,
      nickname: other.friendNickname || (isRequester ? item.recipientNickname : item.requesterNickname) || "微信用户",
      friendCode: other.friendCode || "",
      shareLeaderboard: other.shareLeaderboard !== false,
      shareWeeklySummary: other.shareWeeklySummary !== false,
      currentWeekCount: Number(otherSummary.currentWeekCount || 0),
      currentWeekCompleted: Number(otherSummary.currentWeekCompleted || 0),
      currentWeekCompletionRate: Number(otherSummary.currentWeekCompletionRate || 0),
      streakWeeks: Number(otherSummary.streakWeeks || 0),
      latestTrainingAt: otherSummary.latestTrainingAt || ""
    };
  });

  const ownSummary = ownRecord && ownRecord.socialSummary || ownSocial.summary || {};
  const leaderboard = [
    friendProfile.shareLeaderboard ? {
      isSelf: true,
      nickname: friendProfile.nickname,
      currentWeekCount: Number(ownSummary.currentWeekCount || 0),
      currentWeekCompleted: Number(ownSummary.currentWeekCompleted || 0),
      currentWeekCompletionRate: Number(ownSummary.currentWeekCompletionRate || 0),
      streakWeeks: Number(ownSummary.streakWeeks || 0)
    } : null,
    ...friendships
      .filter((item) => item.status === "accepted" && item.shareLeaderboard)
      .map((item) => ({ ...item, isSelf: false }))
  ].filter(Boolean).sort((left, right) => (
    Number(right.currentWeekCompletionRate || 0) - Number(left.currentWeekCompletionRate || 0) ||
    Number(right.currentWeekCount || 0) - Number(left.currentWeekCount || 0) ||
    Number(right.streakWeeks || 0) - Number(left.streakWeeks || 0)
  ));

  return {
    friendProfile,
    friendships,
    leaderboard,
    lastSyncedAt: new Date().toISOString()
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
  deleteCloudFriendship,
  findCloudUserByFriendCode,
  getCloudIdentity,
  initCloud,
  readCloudSocial,
  readCloudStore,
  respondCloudFriendship,
  sendCloudFriendRequest,
  userDocId,
  writeCloudLog,
  writeCloudStore
};
