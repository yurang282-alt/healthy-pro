const {
  adjustPlanFromLogs,
  canRestoreOriginalPlan,
  getPreviousPlan,
  restoreOriginalPlan,
  restorePreviousPlan
} = require("../../utils/coach");

Page({
  data: {
    plan: null,
    selectedWeek: 1,
    currentWeek: 1,
    selectedWeekInfo: null,
    logsCount: 0,
    previousPlan: null,
    showPreviousPlan: false,
    canRestoreOriginal: false,
    versionLabel: "AI 计划"
  },

  onShow() {
    this.refresh();
  },

  refresh(options = {}) {
    const app = getApp();
    const context = app.getTrainingContext();
    const plan = context.user.plan;
    const selectedWeek = options.keepSelected
      ? this.data.selectedWeek
      : context.week;
    const safeWeek = Math.max(1, Math.min(4, Number(selectedWeek || context.week || 1)));
    const previousPlan = getPreviousPlan(plan);
    this.setData({
      plan,
      selectedWeek: safeWeek,
      currentWeek: context.week,
      selectedWeekInfo: plan && plan.weeks ? plan.weeks[safeWeek - 1] : null,
      logsCount: context.logs.length,
      previousPlan,
      canRestoreOriginal: canRestoreOriginalPlan(plan),
      versionLabel: plan && plan.customization && plan.customization.label ? plan.customization.label : "AI 计划"
    });
  },

  chooseWeek(event) {
    const selectedWeek = Number(event.currentTarget.dataset.week);
    this.setData({
      selectedWeek,
      selectedWeekInfo: this.data.plan && this.data.plan.weeks ? this.data.plan.weeks[selectedWeek - 1] : null
    });
  },

  goAssessment() {
    wx.navigateTo({ url: "/pages/assessment/assessment" });
  },

  editPlan() {
    wx.navigateTo({ url: "/pages/plan-editor/plan-editor" });
  },

  togglePreviousPlan() {
    this.setData({
      showPreviousPlan: !this.data.showPreviousPlan
    });
  },

  adjustPlan() {
    const app = getApp();
    const store = app.getStore();
    const result = adjustPlanFromLogs(store.user && store.user.plan, store.logs || []);

    if (!result.plan || result.signal.status === "empty") {
      wx.showModal({
        title: result.signal.title,
        content: result.signal.summary,
        showCancel: false
      });
      return;
    }

    wx.showModal({
      title: "重新调整计划",
      content: result.signal.summary,
      confirmText: "应用调整",
      cancelText: "先不改",
      success: (res) => {
        if (!res.confirm) return;
        store.user.plan = result.plan;
        app.setStore(store);
        this.refresh({ keepSelected: true });
        wx.showToast({
          title: result.changed ? "已调整" : "已复盘",
          icon: "success"
        });
      }
    });
  },

  restorePrevious() {
    const app = getApp();
    const store = app.getStore();
    const result = restorePreviousPlan(store.user && store.user.plan);
    wx.showModal({
      title: "恢复上一版",
      content: result.message,
      showCancel: result.changed,
      confirmText: result.changed ? "恢复" : "知道了",
      success: (res) => {
        if (result.changed && res.confirm) {
          store.user.plan = result.plan;
          app.setStore(store);
          this.setData({ showPreviousPlan: false });
          this.refresh({ keepSelected: true });
          wx.showToast({ title: "已恢复", icon: "success" });
        }
      }
    });
  },

  restoreOriginal() {
    const app = getApp();
    const store = app.getStore();
    const result = restoreOriginalPlan(store.user && store.user.plan);
    wx.showModal({
      title: "恢复 AI 计划",
      content: result.message,
      showCancel: result.changed,
      confirmText: result.changed ? "恢复" : "知道了",
      success: (res) => {
        if (result.changed && res.confirm) {
          store.user.plan = result.plan;
          app.setStore(store);
          this.setData({ showPreviousPlan: false });
          this.refresh({ keepSelected: true });
          wx.showToast({ title: "已恢复", icon: "success" });
        }
      }
    });
  }
});
