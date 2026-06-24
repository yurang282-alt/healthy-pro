function getLatestTrainingFeedback(logs = []) {
  const sorted = logs.slice().sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
  const latest = sorted[sorted.length - 1];
  return latest && latest.coachFeedback && latest.coachFeedback.title ? latest.coachFeedback : null;
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
    showFirstUseGuide: false
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
    this.setData({
      plan,
      workout: context.workout,
      week: context.week,
      logsCount: logs.length,
      previewExercises: exercises.slice(0, 3),
      remainingCount: Math.max(0, exercises.length - 3),
      latestFeedback: getLatestTrainingFeedback(logs),
      showFirstUseGuide: Boolean(plan && !logs.length && !(store.onboarding && store.onboarding.firstUseGuideDismissed))
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

  dismissOnboarding() {
    const app = getApp();
    const store = app.getStore();
    store.onboarding = {
      ...(store.onboarding || {}),
      firstUseGuideDismissed: true
    };
    app.setStore(store);
    this.refresh();
  }
});
