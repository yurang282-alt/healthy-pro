function getLatestTrainingFeedback(logs = []) {
  const sorted = logs.slice().sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
  const latest = sorted[sorted.length - 1];
  return latest && latest.coachFeedback && latest.coachFeedback.title ? latest.coachFeedback : null;
}

function buildTrainingCockpit(plan, workout, week, logs = [], latestFeedback) {
  if (!plan || !workout) return null;

  const exercises = workout.exercises || [];
  const weeklyTarget = plan.frequency && plan.frequency.sessionsPerWeek
    ? plan.frequency.sessionsPerWeek
    : 0;
  const completedForTarget = weeklyTarget ? Math.min(logs.length, weeklyTarget) : logs.length;
  const progressPercent = weeklyTarget
    ? Math.min(100, Math.round((completedForTarget / weeklyTarget) * 100))
    : 0;
  const firstMove = exercises[0] || {};
  const focusText = plan.focusText || workout.focus || "动作稳定优先";

  return {
    stageLabel: `第 ${week} 周`,
    durationLabel: plan.duration && plan.duration.label ? plan.duration.label : "按计划完成",
    exercisesLabel: `${exercises.length} 个动作`,
    progressLabel: weeklyTarget ? `${completedForTarget}/${weeklyTarget}` : `${logs.length} 次`,
    progressPercent,
    readinessTitle: latestFeedback ? "参考上次反馈" : "准备开始",
    readinessText: latestFeedback
      ? latestFeedback.summary
      : "今天按顺序完成动作，动作稳定比追重量更重要。",
    focusText,
    firstCue: firstMove.cue || "先把第一个动作做稳，再继续推进。",
    primaryAction: "开始今日训练"
  };
}

function buildFirstUseGuide(plan, logs = [], onboarding = {}) {
  if (!plan) {
    if (onboarding.assessmentGuideDismissed) return { visible: false };
    return {
      visible: true,
      key: "assessment",
      eyebrow: "第一次使用",
      title: "先生成你的第一版计划",
      summary: "今天不用研究所有页面，先完成基础评估，系统会把训练目标、频次和动作安排出来。",
      primaryText: "开始评估",
      dismissText: "稍后再说",
      steps: [
        { index: 1, title: "填写基础信息", desc: "身高、体重、体脂、目标和每周时间。", state: "active" },
        { index: 2, title: "生成 4 周计划", desc: "先拿到教练视角的第一版安排。", state: "pending" },
        { index: 3, title: "开始第一次训练", desc: "按首页今日训练进入记录页。", state: "pending" }
      ]
    };
  }

  if (logs.length || onboarding.firstTrainingGuideDismissed) return { visible: false };
  return {
    visible: true,
    key: "firstTraining",
    eyebrow: "首训引导",
    title: "第一次训练，只做三件事",
    summary: "先不用纠结所有细节。今天按顺序完成动作，练完保存，下一次系统才能基于记录继续给建议。",
    primaryText: "开始训练",
    dismissText: "我知道了",
    steps: [
      { index: 1, title: "确认今天练什么", desc: "看主题、预计时长和前 3 个动作。", state: "done" },
      { index: 2, title: "逐项完成动作", desc: "记录页只看当前动作，完成后自动到下一项。", state: "active" },
      { index: 3, title: "保存本次训练", desc: "全部完成后点保存，进入历史记录。", state: "pending" }
    ]
  };
}

Page({
  data: {
    plan: null,
    workout: null,
    week: 1,
    logsCount: 0,
    previewExercises: [],
    remainingCount: 0,
    latestFeedback: null,
    cockpit: null,
    firstUseGuide: { visible: false }
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const app = getApp();
    const context = app.getTrainingContext();
    const store = app.getStore();
    const user = context.user || {};
    const plan = user.plan || null;
    const exercises = context.workout && context.workout.exercises ? context.workout.exercises : [];
    const logs = context.logs || [];
    const onboarding = store.onboarding || {};
    const latestFeedback = getLatestTrainingFeedback(logs);
    this.setData({
      plan,
      workout: context.workout,
      week: context.week,
      logsCount: logs.length,
      previewExercises: exercises.slice(0, 3),
      remainingCount: Math.max(0, exercises.length - 3),
      latestFeedback,
      cockpit: buildTrainingCockpit(plan, context.workout, context.week, logs, latestFeedback),
      firstUseGuide: buildFirstUseGuide(plan, logs, onboarding)
    });
  },

  goAssessment() {
    wx.navigateTo({ url: "/pages/assessment/assessment" });
  },

  startTraining() {
    wx.switchTab({ url: "/pages/log/log" });
  },

  goPlan() {
    wx.switchTab({ url: "/pages/plan/plan" });
  },

  handleGuidePrimary() {
    const guide = this.data.firstUseGuide || {};
    if (guide.key === "assessment") {
      this.goAssessment();
      return;
    }
    this.startTraining();
  },

  dismissFirstUseGuide() {
    const app = getApp();
    const store = app.getStore();
    const guide = this.data.firstUseGuide || {};
    const dismissKey = guide.key === "assessment"
      ? "assessmentGuideDismissed"
      : "firstTrainingGuideDismissed";
    store.onboarding = {
      ...(store.onboarding || {}),
      [dismissKey]: true
    };
    app.setStore(store);
    this.refresh();
  }
});
