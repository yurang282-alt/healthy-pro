const {
  adjustPlanFromLogs,
  canRestoreOriginalPlan,
  decoratePlanForWeapp,
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
    expandedWorkoutId: "",
    canRestoreOriginal: false,
    versionLabel: "AI 计划"
  },

  onShow() {
    this.refresh();
  },

  refresh(options = {}) {
    const app = getApp();
    const context = app.getTrainingContext();
    if (!context.user || !context.user.plan) {
      this.setData({
        plan: null,
        selectedWeek: 1,
        currentWeek: 1,
        selectedWeekInfo: null,
        logsCount: context.logs ? context.logs.length : 0,
        previousPlan: null,
        showPreviousPlan: false,
        expandedWorkoutId: "",
        canRestoreOriginal: false,
        versionLabel: "AI 计划"
      });
      return;
    }
    const selectedWeek = options.keepSelected
      ? this.data.selectedWeek
      : context.week;
    const safeWeek = Math.max(1, Math.min(4, Number(selectedWeek || context.week || 1)));
    const plan = decoratePlanForWeapp(context.user.plan, {
      assessment: context.user.assessment,
      logs: context.logs,
      week: safeWeek
    });
    const previousPlan = getPreviousPlan(plan);
    const workouts = plan && Array.isArray(plan.workouts) ? plan.workouts : [];
    const fallbackWorkoutId = context.workout && context.workout.id
      ? context.workout.id
      : workouts[0] && workouts[0].id;
    const currentExpandedId = options.keepExpanded ? this.data.expandedWorkoutId : fallbackWorkoutId;
    const expandedWorkoutId = workouts.some((item) => item.id === currentExpandedId)
      ? currentExpandedId
      : fallbackWorkoutId || "";
    this.setData({
      plan,
      selectedWeek: safeWeek,
      currentWeek: context.week,
      selectedWeekInfo: plan && plan.weeks ? plan.weeks[safeWeek - 1] : null,
      logsCount: context.logs.length,
      previousPlan,
      expandedWorkoutId,
      canRestoreOriginal: canRestoreOriginalPlan(plan),
      versionLabel: plan && plan.customization && plan.customization.label ? plan.customization.label : "AI 计划"
    });
  },

  chooseWeek(event) {
    const selectedWeek = Number(event.currentTarget.dataset.week);
    const store = getApp().getStore();
    if (!store.user || !store.user.plan) return;
    const plan = decoratePlanForWeapp(store.user && store.user.plan, {
      assessment: store.user && store.user.assessment,
      logs: store.logs || [],
      week: selectedWeek
    });
    const workouts = plan && Array.isArray(plan.workouts) ? plan.workouts : [];
    const expandedWorkoutId = workouts.some((item) => item.id === this.data.expandedWorkoutId)
      ? this.data.expandedWorkoutId
      : workouts[0] && workouts[0].id || "";
    this.setData({
      plan,
      selectedWeek,
      selectedWeekInfo: plan && plan.weeks ? plan.weeks[selectedWeek - 1] : null,
      expandedWorkoutId
    });
  },

  toggleWorkout(event) {
    const workoutId = event.currentTarget.dataset.id;
    this.setData({
      expandedWorkoutId: this.data.expandedWorkoutId === workoutId ? "" : workoutId
    });
  },

  goAssessment() {
    wx.navigateTo({ url: "/pages/assessment/assessment" });
  },

  editPlan() {
    wx.navigateTo({ url: "/pages/plan-editor/plan-editor" });
  },

  viewExercise(event) {
    const id = event.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/exercise-detail/exercise-detail?id=${encodeURIComponent(id)}&returnPath=${encodeURIComponent("/pages/plan/plan")}`
    });
  },

  togglePreviousPlan() {
    this.setData({
      showPreviousPlan: !this.data.showPreviousPlan
    });
  },

  adjustPlan() {
    const app = getApp();
    const store = app.getStore();
    const result = adjustPlanFromLogs(store.user && store.user.plan, store.logs || [], store.user && store.user.assessment);

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
        this.refresh({ keepSelected: true, keepExpanded: true });
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
          this.refresh({ keepSelected: true, keepExpanded: true });
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
          this.refresh({ keepSelected: true, keepExpanded: true });
          wx.showToast({ title: "已恢复", icon: "success" });
        }
      }
    });
  }
});
