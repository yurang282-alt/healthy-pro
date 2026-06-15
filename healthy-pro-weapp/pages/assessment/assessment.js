const { generatePlan, normalizeAssessment } = require("../../utils/coach");

Page({
  data: {
    draft: {
      age: 28,
      gender: "male",
      height: 170,
      weight: 65,
      bodyFat: 14,
      target: "muscle",
      experience: "familiar",
      frequency: 3,
      sessionBudget: 75,
      focusAreas: ["chest", "back"]
    },
    focusOptions: [
      { id: "chest", label: "胸", checked: true },
      { id: "back", label: "背", checked: true },
      { id: "legs", label: "腿", checked: false },
      { id: "shoulders", label: "肩", checked: false },
      { id: "glutes", label: "臀", checked: false }
    ]
  },

  syncFocusOptions(focusAreas) {
    const selected = Array.isArray(focusAreas) ? focusAreas : [];
    return this.data.focusOptions.map((item) => ({
      ...item,
      checked: selected.indexOf(item.id) >= 0
    }));
  },

  setValue(event) {
    const key = event.currentTarget.dataset.key;
    const value = event.detail.value;
    this.setData({
      [`draft.${key}`]: value
    });
  },

  chooseValue(event) {
    const { key, value } = event.currentTarget.dataset;
    this.setData({
      [`draft.${key}`]: value
    });
  },

  chooseFocus(event) {
    const focusAreas = event.detail.value;
    this.setData({
      "draft.focusAreas": focusAreas,
      focusOptions: this.syncFocusOptions(focusAreas)
    });
  },

  submit() {
    const assessment = normalizeAssessment(this.data.draft);
    const app = getApp();
    const store = app.getStore();
    store.user.assessment = assessment;
    store.user.plan = generatePlan(assessment);
    app.setStore(store);
    wx.showToast({ title: "计划已生成", icon: "success" });
    wx.switchTab({ url: "/pages/home/home" });
  }
});
