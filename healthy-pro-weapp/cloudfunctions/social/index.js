const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

const APP_ID = "wx9f1d623ecc4ce4ae";
const CLOUD_STORE_SCHEMA = "healthy-pro-store-v1";

function userDocId(openid) {
  return `user_${openid}`;
}

function friendshipDocId(leftOpenid, rightOpenid) {
  return `friendship_${[leftOpenid, rightOpenid].sort().join("_")}`.replace(/[^\w-]/g, "_");
}

function ok(data) {
  return { ok: true, data };
}

function fail(message) {
  return { ok: false, message };
}

function getErrorMessage(error) {
  return error && (error.message || error.errMsg) || "好友服务暂不可用";
}

function getOpenid() {
  const wxContext = cloud.getWXContext();
  if (!wxContext.OPENID) {
    throw new Error("没有拿到微信身份");
  }
  return wxContext.OPENID;
}

function compactText(value, fallback = "") {
  return String(value || fallback).trim();
}

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}

async function getUserRecord(openid) {
  if (!openid) return null;
  try {
    const result = await db.collection("users").doc(userDocId(openid)).get();
    return result && result.data ? result.data : null;
  } catch (error) {
    if (String(error && error.errMsg).indexOf("does not exist") >= 0) return null;
    throw error;
  }
}

function toPublicProfile(record) {
  if (!record) {
    return {
      nickname: "微信用户",
      friendCode: "",
      shareLeaderboard: true,
      shareWeeklySummary: true
    };
  }
  const store = record.store || {};
  const social = store.social || {};
  const profile = social.friendProfile || {};
  return {
    nickname: compactText(record.friendNickname || profile.nickname, "微信用户").slice(0, 16),
    friendCode: normalizeCode(record.friendCode || profile.friendCode),
    shareLeaderboard: record.shareLeaderboard !== false && profile.shareLeaderboard !== false,
    shareWeeklySummary: record.shareWeeklySummary !== false && profile.shareWeeklySummary !== false
  };
}

function toPublicSummary(record) {
  const summary = record && (record.socialSummary || record.store && record.store.social && record.store.social.summary) || {};
  return {
    currentWeekCount: Number(summary.currentWeekCount || 0),
    currentWeekCompleted: Number(summary.currentWeekCompleted || 0),
    currentWeekCompletionRate: Number(summary.currentWeekCompletionRate || 0),
    streakWeeks: Number(summary.streakWeeks || 0),
    latestTrainingAt: summary.latestTrainingAt || ""
  };
}

function toFriendSummary(record) {
  const profile = toPublicProfile(record);
  return {
    openid: record && record.openid || "",
    nickname: profile.nickname,
    shareLeaderboard: profile.shareLeaderboard,
    shareWeeklySummary: profile.shareWeeklySummary,
    ...toPublicSummary(record)
  };
}

async function findRecordByFriendCode(friendCode) {
  const code = normalizeCode(friendCode);
  if (!code) throw new Error("请输入好友码");
  const result = await db.collection("users")
    .where({ friendCode: code })
    .limit(1)
    .get();
  const list = result && Array.isArray(result.data) ? result.data : [];
  return list[0] || null;
}

async function getFriendship(friendshipId) {
  if (!friendshipId) throw new Error("缺少好友关系");
  try {
    const result = await db.collection("friendships").doc(friendshipId).get();
    return result && result.data ? result.data : null;
  } catch (error) {
    if (String(error && error.errMsg).indexOf("does not exist") >= 0) return null;
    throw error;
  }
}

async function sendFriendRequest(event, openid) {
  const target = await findRecordByFriendCode(event.friendCode);
  if (!target || !target.openid) throw new Error("没有找到这个好友码");
  if (target.openid === openid) throw new Error("不能添加自己");

  const ownRecord = await getUserRecord(openid);
  const ownProfile = toPublicProfile(ownRecord);
  const targetProfile = toPublicProfile(target);
  const docId = friendshipDocId(openid, target.openid);
  const now = new Date().toISOString();
  const existing = await getFriendship(docId);
  if (existing && existing.status === "accepted") throw new Error("已经是好友了");
  if (existing && existing.status === "pending") throw new Error("好友请求已发送，等待确认");

  await db.collection("friendships").doc(docId).set({
    data: {
      schema: CLOUD_STORE_SCHEMA,
      appId: APP_ID,
      requesterOpenid: openid,
      recipientOpenid: target.openid,
      requesterNickname: ownProfile.nickname,
      recipientNickname: targetProfile.nickname,
      status: "pending",
      createdAt: existing && existing.createdAt || now,
      updatedAt: now
    }
  });

  return ok({
    id: docId,
    target: {
      nickname: targetProfile.nickname
    }
  });
}

async function respondFriendship(event, openid) {
  const friendshipId = String(event.friendshipId || "");
  const record = await getFriendship(friendshipId);
  if (!record) throw new Error("好友请求不存在");
  if (record.recipientOpenid !== openid) throw new Error("只能处理发给你的好友请求");
  if (record.status !== "pending") throw new Error("这个好友请求已处理");

  const nextStatus = event.status === "accepted" ? "accepted" : "declined";
  await db.collection("friendships").doc(friendshipId).update({
    data: {
      status: nextStatus,
      updatedAt: new Date().toISOString()
    }
  });

  return ok({ id: friendshipId, status: nextStatus });
}

async function removeFriendship(event, openid) {
  const friendshipId = String(event.friendshipId || "");
  const record = await getFriendship(friendshipId);
  if (!record) throw new Error("好友关系不存在");
  if (record.requesterOpenid !== openid && record.recipientOpenid !== openid) {
    throw new Error("只能移除自己的好友关系");
  }

  await db.collection("friendships").doc(friendshipId).update({
    data: {
      status: "removed",
      updatedAt: new Date().toISOString()
    }
  });

  return ok({ id: friendshipId, status: "removed" });
}

async function getFriendshipRecords(openid) {
  const [sentResult, receivedResult] = await Promise.all([
    db.collection("friendships").where({ requesterOpenid: openid }).get(),
    db.collection("friendships").where({ recipientOpenid: openid }).get()
  ]);
  return [
    ...((sentResult && sentResult.data) || []),
    ...((receivedResult && receivedResult.data) || [])
  ].filter((item) => item && item.status !== "removed" && item.status !== "declined");
}

async function getSocial(event, openid) {
  const [records, ownRecord] = await Promise.all([
    getFriendshipRecords(openid),
    getUserRecord(openid)
  ]);
  const otherOpenids = Array.from(new Set(records.map((item) => (
    item.requesterOpenid === openid ? item.recipientOpenid : item.requesterOpenid
  )).filter(Boolean)));
  const otherRecords = await Promise.all(otherOpenids.map((targetOpenid) => getUserRecord(targetOpenid).catch(() => null)));
  const byOpenid = otherRecords.reduce((map, record) => {
    if (record && record.openid) map[record.openid] = toFriendSummary(record);
    return map;
  }, {});

  const friendProfile = toPublicProfile(ownRecord);
  const ownSummary = toPublicSummary(ownRecord);
  const friendships = records.map((item) => {
    const isRequester = item.requesterOpenid === openid;
    const otherOpenid = isRequester ? item.recipientOpenid : item.requesterOpenid;
    const other = byOpenid[otherOpenid] || {};
    return {
      id: item._id || friendshipDocId(item.requesterOpenid, item.recipientOpenid),
      status: item.status,
      direction: isRequester ? "outgoing" : "incoming",
      nickname: other.nickname || (isRequester ? item.recipientNickname : item.requesterNickname) || "微信用户",
      shareLeaderboard: other.shareLeaderboard !== false,
      shareWeeklySummary: other.shareWeeklySummary !== false,
      currentWeekCount: Number(other.currentWeekCount || 0),
      currentWeekCompleted: Number(other.currentWeekCompleted || 0),
      currentWeekCompletionRate: Number(other.currentWeekCompletionRate || 0),
      streakWeeks: Number(other.streakWeeks || 0),
      latestTrainingAt: other.latestTrainingAt || ""
    };
  });

  const leaderboard = [
    friendProfile.shareLeaderboard ? {
      isSelf: true,
      nickname: friendProfile.nickname,
      currentWeekCount: ownSummary.currentWeekCount,
      currentWeekCompleted: ownSummary.currentWeekCompleted,
      currentWeekCompletionRate: ownSummary.currentWeekCompletionRate,
      streakWeeks: ownSummary.streakWeeks,
      latestTrainingAt: ownSummary.latestTrainingAt
    } : null,
    ...friendships
      .filter((item) => item.status === "accepted" && item.shareLeaderboard)
      .map((item) => ({ ...item, isSelf: false }))
  ].filter(Boolean).sort((left, right) => (
    Number(right.currentWeekCompletionRate || 0) - Number(left.currentWeekCompletionRate || 0) ||
    Number(right.currentWeekCount || 0) - Number(left.currentWeekCount || 0) ||
    Number(right.streakWeeks || 0) - Number(left.streakWeeks || 0)
  ));

  return ok({
    friendProfile,
    friendships,
    leaderboard,
    lastSyncedAt: new Date().toISOString()
  });
}

exports.main = async (event = {}) => {
  try {
    const openid = getOpenid();
    if (event.action === "sendFriendRequest") return sendFriendRequest(event, openid);
    if (event.action === "respondFriendship") return respondFriendship(event, openid);
    if (event.action === "removeFriendship") return removeFriendship(event, openid);
    if (event.action === "getSocial") return getSocial(event, openid);
    return fail("未知好友操作");
  } catch (error) {
    return fail(getErrorMessage(error));
  }
};
