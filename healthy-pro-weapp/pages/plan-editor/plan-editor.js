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

function parseFirstNumber(value, fallback = 1) {
  const match = String(value ?? "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number(fallback);
}

function parseRestSeconds(value, fallback = 60) {
  if (String(value ?? "").indexOf("无") >= 0) return 0;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 0) return Math.round(numeric);
  const secondsMatch = String(value ?? "").match(/(\d+(?:\.\d+)?)\s*秒/);
  if (secondsMatch) return Math.round(Number(secondsMatch[1]));
  const minutesMatch = String(value ?? "").match(/(\d+(?:\.\d+)?)\s*分钟/);
  if (minutesMatch) return Math.round(Number(minutesMatch[1]) * 60);
  return Number(fallback || 60);
}

function prepareExerciseForEditor(exercise) {
  const safeExercise = exercise || {};
  const isCardio = safeExercise.type === "cardio";
  return {
    ...safeExercise,
    editSets: isCardio ? 1 : Math.max(1, Math.round(parseFirstNumber(
      safeExercise.editSets || safeExercise.baseSets || safeExercise.sets,
      safeExercise.baseSets || 1
    ))),
    reps: isCardio
      ? String(safeExercise.target || safeExercise.reps || "5-8 分钟")
      : String(safeExercise.reps || "10-12 次"),
    restSeconds: parseRestSeconds(
      safeExercise.restSeconds !== undefined ? safeExercise.restSeconds : safeExercise.rest,
      isCardio ? 0 : 60
    )
  };
}

function prepareWorkoutForEditor(workout, index = 0) {
  const safeWorkout = workout || {};
  return {
    ...safeWorkout,
    id: safeWorkout.id || `workout_editor_${Date.now()}_${index}`,
    title: safeWorkout.title || `训练日 ${index + 1}`,
    focus: safeWorkout.focus || "按当前目标执行，注意动作质量。",
    exercises: (safeWorkout.exercises || []).map(prepareExerciseForEditor)
  };
}

function createDraft(plan) {
  return {
    frequency: Number((plan.frequency && plan.frequency.sessionsPerWeek) || (plan.workouts || []).length || 3),
    workouts: clone(plan.workouts || []).map(prepareWorkoutForEditor)
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
    selectedWorkoutIndex: 0,
    selectedWorkout: null,
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
    const workoutCount = (draft.workouts || []).length;
    const selectedWorkoutIndex = Math.max(0, Math.min(workoutCount - 1, Number(this.data.selectedWorkoutIndex || 0)));
    this.setData({
      draft,
      selectedWorkoutIndex,
      selectedWorkout: workoutCount ? draft.workouts[selectedWorkoutIndex] : null,
      review,
      reviewItems: buildReviewItems(review)
    });
  },

  chooseWorkoutTab(event) {
    const selectedWorkoutIndex = Number(event.currentTarget.dataset.index || 0);
    const draft = clone(this.data.draft);
    this.setData({
      selectedWorkoutIndex,
      selectedWorkout: draft.workouts && draft.workouts[selectedWorkoutIndex] || null
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
          ...prepareWorkoutForEditor(clone(source), draft.workouts.length),
          id: `workout_custom_${Date.now()}_${draft.workouts.length}`,
          title: `训练日 ${draft.workouts.length + 1}`
        });
      }
    }
    draft.frequency = frequency;
    this.setDraft(draft);
  },

  setWorkoutField(event) {
    const index = Number(event.currentTarget.dataset.workoutIndex ?? this.data.selectedWorkoutIndex);
    const key = event.currentTarget.dataset.key;
    const draft = clone(this.data.draft);
    draft.workouts[index][key] = event.detail.value;
    this.setDraft(draft);
  },

  setExerciseField(event) {
    const workoutIndex = Number(event.currentTarget.dataset.workoutIndex ?? this.data.selectedWorkoutIndex);
    const exerciseIndex = Number(event.currentTarget.dataset.exerciseIndex);
    const key = event.currentTarget.dataset.key;
    let value = event.detail.value;
    if (key === "editSets") value = Math.max(1, Math.min(12, Math.round(Number(value || 1))));
    if (key === "restSeconds") value = Math.max(0, Math.min(300, Math.round(Number(value || 0))));
    const draft = clone(this.data.draft);
    draft.workouts[workoutIndex].exercises[exerciseIndex][key] = value;
    this.setDraft(draft);
  },

  replaceExercise(event) {
    const workoutIndex = Number(event.currentTarget.dataset.workoutIndex ?? this.data.selectedWorkoutIndex);
    const exerciseIndex = Number(event.currentTarget.dataset.exerciseIndex);
    const optionIndex = Number(event.detail.value);
    const option = this.data.exerciseOptions[optionIndex];
    if (!option) return;

    const app = getApp();
    const store = app.getStore();
    const context = app.getTrainingContext();
    const draft = clone(this.data.draft);
    draft.workouts[workoutIndex].exercises[exerciseIndex] = prepareExerciseForEditor(createExerciseFromKey(option.key, {
      assessment: store.user && store.user.assessment,
      logs: store.logs || [],
      week: context.week || 1,
      plan: store.user && store.user.plan
    }));
    this.setDraft(draft);
  },

  addExercise(event) {
    const workoutIndex = Number(event.currentTarget.dataset.workoutIndex ?? this.data.selectedWorkoutIndex);
    const app = getApp();
    const store = app.getStore();
    const context = app.getTrainingContext();
    const draft = clone(this.data.draft);
    draft.workouts[workoutIndex].exercises.push(prepareExerciseForEditor(createExerciseFromKey("chest-press", {
      assessment: store.user && store.user.assessment,
      logs: store.logs || [],
      week: context.week || 1,
      plan: store.user && store.user.plan
    })));
    this.setDraft(draft);
  },

  removeExercise(event) {
    const workoutIndex = Number(event.currentTarget.dataset.workoutIndex ?? this.data.selectedWorkoutIndex);
    const exerciseIndex = Number(event.currentTarget.dataset.exerciseIndex);
    const draft = clone(this.data.draft);
    if (draft.workouts[workoutIndex].exercises.length <= 1) {
      wx.showToast({ title: "至少保留 1 个动作", icon: "none" });
      return;
    }
    draft.workouts[workoutIndex].exercises.splice(exerciseIndex, 1);
    this.setDraft(draft);
  },

  moveExercise(event) {
    const workoutIndex = Number(event.currentTarget.dataset.workoutIndex ?? this.data.selectedWorkoutIndex);
    const exerciseIndex = Number(event.currentTarget.dataset.exerciseIndex);
    const direction = event.currentTarget.dataset.direction;
    const nextIndex = direction === "up" ? exerciseIndex - 1 : exerciseIndex + 1;
    const draft = clone(this.data.draft);
    const exercises = draft.workouts[workoutIndex] && draft.workouts[workoutIndex].exercises || [];
    if (nextIndex < 0 || nextIndex >= exercises.length) return;
    const current = exercises[exerciseIndex];
    exercises[exerciseIndex] = exercises[nextIndex];
    exercises[nextIndex] = current;
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
