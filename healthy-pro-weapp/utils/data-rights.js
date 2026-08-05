const DATA_EXPORT_SCHEMA = "healthy-pro-export-v1";
const DATA_DELETION_LOCK_PREFIX = "healthyProDataDeletionLock";

const DELETION_LABELS = {
  users: "训练档案",
  plans: "训练计划",
  trainingLogs: "训练记录",
  feedbacks: "反馈",
  legacyFeedbacks: "历史反馈",
  friendships: "好友关系",
  verification: "删除结果核对"
};

function clone(value, fallback) {
  if (value === undefined || value === null) return fallback;
  return JSON.parse(JSON.stringify(value));
}

function sanitizeFriendship(friendship = {}) {
  return {
    status: friendship.status || "",
    direction: friendship.direction || "",
    nickname: friendship.nickname || "微信用户",
    shareLeaderboard: friendship.shareLeaderboard !== false,
    shareWeeklySummary: friendship.shareWeeklySummary !== false,
    currentWeekCount: Number(friendship.currentWeekCount || 0),
    currentWeekCompleted: Number(friendship.currentWeekCompleted || 0),
    currentWeekCompletionRate: Number(friendship.currentWeekCompletionRate || 0),
    streakWeeks: Number(friendship.streakWeeks || 0),
    latestTrainingAt: friendship.latestTrainingAt || ""
  };
}

function buildPortableDataExport(store = {}, generatedAt = new Date().toISOString()) {
  const user = store.user || {};
  const profile = store.profile || {};
  const social = store.social || {};
  const friendProfile = social.friendProfile || {};

  return {
    schema: DATA_EXPORT_SCHEMA,
    app: "Healthy Pro",
    generatedAt,
    account: {
      boundToWechat: Boolean(store.cloud && store.cloud.openid),
      dataMode: profile.mode === "cloud" ? "cloud" : "local"
    },
    profile: {
      nickname: friendProfile.nickname || profile.nickname || "微信用户"
    },
    assessment: clone(user.assessment, null),
    plan: clone(user.plan, null),
    trainingExecution: clone(store.trainingExecution, null),
    trainingLogs: clone(Array.isArray(store.logs) ? store.logs : [], []),
    bodyLogs: clone(Array.isArray(store.bodyLogs) ? store.bodyLogs : [], []),
    feedbacks: clone(Array.isArray(store.feedbacks) ? store.feedbacks : [], []),
    friendSettings: {
      friendCode: friendProfile.friendCode || "",
      shareLeaderboard: friendProfile.shareLeaderboard !== false,
      shareWeeklySummary: friendProfile.shareWeeklySummary !== false
    },
    friendships: (Array.isArray(social.friendships) ? social.friendships : []).map(sanitizeFriendship)
  };
}

function formatDeletionPreview(counts = {}) {
  const items = [
    ["训练档案", Number(counts.users || 0)],
    ["训练计划", Number(counts.plans || 0)],
    ["训练记录", Number(counts.trainingLogs || 0)],
    ["反馈", Number(counts.feedbacks || 0)],
    ["好友关系", Number(counts.friendships || 0)]
  ].filter((item) => item[1] > 0);
  if (!items.length) return "当前云端没有可删除的训练数据。";
  return `将永久删除${items.map(([label, count]) => `${label} ${count} 条`).join("、")}。`;
}

function getDataDeletionLockKey(openid) {
  return `${DATA_DELETION_LOCK_PREFIX}:${openid || "unknown"}`;
}

function isDeletionComplete(result) {
  return Boolean(result && result.complete === true && result.remaining && Object.values(result.remaining).every((value) => Number(value || 0) === 0));
}

function formatDeletionFailure(result = {}) {
  const remaining = result.remaining && typeof result.remaining === "object"
    ? Object.entries(result.remaining)
      .filter(([, count]) => Number(count || 0) > 0)
      .map(([key, count]) => `${DELETION_LABELS[key] || key} ${Number(count)} 条`)
    : [];
  const failed = Array.isArray(result.errors)
    ? Array.from(new Set(result.errors.map((item) => DELETION_LABELS[item && item.key] || "部分数据")))
    : [];

  if (remaining.length) return `云端仍有${remaining.join("、")}未删除。`;
  if (failed.length) return `${failed.join("、")}暂时未能完成删除或核对。`;
  return "暂时无法确认云端数据是否已经全部删除。";
}

module.exports = {
  DATA_DELETION_LOCK_PREFIX,
  DATA_EXPORT_SCHEMA,
  buildPortableDataExport,
  formatDeletionFailure,
  formatDeletionPreview,
  getDataDeletionLockKey,
  isDeletionComplete
};
