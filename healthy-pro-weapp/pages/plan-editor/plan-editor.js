const {
  buildCustomPlan,
  createExerciseFromKey,
  getExerciseOptions
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

Page({
  data: {
    draft: null,
    exerciseOptions: [],
    frequencyOptions: [2, 3, 4]
  },

  onLoad() {
    const store = getApp().getStore();
    const plan = store.user && store.user.plan;
    if (!plan) {
      wx.showToast({ title: "暂无计划", icon: "none" });
      wx.navigateBack();
      return;
    }

    this.setData({
      draft: createDraft(plan),
      exerciseOptions: getExerciseOptions()
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
          exercises: [createExerciseFromKey("chestPress")]
        };
        draft.workouts.push({
          ...clone(source),
          id: `workout_custom_${Date.now()}_${draft.workouts.length}`,
          title: `训练日 ${draft.workouts.length + 1}`
        });
      }
    }
    draft.frequency = frequency;
    this.setData({ draft });
  },

  setWorkoutField(event) {
    const index = Number(event.currentTarget.dataset.workoutIndex);
    const key = event.currentTarget.dataset.key;
    const draft = clone(this.data.draft);
    draft.workouts[index][key] = event.detail.value;
    this.setData({ draft });
  },

  setExerciseField(event) {
    const workoutIndex = Number(event.currentTarget.dataset.workoutIndex);
    const exerciseIndex = Number(event.currentTarget.dataset.exerciseIndex);
    const key = event.currentTarget.dataset.key;
    const draft = clone(this.data.draft);
    draft.workouts[workoutIndex].exercises[exerciseIndex][key] = event.detail.value;
    this.setData({ draft });
  },

  replaceExercise(event) {
    const workoutIndex = Number(event.currentTarget.dataset.workoutIndex);
    const exerciseIndex = Number(event.currentTarget.dataset.exerciseIndex);
    const optionIndex = Number(event.detail.value);
    const option = this.data.exerciseOptions[optionIndex];
    if (!option) return;

    const draft = clone(this.data.draft);
    draft.workouts[workoutIndex].exercises[exerciseIndex] = createExerciseFromKey(option.key);
    this.setData({ draft });
  },

  addExercise(event) {
    const workoutIndex = Number(event.currentTarget.dataset.workoutIndex);
    const draft = clone(this.data.draft);
    draft.workouts[workoutIndex].exercises.push(createExerciseFromKey("chestPress"));
    this.setData({ draft });
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
    this.setData({ draft });
  },

  savePlan() {
    const app = getApp();
    const store = app.getStore();
    const currentPlan = store.user && store.user.plan;
    if (!currentPlan) return;

    store.user.plan = buildCustomPlan(currentPlan, this.data.draft);
    app.setStore(store);
    wx.showToast({ title: "已保存", icon: "success" });
    wx.switchTab({ url: "/pages/plan/plan" });
  },

  cancel() {
    wx.navigateBack();
  }
});
