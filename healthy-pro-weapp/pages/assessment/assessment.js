const { generatePlan, normalizeAssessment, validateAssessment } = require("../../utils/coach");

const DEFAULT_DRAFT = {
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
};

function cloneDraft(draft) {
  return {
    ...draft,
    focusAreas: Array.isArray(draft.focusAreas) ? draft.focusAreas.slice() : []
  };
}

function getInitialDraft() {
  const app = getApp();
  const store = app && app.getStore ? app.getStore() : {};
  const saved = store.user && store.user.assessment;
  if (!saved) return cloneDraft(DEFAULT_DRAFT);
  return cloneDraft(normalizeAssessment({
    ...DEFAULT_DRAFT,
    ...saved,
    focusAreas: Array.isArray(saved.focusAreas) ? saved.focusAreas : DEFAULT_DRAFT.focusAreas
  }));
}

function getOptionLabel(options, value, fallback = "未选择") {
  const matched = (options || []).find((item) => String(item.value) === String(value));
  return matched ? matched.label : fallback;
}

Page({
  data: {
    draft: cloneDraft(DEFAULT_DRAFT),
    currentStep: 1,
    stepCount: 3,
    review: {
      target: "",
      experience: "",
      frequency: "",
      duration: "",
      focus: ""
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

  onLoad() {
    this.hydrateDraft();
  },

  hydrateDraft() {
    const draft = getInitialDraft();
    this.setData({
      draft,
      focusOptions: this.syncFocusOptions(draft.focusAreas)
    }, () => this.syncReview());
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
    }, () => this.syncReview());
  },

  chooseValue(event) {
    const { key, value } = event.currentTarget.dataset;
    this.setData({
      [`draft.${key}`]: value
    }, () => this.syncReview());
  },

  chooseFocus(event) {
    const focusAreas = event.detail.value;
    if (focusAreas.length > 3) {
      wx.showToast({ title: "重点部位最多选 3 个", icon: "none" });
      this.setData({ focusOptions: this.syncFocusOptions(this.data.draft.focusAreas) });
      return;
    }
    this.setData({
      "draft.focusAreas": focusAreas,
      focusOptions: this.syncFocusOptions(focusAreas)
    }, () => this.syncReview());
  },

  syncReview() {
    const draft = this.data.draft || {};
    const focusById = Object.fromEntries((this.data.focusOptions || []).map((item) => [item.id, item.label]));
    this.setData({
      review: {
        target: getOptionLabel(this.data.targetOptions, draft.targetPreference),
        experience: getOptionLabel(this.data.experienceOptions, draft.trainingExperience),
        frequency: getOptionLabel(this.data.weeklyLimitOptions, draft.weeklyLimit),
        duration: getOptionLabel(this.data.sessionBudgetOptions, draft.sessionBudget),
        focus: (draft.focusAreas || []).map((id) => focusById[id]).filter(Boolean).join("、") || "全身基础"
      }
    });
  },

  validateBodyStep() {
    const draft = this.data.draft || {};
    const checks = [
      { value: Number(draft.age), min: 14, max: 80, label: "年龄" },
      { value: Number(draft.height), min: 120, max: 230, label: "身高" },
      { value: Number(draft.weight), min: 30, max: 250, label: "体重" }
    ];
    const invalid = checks.find((item) => !Number.isFinite(item.value) || item.value < item.min || item.value > item.max);
    if (invalid) {
      wx.showModal({
        title: `请检查${invalid.label}`,
        content: `${invalid.label}需要在 ${invalid.min}-${invalid.max} 之间。`,
        showCancel: false
      });
      return false;
    }
    if (draft.bodyFat !== "" && draft.bodyFat !== null && draft.bodyFat !== undefined) {
      const bodyFat = Number(draft.bodyFat);
      if (!Number.isFinite(bodyFat) || bodyFat < 3 || bodyFat > 60) {
        wx.showModal({
          title: "请检查体脂率",
          content: "不知道体脂可以留空；填写时需要在 3%-60% 之间。",
          showCancel: false
        });
        return false;
      }
    }
    return true;
  },

  nextStep() {
    if (this.data.currentStep === 1 && !this.validateBodyStep()) return;
    this.setData({ currentStep: Math.min(this.data.stepCount, this.data.currentStep + 1) });
    wx.pageScrollTo({ scrollTop: 0, duration: 180 });
  },

  previousStep() {
    this.setData({ currentStep: Math.max(1, this.data.currentStep - 1) });
    wx.pageScrollTo({ scrollTop: 0, duration: 180 });
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
