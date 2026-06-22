const { formatDateTime } = require("../../utils/format");

const LOCAL_RELEASES = [
  {
    id: "weapp-v0.1.0",
    version: "v0.1.0",
    title: "小程序端 MVP 启动",
    summary: "新增 Healthy Pro 微信小程序端骨架，可在微信里查看计划、记录训练和浏览器械。",
    highlights: ["保留 PWA 已验证的训练模型", "支持微信云保存训练计划和记录", "移动端界面按微信小程序重新整理"],
    releaseType: "feature",
    publishedAt: "2026-06-15T00:00:00+08:00"
  },
  {
    id: "weapp-v0.2.0",
    version: "v0.2.0",
    title: "小程序功能对齐",
    summary: "补齐 PWA 已验证的训练中辅助、好友排行、结构化反馈和更新公告能力。",
    highlights: ["记录页升级为训练助手", "我的页支持好友码、排行和反馈", "更新公告可以标记已读"],
    releaseType: "improvement",
    publishedAt: "2026-06-20T00:00:00+08:00"
  },
  {
    id: "weapp-v0.3.0",
    version: "v0.3.0",
    title: "完整迁移 PWA 已验证功能",
    summary: "补齐训练中辅助、好友排行、结构化反馈和更新公告，让小程序端体验接近 PWA。",
    highlights: ["训练记录支持当前动作、休息倒计时和动作详情", "我的页支持好友码、好友请求、排行和反馈", "更新公告可查看多版本并标记已读"],
    releaseType: "feature",
    publishedAt: "2026-06-22T00:00:00+08:00"
  },
  {
    id: "weapp-v0.3.1",
    version: "v0.3.1",
    title: "微信用户数据隔离修复",
    summary: "小程序启动时会自动绑定当前微信用户，新用户不再默认进入同一套演示计划。",
    highlights: ["启动时自动读取微信身份并按 openid 加载云端数据", "新用户先进入基础评估，不再共用默认 demo 计划", "本地训练草稿和身体草稿按微信用户隔离"],
    releaseType: "fix",
    publishedAt: "2026-06-22T12:00:00+08:00"
  }
];

const FEEDBACK_RATING_OPTIONS = [
  { value: "5", label: "5 分", note: "很顺" },
  { value: "4", label: "4 分", note: "还不错" },
  { value: "3", label: "3 分", note: "一般" },
  { value: "2", label: "2 分", note: "有点卡" },
  { value: "1", label: "1 分", note: "不好用" }
];

const FEEDBACK_CATEGORY_OPTIONS = [
  { value: "confusing", label: "看不懂" },
  { value: "plan", label: "计划不合理" },
  { value: "equipment", label: "器械找不到" },
  { value: "ux", label: "页面不好用" },
  { value: "other", label: "其他" }
];

const SHARE_OPTION_CONFIG = [
  { key: "shareLeaderboard", label: "参与好友排行", note: "展示完成率、次数和连续周数" },
  { key: "shareWeeklySummary", label: "共享本周摘要", note: "不展示体重、体脂和训练重量" }
];

function sortRecords(records = []) {
  return records.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function getStartOfLocalWeek(now = new Date()) {
  const date = new Date(now);
  const day = date.getDay() || 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day + 1);
  return date;
}

function getLatest(records = []) {
  return records.length ? records[records.length - 1] : null;
}

function getIntensityLabel(value) {
  if (value === "too-easy") return "偏轻松";
  if (value === "too-hard") return "偏吃力";
  return "刚刚好";
}

function getAverageFeelingLabel(value) {
  if (!Number.isFinite(value)) return "还未记录";
  if (value <= 2.4) return "偏轻松";
  if (value <= 4.2) return "刚刚好";
  if (value <= 5.8) return "有点吃力";
  return "偏难";
}

function getWeekKey(dateValue) {
  const date = new Date(dateValue);
  const start = getStartOfLocalWeek(date);
  return `${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}`;
}

function getBestWeeklyLogCount(logs) {
  const counts = {};
  logs.forEach((log) => {
    const key = getWeekKey(log.createdAt);
    counts[key] = (counts[key] || 0) + 1;
  });
  return Math.max(0, ...Object.values(counts));
}

function getRecentWeekBuckets(logs, weekTarget, now = new Date()) {
  const currentStart = getStartOfLocalWeek(now);
  const labels = ["3周前", "2周前", "上周", "本周"];
  return labels.map((label, index) => {
    const start = new Date(currentStart);
    start.setDate(currentStart.getDate() - (3 - index) * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const weekLogs = logs.filter((log) => {
      const createdAt = new Date(log.createdAt);
      return createdAt >= start && createdAt < end;
    });
    return {
      label,
      count: weekLogs.length,
      rate: weekTarget ? Math.min(100, Math.round((weekLogs.length / weekTarget) * 100)) : 0
    };
  });
}

function getIntensityInsights(logs) {
  const recent = logs.slice(-6);
  const feelings = recent
    .reduce((list, log) => list.concat(log.exercises || []), [])
    .filter((exercise) => exercise.done && Number.isFinite(Number(exercise.feeling)))
    .map((exercise) => Number(exercise.feeling));
  const averageFeeling = feelings.length
    ? feelings.reduce((sum, value) => sum + value, 0) / feelings.length
    : NaN;
  return {
    recentCount: recent.length,
    tooEasy: recent.filter((log) => log.intensityFeedback === "too-easy").length,
    right: recent.filter((log) => !log.intensityFeedback || log.intensityFeedback === "right").length,
    tooHard: recent.filter((log) => log.intensityFeedback === "too-hard").length,
    feelingLabel: getAverageFeelingLabel(averageFeeling),
    latestFeedbackLabel: getIntensityLabel((getLatest(recent) || {}).intensityFeedback)
  };
}

function getBodyTrend(bodyLogs) {
  const latest = getLatest(bodyLogs);
  const previous = bodyLogs.length > 1 ? bodyLogs[bodyLogs.length - 2] : null;
  const weightDelta = latest && previous
    ? `${latest.weight >= previous.weight ? "+" : ""}${(latest.weight - previous.weight).toFixed(1)}kg`
    : "暂无对比";
  return {
    latest,
    previous,
    weightDelta
  };
}

function getProfileCoachMessage({ logs, weekTarget, thisWeekCount, intensity, bodyTrend }) {
  if (!logs.length) return "先完成 1-2 次训练记录，这里会开始判断训练频次、强度和身体变化。";
  if (intensity.tooHard >= 2) return "近几次训练有偏强信号，下一次先保持重量或少做 1 组。";
  if (intensity.tooEasy >= 2) return "近几次反馈偏轻松，如果动作稳定，可以在计划页重新调整。";
  if (weekTarget && thisWeekCount < weekTarget) return `本周还差 ${weekTarget - thisWeekCount} 次训练，优先完成计划频次。`;
  if (bodyTrend.latest && bodyTrend.previous && Math.abs(bodyTrend.latest.weight - bodyTrend.previous.weight) >= 1.5) return "最近体重波动较大，训练计划先不要只根据单次体重调整。";
  return "当前节奏比较稳定，继续按计划记录训练和身体状态。";
}

function getCurrentTrainingWeekStreak(logs, now = new Date()) {
  if (!logs.length) return 0;
  const weeks = new Set(logs.map((log) => getWeekKey(log.createdAt)));
  let streak = 0;
  let cursor = getStartOfLocalWeek(now);
  while (weeks.has(getWeekKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

function getProfileInsights(user, logs = [], bodyLogs = []) {
  const sortedLogs = sortRecords(logs);
  const sortedBodyLogs = sortRecords(bodyLogs);
  const weekTarget = Number(user && user.plan && user.plan.frequency && user.plan.frequency.sessionsPerWeek || 0);
  const now = new Date();
  const weekStart = getStartOfLocalWeek(now);
  const thisWeekLogs = sortedLogs.filter((log) => {
    const createdAt = new Date(log.createdAt);
    return createdAt >= weekStart && createdAt <= now;
  });
  const thisWeekCompleted = thisWeekLogs.reduce((sum, log) => sum + Number(log.completedCount || 0), 0);
  const intensity = getIntensityInsights(sortedLogs);
  const bodyTrend = getBodyTrend(sortedBodyLogs);
  const weeklyBuckets = getRecentWeekBuckets(sortedLogs, weekTarget, now);
  const bestWorkout = Math.max(0, ...sortedLogs.map((log) => Number(log.completedCount || 0)));
  const totalCompleted = sortedLogs.reduce((sum, log) => sum + Number(log.completedCount || 0), 0);
  const weekCompletionRate = weekTarget ? Math.min(100, Math.round((thisWeekLogs.length / weekTarget) * 100)) : 0;
  return {
    weekTarget,
    thisWeekCount: thisWeekLogs.length,
    thisWeekCompleted,
    weekCompletionRate,
    weekTargetText: weekTarget || "-",
    latestWeightText: bodyTrend.latest ? `${bodyTrend.latest.weight}kg` : "未记",
    streakText: `${getCurrentTrainingWeekStreak(sortedLogs, now)} 周`,
    intensity,
    bodyTrend,
    weeklyBuckets,
    latestLog: getLatest(sortedLogs),
    coachMessage: getProfileCoachMessage({ logs: sortedLogs, weekTarget, thisWeekCount: thisWeekLogs.length, intensity, bodyTrend }),
    records: [
      { label: "累计训练", value: `${sortedLogs.length} 次`, note: `${totalCompleted} 个动作被记录` },
      { label: "最佳训练周", value: `${getBestWeeklyLogCount(sortedLogs)} 次`, note: "按自然周统计" },
      { label: "连续训练周", value: `${getCurrentTrainingWeekStreak(sortedLogs, now)} 周`, note: "本周有记录才会延续" },
      { label: "单次完成最多", value: `${bestWorkout} 动作`, note: "观察执行稳定性" },
      { label: "最近体重", value: bodyTrend.latest ? `${bodyTrend.latest.weight}kg` : "未记录", note: bodyTrend.latest ? formatDateTime(bodyTrend.latest.createdAt) : "去记录页保存体重" },
      { label: "最近体脂", value: bodyTrend.latest && bodyTrend.latest.bodyFat ? `${bodyTrend.latest.bodyFat}%` : "未记录", note: "可选记录，不按 0 处理" }
    ]
  };
}

function formatReleaseDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getReleaseTypeLabel(type) {
  if (type === "feature") return "新功能";
  if (type === "fix") return "修复";
  return "优化";
}

function buildReleaseState(store) {
  const reads = store.releaseReads || {};
  const releases = LOCAL_RELEASES
    .slice()
    .sort((left, right) => new Date(right.publishedAt) - new Date(left.publishedAt))
    .map((release) => ({
      ...release,
      dateLabel: formatReleaseDate(release.publishedAt),
      typeLabel: getReleaseTypeLabel(release.releaseType),
      isRead: Boolean(reads[release.id])
    }));
  return {
    releases,
    unreadCount: releases.filter((release) => !release.isRead).length,
    unreadLabel: releases.filter((release) => !release.isRead).length
      ? `${releases.filter((release) => !release.isRead).length} 条未读`
      : "已读"
  };
}

function buildShareOptions(profile) {
  return SHARE_OPTION_CONFIG.map((item) => ({
    ...item,
    checked: profile[item.key] !== false
  }));
}

function buildLocalLeaderboard(social, insights) {
  const profile = social.friendProfile || {};
  const accepted = (social.friendships || []).filter((item) => item.status === "accepted");
  const self = profile.shareLeaderboard !== false ? [{
    isSelf: true,
    nickname: profile.nickname || "微信用户",
    currentWeekCount: insights.thisWeekCount || 0,
    currentWeekCompleted: insights.thisWeekCompleted || 0,
    currentWeekCompletionRate: insights.weekCompletionRate || 0,
    streakWeeks: Number(String(insights.streakText || "0").replace(/[^\d]/g, "") || 0)
  }] : [];
  return self.concat(accepted.filter((item) => item.shareLeaderboard !== false)).sort((left, right) => (
    Number(right.currentWeekCompletionRate || 0) - Number(left.currentWeekCompletionRate || 0) ||
    Number(right.currentWeekCount || 0) - Number(left.currentWeekCount || 0) ||
    Number(right.streakWeeks || 0) - Number(left.streakWeeks || 0)
  ));
}

function buildSocialView(store, insights) {
  const social = store.social || {};
  const profile = social.friendProfile || {};
  const friendships = Array.isArray(social.friendships) ? social.friendships : [];
  const incoming = friendships.filter((item) => item.status === "pending" && item.direction === "incoming");
  const outgoing = friendships.filter((item) => item.status === "pending" && item.direction === "outgoing");
  const accepted = friendships.filter((item) => item.status === "accepted");
  const leaderboard = Array.isArray(social.leaderboard) && social.leaderboard.length
    ? social.leaderboard
    : buildLocalLeaderboard(social, insights);
  const decorateFriend = (item) => ({
    ...item,
    displaySummary: item.shareLeaderboard === false
      ? "对方未参与排行"
      : `本周 ${item.currentWeekCount || 0} 次 · 完成率 ${item.currentWeekCompletionRate || 0}%`
  });
  return {
    enabled: Boolean(store.cloud && store.cloud.enabled),
    friendProfile: profile,
    shareOptions: buildShareOptions(profile),
    incoming: incoming.map(decorateFriend),
    outgoing: outgoing.map(decorateFriend),
    accepted: accepted.map(decorateFriend),
    leaderboard: leaderboard.map((item, index) => ({
      ...item,
      rank: index + 1,
      displayName: `${item.nickname || "微信用户"}${item.isSelf ? " · 我" : ""}`,
      displaySummary: `完成率 ${item.currentWeekCompletionRate || 0}% · 本周 ${item.currentWeekCount || 0} 次 · 连续 ${item.streakWeeks || 0} 周`
    })),
    leaderboardCount: leaderboard.length,
    lastSyncedLabel: social.lastSyncedAt ? formatDateTime(social.lastSyncedAt) : "",
    summary: social.summary || {}
  };
}

Page({
  data: {
    user: null,
    profile: null,
    logs: [],
    feedbacks: [],
    feedbackText: "",
    feedbackRating: "5",
    feedbackCategory: "confusing",
    feedbackRatingOptions: FEEDBACK_RATING_OPTIONS,
    feedbackCategoryOptions: FEEDBACK_CATEGORY_OPTIONS,
    insights: null,
    socialView: null,
    socialNickname: "",
    friendCodeInput: "",
    releaseState: null,
    completionRate: 0,
    syncStatusText: "本地",
    lastSyncedLabel: ""
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const app = getApp();
    const store = app.getStore();
    const target = Number((store.user.plan && store.user.plan.frequency && store.user.plan.frequency.sessionsPerWeek) || 0);
    const count = store.logs.length;
    const profile = store.profile || {};
    const lastSyncedAt = profile.lastSyncedAt || (store.cloud && store.cloud.lastPushedAt) || "";
    const insights = getProfileInsights(store.user, store.logs || [], store.bodyLogs || []);
    const socialView = buildSocialView(store, insights);
    this.setData({
      user: store.user,
      profile,
      logs: store.logs,
      feedbacks: store.feedbacks || [],
      insights,
      socialView,
      socialNickname: socialView.friendProfile.nickname || profile.nickname || "微信用户",
      releaseState: buildReleaseState(store),
      completionRate: target ? Math.min(100, Math.round((count / target) * 100)) : 0,
      syncStatusText: this.getSyncStatusText(profile),
      lastSyncedLabel: lastSyncedAt ? formatDateTime(lastSyncedAt) : ""
    });
  },

  getSyncStatusText(profile) {
    if (!profile) return "本地";
    if (profile.syncStatus === "synced") return "已同步";
    if (profile.syncStatus === "syncing" || profile.syncStatus === "connecting") return "同步中";
    if (profile.syncStatus === "error") return "需重试";
    return profile.modeLabel || "本地";
  },

  goAssessment() {
    wx.navigateTo({ url: "/pages/assessment/assessment" });
  },

  goLog() {
    wx.switchTab({ url: "/pages/log/log" });
  },

  goPlan() {
    wx.switchTab({ url: "/pages/plan/plan" });
  },

  setFeedbackText(event) {
    this.setData({ feedbackText: event.detail.value });
  },

  chooseFeedbackRating(event) {
    this.setData({ feedbackRating: String(event.currentTarget.dataset.value || "5") });
  },

  chooseFeedbackCategory(event) {
    this.setData({ feedbackCategory: String(event.currentTarget.dataset.value || "other") });
  },

  saveFeedback() {
    const content = String(this.data.feedbackText || "").trim();
    if (content.length < 2) {
      wx.showToast({ title: "至少写 2 个字", icon: "none" });
      return;
    }
    const app = getApp();
    const store = app.getStore();
    store.feedbacks = Array.isArray(store.feedbacks) ? store.feedbacks : [];
    store.feedbacks.push({
      id: `feedback_${Date.now()}`,
      createdAt: new Date().toISOString(),
      content,
      message: content,
      rating: Number(this.data.feedbackRating || 5),
      category: this.data.feedbackCategory || "other",
      page: "profile",
      source: "weapp"
    });
    app.setStore(store);
    this.setData({ feedbackText: "" });
    this.refresh();
    wx.showToast({ title: "已保存反馈", icon: "success" });
  },

  setSocialNickname(event) {
    this.setData({ socialNickname: event.detail.value });
  },

  toggleShareOption(event) {
    const key = event.currentTarget.dataset.key;
    const socialView = {
      ...this.data.socialView,
      shareOptions: (this.data.socialView.shareOptions || []).map((item) => (
        item.key === key ? { ...item, checked: !item.checked } : item
      ))
    };
    this.setData({ socialView });
  },

  saveSocialProfile() {
    const nickname = String(this.data.socialNickname || "").trim().slice(0, 16);
    if (!nickname) {
      wx.showToast({ title: "昵称不能为空", icon: "none" });
      return;
    }
    const app = getApp();
    const store = app.getStore();
    const optionMap = (this.data.socialView.shareOptions || []).reduce((map, item) => {
      map[item.key] = item.checked !== false;
      return map;
    }, {});
    store.profile = {
      ...(store.profile || {}),
      nickname
    };
    store.social = {
      ...(store.social || {}),
      friendProfile: {
        ...(store.social && store.social.friendProfile || {}),
        nickname,
        shareLeaderboard: optionMap.shareLeaderboard !== false,
        shareWeeklySummary: optionMap.shareWeeklySummary !== false
      }
    };
    app.setStore(store);
    this.refresh();
    wx.showToast({ title: "已保存设置", icon: "success" });
  },

  copyFriendCode() {
    const code = this.data.socialView && this.data.socialView.friendProfile && this.data.socialView.friendProfile.friendCode;
    if (!code) return;
    wx.setClipboardData({
      data: code,
      success: () => wx.showToast({ title: "好友码已复制", icon: "success" })
    });
  },

  setFriendCodeInput(event) {
    this.setData({ friendCodeInput: String(event.detail.value || "").toUpperCase() });
  },

  addFriend() {
    const code = String(this.data.friendCodeInput || "").trim().toUpperCase();
    if (!code) {
      wx.showToast({ title: "先输入好友码", icon: "none" });
      return;
    }
    const ownCode = this.data.socialView && this.data.socialView.friendProfile && this.data.socialView.friendProfile.friendCode;
    if (code === ownCode) {
      wx.showToast({ title: "不能添加自己", icon: "none" });
      return;
    }
    const app = getApp();
    const store = app.getStore();
    if (!store.cloud || !store.cloud.enabled) {
      wx.showToast({ title: "先连接微信云", icon: "none" });
      return;
    }
    wx.showLoading({ title: "发送中" });
    app.addCloudFriendByCode(code)
      .then(() => {
        wx.hideLoading();
        this.setData({ friendCodeInput: "" });
        this.refresh();
        wx.showToast({ title: "已发送请求", icon: "success" });
      })
      .catch((error) => {
        wx.hideLoading();
        wx.showModal({
          title: "添加失败",
          content: error && (error.errMsg || error.message) || "请确认好友码是否正确。",
          showCancel: false
        });
      });
  },

  respondFriend(event) {
    const friendshipId = event.currentTarget.dataset.id;
    const status = event.currentTarget.dataset.status;
    if (!friendshipId) return;
    wx.showLoading({ title: status === "accepted" ? "确认中" : "处理中" });
    getApp().respondCloudFriendship(friendshipId, status)
      .then(() => {
        wx.hideLoading();
        this.refresh();
        wx.showToast({ title: status === "accepted" ? "已确认" : "已拒绝", icon: "success" });
      })
      .catch((error) => {
        wx.hideLoading();
        wx.showModal({
          title: "操作失败",
          content: error && (error.errMsg || error.message) || "请稍后再试。",
          showCancel: false
        });
      });
  },

  removeFriend(event) {
    const friendshipId = event.currentTarget.dataset.id;
    if (!friendshipId) return;
    wx.showModal({
      title: "移除好友",
      content: "移除后，对方不会再出现在你的好友排行里。",
      confirmText: "移除",
      cancelText: "取消",
      success: (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: "移除中" });
        getApp().removeCloudFriendship(friendshipId)
          .then(() => {
            wx.hideLoading();
            this.refresh();
            wx.showToast({ title: "已移除", icon: "success" });
          })
          .catch((error) => {
            wx.hideLoading();
            wx.showModal({
              title: "移除失败",
              content: error && (error.errMsg || error.message) || "请稍后再试。",
              showCancel: false
            });
          });
      }
    });
  },

  markReleaseRead(event) {
    const releaseId = event.currentTarget.dataset.id;
    if (!releaseId) return;
    const app = getApp();
    const store = app.getStore();
    store.releaseReads = {
      ...(store.releaseReads || {}),
      [releaseId]: new Date().toISOString()
    };
    app.setStore(store);
    this.refresh();
    wx.showToast({ title: "已标记已读", icon: "success" });
  },

  resetDemo() {
    wx.showModal({
      title: "重置训练数据",
      content: "会把当前计划和训练记录重置为演示数据；如果云端已连接，也会同步覆盖云端。",
      confirmText: "重置",
      cancelText: "取消",
      success: (res) => {
        if (!res.confirm) return;
        const app = getApp();
        app.resetDemo();
        this.refresh();
        wx.showToast({ title: "已重置", icon: "success" });
      }
    });
  },

  syncCloud() {
    const app = getApp();
    wx.showLoading({ title: "同步中" });
    app.syncCloudNow()
      .then(() => app.refreshCloudSocial().catch(() => null))
      .then(() => {
        wx.hideLoading();
        this.refresh();
        wx.showToast({ title: "已同步", icon: "success" });
      })
      .catch((error) => {
        wx.hideLoading();
        wx.showModal({
          title: "同步失败",
          content: error && (error.errMsg || error.message) || "请稍后再试。",
          showCancel: false
        });
      });
  }
});
