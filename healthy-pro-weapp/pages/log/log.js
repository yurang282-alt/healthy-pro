const { formatDateTime } = require("../../utils/format");

Page({
  data: {
    workout: {
      title: "训练记录",
      focus: "",
      exercises: []
    },
    week: 1,
    logs: [],
    intensityFeedback: "right",
    note: ""
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const context = getApp().getTrainingContext();
    this.setData({
      workout: context.workout,
      week: context.week,
      logs: context.logs.map((item) => ({
        ...item,
        createdLabel: formatDateTime(item.createdAt)
      }))
    });
  },

  chooseIntensity(event) {
    this.setData({
      intensityFeedback: event.currentTarget.dataset.value
    });
  },

  setNote(event) {
    this.setData({
      note: event.detail.value
    });
  },

  saveLog() {
    const app = getApp();
    const store = app.getStore();
    const workout = this.data.workout;
    if (!workout) return;
    const exercises = (workout.exercises || []).map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      equipmentId: exercise.equipmentId,
      type: exercise.type,
      done: true,
      feeling: 3,
      setsDone: exercise.type === "strength" ? Number(String(exercise.sets || "").match(/\d+/)?.[0] || 1) : null,
      weight: null,
      reps: null,
      duration: exercise.type === "cardio" ? Number(String(exercise.reps || "").match(/\d+/)?.[0] || 0) : null,
      speed: null,
      incline: null,
      resistance: null
    }));

    store.logs.push({
      id: `log_${Date.now()}`,
      createdAt: new Date().toISOString(),
      workoutId: workout.id,
      workoutTitle: workout.title,
      week: this.data.week,
      completedCount: exercises.length,
      exercises,
      intensityFeedback: this.data.intensityFeedback,
      note: this.data.note
    });
    app.setStore(store);
    this.setData({ note: "", intensityFeedback: "right" });
    this.refresh();
    wx.showToast({ title: "已记录", icon: "success" });
  }
});
