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
    feeling: "right",
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

  chooseFeeling(event) {
    this.setData({
      feeling: event.currentTarget.dataset.value
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

    store.logs.push({
      id: `log_${Date.now()}`,
      workoutId: workout.id,
      workoutTitle: workout.title,
      week: this.data.week,
      completedCount: workout.exercises.length,
      feeling: this.data.feeling,
      note: this.data.note,
      createdAt: new Date().toISOString()
    });
    app.setStore(store);
    this.setData({ note: "", feeling: "right" });
    this.refresh();
    wx.showToast({ title: "已记录", icon: "success" });
  }
});
