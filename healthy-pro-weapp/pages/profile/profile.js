const { formatDateTime } = require("../../utils/format");

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

Page({
  data: {
    user: null,
    profile: null,
    logs: [],
    feedbacks: [],
    feedbackText: "",
    insights: null,
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
    this.setData({
      user: store.user,
      profile,
      logs: store.logs,
      feedbacks: store.feedbacks || [],
      insights,
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

  saveFeedback() {
    const content = String(this.data.feedbackText || "").trim();
    if (!content) {
      wx.showToast({ title: "先写一点反馈", icon: "none" });
      return;
    }
    const app = getApp();
    const store = app.getStore();
    store.feedbacks = Array.isArray(store.feedbacks) ? store.feedbacks : [];
    store.feedbacks.push({
      id: `feedback_${Date.now()}`,
      createdAt: new Date().toISOString(),
      content,
      source: "weapp"
    });
    app.setStore(store);
    this.setData({ feedbackText: "" });
    this.refresh();
    wx.showToast({ title: "已保存反馈", icon: "success" });
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
