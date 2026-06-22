const { getExerciseDetail } = require("../../utils/coach");

Page({
  data: {
    detail: null,
    returnPath: "/pages/plan/plan"
  },

  onLoad(options = {}) {
    const id = options.id || "";
    const returnPath = decodeURIComponent(options.returnPath || "/pages/plan/plan");
    this.setData({ returnPath });
    this.loadDetail(id);
  },

  loadDetail(id) {
    const app = getApp();
    const context = app.getTrainingContext();
    const detail = getExerciseDetail(id, {
      plan: context.user && context.user.plan,
      assessment: context.user && context.user.assessment,
      logs: context.logs || [],
      week: context.week || 1
    });
    this.setData({ detail });
  },

  viewRelated(event) {
    const id = event.currentTarget.dataset.id;
    if (!id) return;
    wx.redirectTo({
      url: `/pages/exercise-detail/exercise-detail?id=${encodeURIComponent(id)}&returnPath=${encodeURIComponent(this.data.returnPath)}`
    });
  },

  goBack() {
    const returnPath = this.data.returnPath || "/pages/plan/plan";
    if (returnPath.indexOf("/pages/home/") === 0 || returnPath.indexOf("/pages/plan/") === 0 || returnPath.indexOf("/pages/log/") === 0 || returnPath.indexOf("/pages/equipment/") === 0 || returnPath.indexOf("/pages/profile/") === 0) {
      wx.switchTab({ url: returnPath });
      return;
    }
    wx.navigateBack({ delta: 1 });
  }
});
