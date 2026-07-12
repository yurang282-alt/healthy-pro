const {
  adjustPlanFromLogs,
  canRestoreOriginalPlan,
  decoratePlanForWeapp,
  getPreviousPlan,
  restoreOriginalPlan,
  restorePreviousPlan
} = require("../../utils/coach");

function getVolumeTierLabel(value) {
  const labels = {
    compressed: "压缩训练量",
    base: "基础训练量",
    "moderate-hypertrophy": "中等增肌容量",
    hypertrophy: "增肌容量"
  };
  return labels[value] || "基础训练量";
}

function formatWeeklySetAnchor(anchor) {
  if (!anchor) return "未计算";
  return `每肌群 ${anchor.min}-${anchor.max} 组/周`;
}

function buildReviewItems(review) {
  if (!review) return [];
  const warnings = (review.warnings || []).map((text) => ({ type: "warning", label: "风险", text }));
  const suggestions = (review.suggestions || []).map((text) => ({ type: "suggestion", label: "建议", text }));
  const positives = (review.positives || []).map((text) => ({ type: "positive", label: "通过", text }));
  return warnings.concat(suggestions, positives);
}

function getCoachDetails(plan) {
  if (!plan) {
    return {
      coachFacts: [],
      coachReview: null,
      coachReviewItems: [],
      coachDecisionSummary: ""
    };
  }
  const review = plan.customization && plan.customization.review;
  const focusText = plan.focusText ||
    (plan.focusAreas || []).map((item) => item && item.label).filter(Boolean).join("、") ||
    "全身均衡";
  return {
    coachFacts: [
      { label: "目标阶段", value: plan.goal && plan.goal.type || "未评估" },
      { label: "时间上限", value: plan.frequency && plan.frequency.limitLabel || "教练安排" },
      { label: "训练经验", value: plan.experience && plan.experience.label || "未填写" },
      { label: "重点部位", value: focusText },
      { label: "容量判断", value: getVolumeTierLabel(plan.trainingProfile && plan.trainingProfile.volumeTier) },
      { label: "有效组数", value: formatWeeklySetAnchor(plan.trainingProfile && plan.trainingProfile.weeklySetAnchor) },
      { label: "恢复安排", value: plan.frequency && plan.frequency.restDays || "每次间隔至少 1 天" },
      { label: "时间分配", value: plan.duration && plan.duration.split || "已计入热身、休息和换器械时间" }
    ],
    coachReview: review || null,
    coachReviewItems: buildReviewItems(review),
    coachDecisionSummary: plan.decisionSummary && !review ? plan.decisionSummary : ""
  };
}

function getPlanConsole(plan, selectedWeekInfo, selectedWeek, expandedWorkoutId) {
  if (!plan) {
    return {
      stageLabel: "",
      nextWorkoutTitle: "",
      nextWorkoutFocus: "",
      frequencyLabel: "",
      durationLabel: "",
      focusLabel: "",
      progressPercent: 0
    };
  }
  const workouts = Array.isArray(plan.workouts) ? plan.workouts : [];
  const nextWorkout = workouts.find((item) => item.id === expandedWorkoutId) || workouts[0] || {};
  const focusLabel = plan.focusText ||
    (plan.focusAreas || []).map((item) => item && item.label).filter(Boolean).slice(0, 3).join("、") ||
    "全身均衡";
  return {
    stageLabel: `第 ${selectedWeek} 周 · ${selectedWeekInfo && selectedWeekInfo.label || "训练周"}`,
    nextWorkoutTitle: nextWorkout.title || "下一次训练",
    nextWorkoutFocus: nextWorkout.focus || "按计划完成本周训练",
    frequencyLabel: `${plan.frequency && plan.frequency.sessionsPerWeek || workouts.length || 0} 次/周`,
    durationLabel: plan.duration && plan.duration.label || `${plan.duration && plan.duration.budget || 60} 分钟`,
    focusLabel,
    progressPercent: Math.max(8, Math.min(100, Math.round((Number(selectedWeek || 1) / 4) * 100)))
  };
}

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
    versionLabel: "AI 计划",
    coachFacts: [],
    coachReview: null,
    coachReviewItems: [],
    coachDecisionSummary: "",
    planConsole: getPlanConsole(null),
    showPlanTools: false,
    showCoachDetails: false
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
        versionLabel: "AI 计划",
        coachFacts: [],
        coachReview: null,
        coachReviewItems: [],
        coachDecisionSummary: "",
        planConsole: getPlanConsole(null),
        showPlanTools: false,
        showCoachDetails: false
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
    const currentExpandedId = options.keepExpanded ? this.data.expandedWorkoutId : "";
    const expandedWorkoutId = currentExpandedId && workouts.some((item) => item.id === currentExpandedId)
      ? currentExpandedId
      : "";
    const coachDetails = getCoachDetails(plan);
    const selectedWeekInfo = plan && plan.weeks ? plan.weeks[safeWeek - 1] : null;
    this.setData({
      plan,
      selectedWeek: safeWeek,
      currentWeek: context.week,
      selectedWeekInfo,
      logsCount: context.logs.length,
      previousPlan,
      expandedWorkoutId,
      canRestoreOriginal: canRestoreOriginalPlan(plan),
      versionLabel: plan && plan.customization && plan.customization.label ? plan.customization.label : "AI 计划",
      planConsole: getPlanConsole(plan, selectedWeekInfo, safeWeek, expandedWorkoutId),
      ...coachDetails
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
    const expandedWorkoutId = this.data.expandedWorkoutId && workouts.some((item) => item.id === this.data.expandedWorkoutId)
      ? this.data.expandedWorkoutId
      : "";
    const coachDetails = getCoachDetails(plan);
    const selectedWeekInfo = plan && plan.weeks ? plan.weeks[selectedWeek - 1] : null;
    this.setData({
      plan,
      selectedWeek,
      selectedWeekInfo,
      expandedWorkoutId,
      planConsole: getPlanConsole(plan, selectedWeekInfo, selectedWeek, expandedWorkoutId),
      ...coachDetails
    });
  },

  toggleWorkout(event) {
    const workoutId = event.currentTarget.dataset.id;
    const expandedWorkoutId = this.data.expandedWorkoutId === workoutId ? "" : workoutId;
    this.setData({
      expandedWorkoutId,
      planConsole: getPlanConsole(this.data.plan, this.data.selectedWeekInfo, this.data.selectedWeek, expandedWorkoutId)
    });
  },

  goAssessment() {
    wx.navigateTo({ url: "/pages/assessment/assessment" });
  },

  goLog() {
    wx.switchTab({ url: "/pages/log/log" });
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

  togglePlanTools() {
    this.setData({
      showPlanTools: !this.data.showPlanTools
    });
  },

  toggleCoachDetails() {
    this.setData({
      showCoachDetails: !this.data.showCoachDetails
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
