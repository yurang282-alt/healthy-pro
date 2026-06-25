const {
  buildCustomPlan,
  createExerciseFromKey,
  decoratePlanForWeapp,
  getExerciseOptions,
  reviewCustomPlanDraft
} = require("../../utils/coach");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createDraft(plan) {
  return {
    frequency: Number((plan.frequency && plan.frequency.sessionsPerWeek) || (plan.workouts || []).length || 3),
    workouts: clone(plan.workouts || [])
  };
}

function buildReviewItems(review) {
  if (!review) return [];
  const warnings = (review.warnings || []).map((text) => ({ type: "warning", label: "风险", text }));
  const suggestions = (review.suggestions || []).map((text) => ({ type: "suggestion", label: "建议", text }));
  const positives = (review.positives || []).map((text) => ({ type: "positive", label: "通过", text }));
  return warnings.concat(suggestions, positives);
}

Page({
  data: {
    draft: null,
    review: null,
    reviewItems: [],
    exerciseOptions: [],
    frequencyOptions: [2, 3, 4]
  },

  onLoad() {
    const app = getApp();
    const store = app.getStore();
    const context = app.getTrainingContext();
    const plan = decoratePlanForWeapp(context.user && context.user.plan, {
      assessment: store.user && store.user.assessment,
      logs: store.logs || [],
      week: context.week || 1
    });
    if (!plan) {
      wx.showToast({ title: "暂无计划", icon: "none" });
      wx.navigateBack();
      return;
    }

    this.setDraft(createDraft(plan));
    this.setData({ exerciseOptions: getExerciseOptions() });
  },

  getCurrentPlan() {
    const app = getApp();
    const store = app.getStore();
    const context = app.getTrainingContext();
    return decoratePlanForWeapp(context.user && context.user.plan, {
      assessment: store.user && store.user.assessment,
      logs: store.logs || [],
      week: context.week || 1
    });
  },

  setDraft(draft) {
    const app = getApp();
    const store = app.getStore();
    const plan = this.getCurrentPlan();
    const review = reviewCustomPlanDraft(plan, draft, store.user && store.user.assessment);
    this.setData({
      draft,
      review,
      reviewItems: buildReviewItems(review)
    });
  },

  setFrequency(event) {
    const frequency = Number(event.currentTarget.dataset.value);
    const draft = clone(this.data.draft);
    const workouts = draft.workouts || [];
    if (frequency < workouts.length) {
      draft.workouts = workouts.slice(0, frequency);
    } else {
      while (draft.workouts.length < frequency) {
        const source = workouts[workouts.length - 1] || workouts[0] || {
          title: "补充训练",
          focus: "从已有训练日复制，请确认动作和恢复安排。",
          exercises: [createExerciseFromKey("chest-press")]
        };
        draft.workouts.push({
          ...clone(source),
          id: `workout_custom_${Date.now()}_${draft.workouts.length}`,
          title: `训练日 ${draft.workouts.length + 1}`
        });
      }
    }
    draft.frequency = frequency;
    this.setDraft(draft);
  },

  setWorkoutField(event) {
    const index = Number(event.currentTarget.dataset.workoutIndex);
    const key = event.currentTarget.dataset.key;
    const draft = clone(this.data.draft);
    draft.workouts[index][key] = event.detail.value;
    this.setDraft(draft);
  },

  setExerciseField(event) {
    const workoutIndex = Number(event.currentTarget.dataset.workoutIndex);
    const exerciseIndex = Number(event.currentTarget.dataset.exerciseIndex);
    const key = event.currentTarget.dataset.key;
    const draft = clone(this.data.draft);
    draft.workouts[workoutIndex].exercises[exerciseIndex][key] = event.detail.value;
    this.setDraft(draft);
  },

  replaceExercise(event) {
    const workoutIndex = Number(event.currentTarget.dataset.workoutIndex);
    const exerciseIndex = Number(event.currentTarget.dataset.exerciseIndex);
    const optionIndex = Number(event.detail.value);
    const option = this.data.exerciseOptions[optionIndex];
    if (!option) return;

    const draft = clone(this.data.draft);
    draft.workouts[workoutIndex].exercises[exerciseIndex] = createExerciseFromKey(option.key);
    this.setDraft(draft);
  },

  addExercise(event) {
    const workoutIndex = Number(event.currentTarget.dataset.workoutIndex);
    const draft = clone(this.data.draft);
    draft.workouts[workoutIndex].exercises.push(createExerciseFromKey("chest-press"));
    this.setDraft(draft);
  },

  removeExercise(event) {
    const workoutIndex = Number(event.currentTarget.dataset.workoutIndex);
    const exerciseIndex = Number(event.currentTarget.dataset.exerciseIndex);
    const draft = clone(this.data.draft);
    if (draft.workouts[workoutIndex].exercises.length <= 1) {
      wx.showToast({ title: "至少保留 1 个动作", icon: "none" });
      return;
    }
    draft.workouts[workoutIndex].exercises.splice(exerciseIndex, 1);
    this.setDraft(draft);
  },

  savePlan() {
    const app = getApp();
    const store = app.getStore();
    const currentPlan = store.user && store.user.plan;
    if (!currentPlan) return;

    store.user.plan = buildCustomPlan(currentPlan, this.data.draft, {
      assessment: store.user && store.user.assessment,
      review: this.data.review
    });
    app.setStore(store);
    wx.showToast({ title: "已保存", icon: "success" });
    wx.switchTab({ url: "/pages/plan/plan" });
  },

  cancel() {
    wx.navigateBack();
  }
});
