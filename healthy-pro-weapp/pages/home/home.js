Page({
  data: {
    plan: null,
    workout: null,
    week: 1,
    logsCount: 0,
    previewExercises: [],
    remainingCount: 0
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const app = getApp();
    const context = app.getTrainingContext();
    const exercises = context.workout && context.workout.exercises ? context.workout.exercises : [];
    this.setData({
      plan: context.user.plan,
      workout: context.workout,
      week: context.week,
      logsCount: context.logs.length,
      previewExercises: exercises.slice(0, 3),
      remainingCount: Math.max(0, exercises.length - 3)
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
  }
});
