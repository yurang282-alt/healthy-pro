const { generatePlan, normalizeAssessment, validateAssessment } = require("../../utils/coach");

Page({
  data: {
    draft: {
      age: 28,
      gender: "male",
      height: 170,
      weight: 65,
      bodyFat: 14,
      targetPreference: "auto",
      trainingExperience: "familiar",
      weeklyLimit: "3",
      injury: "none",
      sessionBudget: 75,
      focusAreas: ["chest", "back"]
    },
    focusOptions: [
      { id: "chest", label: "胸", checked: true },
      { id: "back", label: "背", checked: true },
      { id: "legs", label: "腿", checked: false },
      { id: "shoulders", label: "肩", checked: false },
      { id: "glutes", label: "臀", checked: false }
    ],
    genderOptions: [
      { value: "male", label: "男" },
      { value: "female", label: "女" },
      { value: "other", label: "其他" }
    ],
    targetOptions: [
      { value: "auto", label: "让教练判断" },
      { value: "gain", label: "增肌" },
      { value: "fat-loss", label: "减脂" },
      { value: "shape", label: "塑形" }
    ],
    experienceOptions: [
      { value: "beginner", label: "健身小白" },
      { value: "familiar", label: "略有了解" },
      { value: "years", label: "健身多年" },
      { value: "coach", label: "资深教练" }
    ],
    weeklyLimitOptions: [
      { value: "coach", label: "教练安排" },
      { value: "2", label: "最多 2 次" },
      { value: "3", label: "约 3 次" },
      { value: "4", label: "4 次以上" }
    ],
    sessionBudgetOptions: [
      { value: 45, label: "45 分钟" },
      { value: 60, label: "60 分钟" },
      { value: 75, label: "75 分钟" }
    ],
    injuryOptions: [
      { value: "none", label: "无明显伤病" },
      { value: "knee", label: "膝盖疼痛" },
      { value: "back", label: "腰背疼痛" },
      { value: "shoulder", label: "肩颈疼痛" },
      { value: "heart", label: "心血管限制" }
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
    const validation = validateAssessment(this.data.draft);
    if (!validation.valid) {
      wx.showModal({
        title: "先修正评估信息",
        content: validation.errors.join("\n"),
        showCancel: false
      });
      return;
    }

    const assessment = normalizeAssessment(this.data.draft);
    const app = getApp();
    const store = app.getStore();
    store.user = store.user || {
      id: store.cloud && store.cloud.openid ? `weapp-${store.cloud.openid}` : "pending-weapp-user",
      openid: store.cloud && store.cloud.openid || ""
    };
    store.user.assessment = assessment;
    store.user.plan = generatePlan(assessment, store.logs || []);
    store.user.needsAssessment = false;
    app.setStore(store);
    wx.showToast({ title: "计划已生成", icon: "success" });
    wx.switchTab({ url: "/pages/home/home" });
  }
});
