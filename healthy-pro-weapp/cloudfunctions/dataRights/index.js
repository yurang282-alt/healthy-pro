const cloud = require("wx-server-sdk");
const { countUniqueAcrossPages, executeDeletion } = require("./deletion-core");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const PAGE_SIZE = 100;

function userDocId(openid) {
  return `user_${openid}`;
}

function planDocId(openid) {
  return `plan_${openid}`;
}

function getOpenid() {
  const wxContext = cloud.getWXContext();
  if (!wxContext.OPENID) throw new Error("没有拿到微信身份");
  return wxContext.OPENID;
}

function isMissingCollection(error) {
  const message = String(error && (error.errMsg || error.message) || "");
  return message.includes("collection not exists") || message.includes("DATABASE_COLLECTION_NOT_EXIST");
}

async function listByOwner(collectionName, openid) {
  try {
    const result = await db.collection(collectionName)
      .where({ openid })
      .limit(PAGE_SIZE)
      .get();
    return Array.isArray(result && result.data) ? result.data : [];
  } catch (error) {
    if (isMissingCollection(error)) return [];
    throw error;
  }
}

async function listFriendships(openid) {
  try {
    const [sent, received] = await Promise.all([
      db.collection("friendships").where({ requesterOpenid: openid }).limit(PAGE_SIZE).get(),
      db.collection("friendships").where({ recipientOpenid: openid }).limit(PAGE_SIZE).get()
    ]);
    const records = [
      ...((sent && sent.data) || []),
      ...((received && received.data) || [])
    ];
    return Array.from(new Map(records.filter((item) => item && item._id).map((item) => [item._id, item])).values());
  } catch (error) {
    if (isMissingCollection(error)) return [];
    throw error;
  }
}

async function countByOwner(collectionName, openid) {
  try {
    return await countUniqueAcrossPages([
      async (offset, limit) => {
        const result = await db.collection(collectionName)
          .where({ openid })
          .skip(offset)
          .limit(limit)
          .get();
        return result && result.data || [];
      }
    ], PAGE_SIZE);
  } catch (error) {
    if (isMissingCollection(error)) return 0;
    throw error;
  }
}

async function countFriendships(openid) {
  try {
    return await countUniqueAcrossPages([
      async (offset, limit) => {
        const result = await db.collection("friendships")
          .where({ requesterOpenid: openid })
          .skip(offset)
          .limit(limit)
          .get();
        return result && result.data || [];
      },
      async (offset, limit) => {
        const result = await db.collection("friendships")
          .where({ recipientOpenid: openid })
          .skip(offset)
          .limit(limit)
          .get();
        return result && result.data || [];
      }
    ], PAGE_SIZE);
  } catch (error) {
    if (isMissingCollection(error)) return 0;
    throw error;
  }
}

async function countKnownDocument(collectionName, documentId) {
  try {
    const result = await db.collection(collectionName).doc(documentId).get();
    return result && result.data ? 1 : 0;
  } catch (error) {
    const message = String(error && (error.errMsg || error.message) || "");
    if (message.includes("does not exist") || isMissingCollection(error)) return 0;
    throw error;
  }
}

async function getDeletionPreview(openid) {
  const [users, plans, trainingLogs, feedbacks, legacyFeedbacks, friendships] = await Promise.all([
    countKnownDocument("users", userDocId(openid)),
    countKnownDocument("plans", planDocId(openid)),
    countByOwner("training_logs", openid),
    countByOwner("feedbacks", openid),
    countByOwner("feedback", openid),
    countFriendships(openid)
  ]);
  return {
    users,
    plans,
    trainingLogs,
    feedbacks: feedbacks + legacyFeedbacks,
    friendships
  };
}

async function removeKnownDocument(collectionName, documentId) {
  try {
    await db.collection(collectionName).doc(documentId).remove();
    return 1;
  } catch (error) {
    const message = String(error && (error.errMsg || error.message) || "");
    if (message.includes("does not exist") || isMissingCollection(error)) return 0;
    throw error;
  }
}

async function removeByOwner(collectionName, openid) {
  let removed = 0;
  while (true) {
    const records = await listByOwner(collectionName, openid);
    if (!records.length) return removed;
    await Promise.all(records.map((record) => db.collection(collectionName).doc(record._id).remove()));
    removed += records.length;
  }
}

async function removeFriendships(openid) {
  let removed = 0;
  while (true) {
    const records = await listFriendships(openid);
    if (!records.length) return removed;
    await Promise.all(records.map((record) => db.collection("friendships").doc(record._id).remove()));
    removed += records.length;
  }
}

async function deleteOwnData(openid) {
  return executeDeletion([
    { key: "trainingLogs", run: () => removeByOwner("training_logs", openid) },
    { key: "feedbacks", run: () => removeByOwner("feedbacks", openid) },
    { key: "legacyFeedbacks", run: () => removeByOwner("feedback", openid) },
    { key: "friendships", run: () => removeFriendships(openid) },
    { key: "plans", run: () => removeKnownDocument("plans", planDocId(openid)) },
    { key: "users", run: () => removeKnownDocument("users", userDocId(openid)) }
  ], () => getDeletionPreview(openid));
}

exports.main = async (event = {}) => {
  try {
    const openid = getOpenid();
    if (event.action === "previewDeletion") {
      return { ok: true, data: await getDeletionPreview(openid) };
    }
    if (event.action === "deleteOwnData") {
      return { ok: true, data: await deleteOwnData(openid) };
    }
    return { ok: false, message: "未知数据操作" };
  } catch (error) {
    return {
      ok: false,
      message: error && (error.message || error.errMsg) || "数据操作失败"
    };
  }
};
