const { formatDateTime } = require("../../utils/format");

const TRAINING_DRAFT_PREFIX = "healthyProTrainingDraft";
const BODY_DRAFT_KEY = "healthyProBodyDraft";
const FEELING_CHOICES = [
  { value: 1, icon: "😄", label: "太轻松" },
  { value: 2, icon: "🙂", label: "轻松" },
  { value: 3, icon: "😐", label: "刚好" },
  { value: 4, icon: "😓", label: "有点累" },
  { value: 5, icon: "😣", label: "很吃力" },
  { value: 6, icon: "😭", label: "太难" },
  { value: 7, icon: "⚠️", label: "有不适" }
];

function parseFirstNumber(value, fallback = "") {
  const match = String(value || "").match(/\d+(\.\d+)?/);
  return match ? match[0] : fallback;
}

function parseSetCount(value) {
  return Number(parseFirstNumber(value, "1")) || 1;
}

function getDraftKey(workout, week) {
  const workoutId = workout && workout.id ? workout.id : "unknown";
  return `${TRAINING_DRAFT_PREFIX}:${workoutId}:${week || 1}`;
}

function getIntensityLabel(value) {
  if (value === "too-easy") return "太轻松";
  if (value === "too-hard") return "太吃力";
  return "刚刚好";
}

function getFeelingLabel(value) {
  const feeling = Number(value || 3);
  const matched = FEELING_CHOICES.find((choice) => choice.value === feeling);
  return matched ? matched.label : "刚好";
}

function formatExerciseDetail(exercise) {
  if (!exercise || !exercise.done) return "";
  if (exercise.type === "cardio") {
    const parts = [
      exercise.durationMinutes ? `${exercise.durationMinutes}分钟` : "",
      exercise.speed ? `速度${exercise.speed}` : "",
      exercise.incline ? `坡度${exercise.incline}%` : "",
      exercise.resistance ? `阻力${exercise.resistance}` : ""
    ].filter(Boolean);
    return `${exercise.name}${parts.length ? `：${parts.join(" · ")}` : ""}`;
  }

  const parts = [
    exercise.setsDone ? `${exercise.setsDone}组` : "",
    exercise.weight ? `${exercise.weight}kg/档` : "",
    exercise.reps ? `${exercise.reps}次` : ""
  ].filter(Boolean);
  return `${exercise.name}${parts.length ? `：${parts.join(" · ")}` : ""}`;
}

Page({
  data: {
    workout: {
      title: "训练记录",
      focus: "",
      exercises: []
    },
    week: 1,
    logs: [],
    bodyLogs: [],
    latestBodyLog: null,
    exerciseRecords: [],
    feelingChoices: FEELING_CHOICES,
    completedCount: 0,
    intensityFeedback: "right",
    note: "",
    bodyDraft: {
      weight: "",
      bodyFat: "",
      sleep: "",
      note: ""
    }
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const context = getApp().getTrainingContext();
    const workout = context.workout;
    const week = context.week;
    const draft = this.loadTrainingDraft(workout, week);
    const exerciseRecords = this.buildExerciseRecords(workout, draft);
    const bodyDraft = wx.getStorageSync(BODY_DRAFT_KEY) || this.data.bodyDraft;
    this.setData({
      workout,
      week,
      exerciseRecords,
      completedCount: exerciseRecords.filter((item) => item.done).length,
      intensityFeedback: draft.intensityFeedback || this.data.intensityFeedback || "right",
      note: draft.note || "",
      bodyDraft,
      logs: (context.logs || []).slice().reverse().map((item) => this.formatHistoryLog(item)),
      bodyLogs: (context.bodyLogs || []).slice().reverse().map((item) => ({
        ...item,
        createdLabel: formatDateTime(item.createdAt)
      })),
      latestBodyLog: this.formatLatestBodyLog(context.bodyLogs || [])
    });
  },

  loadTrainingDraft(workout, week) {
    return wx.getStorageSync(getDraftKey(workout, week)) || {};
  },

  buildExerciseRecords(workout, draft = {}) {
    const draftMap = (draft.exercises || []).reduce((map, item) => {
      map[item.id] = item;
      return map;
    }, {});

    return ((workout && workout.exercises) || []).map((exercise) => {
      const saved = draftMap[exercise.id] || {};
      const isCardio = exercise.type === "cardio";
      const targetSets = isCardio ? 1 : parseSetCount(exercise.sets);
      return {
        id: exercise.id,
        sourceExerciseId: exercise.sourceExerciseId || exercise.id,
        name: exercise.name,
        equipmentId: exercise.equipmentId,
        equipmentName: exercise.equipmentName,
        image: exercise.image,
        type: exercise.type,
        isCardio,
        isStrength: !isCardio,
        sets: exercise.sets,
        reps: exercise.reps,
        effort: exercise.effort,
        load: exercise.load || "",
        cue: exercise.cue,
        done: Boolean(saved.done),
        targetSets,
        setsDone: saved.setsDone || "",
        weight: saved.weight || "",
        actualReps: saved.actualReps || saved.reps || "",
        durationMinutes: saved.durationMinutes || saved.duration || (isCardio ? parseFirstNumber(exercise.reps) : ""),
        speed: saved.speed || "",
        incline: saved.incline || "",
        resistance: saved.resistance || "",
        feeling: Number(saved.feeling || 3)
      };
    });
  },

  formatHistoryLog(log) {
    const completed = (log.exercises || []).filter((exercise) => exercise.done);
    return {
      ...log,
      createdLabel: formatDateTime(log.createdAt),
      feedbackLabel: getIntensityLabel(log.intensityFeedback),
      completedText: completed.map((exercise) => exercise.name).slice(0, 4).join("、"),
      detailLines: completed.map(formatExerciseDetail).filter(Boolean).slice(0, 4)
    };
  },

  formatLatestBodyLog(bodyLogs = []) {
    if (!bodyLogs.length) return null;
    const latest = bodyLogs[bodyLogs.length - 1];
    return {
      ...latest,
      createdLabel: formatDateTime(latest.createdAt)
    };
  },

  persistTrainingDraft(patch = {}) {
    const nextData = {
      intensityFeedback: this.data.intensityFeedback,
      note: this.data.note,
      exerciseRecords: this.data.exerciseRecords,
      ...patch
    };
    wx.setStorageSync(getDraftKey(this.data.workout, this.data.week), {
      intensityFeedback: nextData.intensityFeedback,
      note: nextData.note,
      exercises: (nextData.exerciseRecords || []).map((item) => ({
        id: item.id,
        done: Boolean(item.done),
        feeling: Number(item.feeling || 3),
        setsDone: item.setsDone || "",
        weight: item.weight || "",
        actualReps: item.actualReps || "",
        reps: item.actualReps || "",
        durationMinutes: item.durationMinutes || "",
        speed: item.speed || "",
        incline: item.incline || "",
        resistance: item.resistance || ""
      }))
    });
  },

  chooseIntensity(event) {
    const intensityFeedback = event.currentTarget.dataset.value;
    this.setData({
      intensityFeedback
    });
    this.persistTrainingDraft({ intensityFeedback });
  },

  viewExercise(event) {
    const id = event.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/exercise-detail/exercise-detail?id=${encodeURIComponent(id)}&returnPath=${encodeURIComponent("/pages/log/log")}`
    });
  },

  setNote(event) {
    const note = event.detail.value;
    this.setData({
      note
    });
    this.persistTrainingDraft({ note });
  },

  toggleRecord(event) {
    const index = Number(event.currentTarget.dataset.index);
    const exerciseRecords = this.data.exerciseRecords.map((item, itemIndex) => (
      itemIndex === index ? { ...item, done: !item.done } : item
    ));
    this.setData({
      exerciseRecords,
      completedCount: exerciseRecords.filter((item) => item.done).length
    });
    this.persistTrainingDraft({ exerciseRecords });
  },

  setRecordField(event) {
    const index = Number(event.currentTarget.dataset.index);
    const key = event.currentTarget.dataset.key;
    const value = event.detail.value;
    const exerciseRecords = this.data.exerciseRecords.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      return {
        ...item,
        [key]: value,
        done: value !== "" ? true : item.done
      };
    });
    this.setData({
      exerciseRecords,
      completedCount: exerciseRecords.filter((item) => item.done).length
    });
    this.persistTrainingDraft({ exerciseRecords });
  },

  chooseFeeling(event) {
    const index = Number(event.currentTarget.dataset.index);
    const feeling = Number(event.currentTarget.dataset.value);
    const exerciseRecords = this.data.exerciseRecords.map((item, itemIndex) => (
      itemIndex === index ? { ...item, feeling, done: true } : item
    ));
    this.setData({
      exerciseRecords,
      completedCount: exerciseRecords.filter((item) => item.done).length
    });
    this.persistTrainingDraft({ exerciseRecords });
  },

  saveLog() {
    const app = getApp();
    const store = app.getStore();
    const workout = this.data.workout;
    if (!workout) return;
    const records = this.data.exerciseRecords || [];
    const completedCount = records.filter((exercise) => exercise.done).length;

    if (!completedCount) {
      wx.showToast({ title: "至少完成 1 个动作", icon: "none" });
      return;
    }

    const exercises = records.map((exercise) => {
      const base = {
        id: exercise.id,
        exerciseId: exercise.id,
        name: exercise.name,
        equipmentId: exercise.equipmentId,
        type: exercise.type,
        done: Boolean(exercise.done),
        feeling: Number(exercise.feeling || 3),
        feelingLabel: getFeelingLabel(exercise.feeling)
      };

      if (exercise.type === "cardio") {
        return {
          ...base,
          durationMinutes: String(exercise.durationMinutes || "").trim(),
          duration: String(exercise.durationMinutes || "").trim(),
          speed: String(exercise.speed || "").trim(),
          incline: String(exercise.incline || "").trim(),
          resistance: String(exercise.resistance || "").trim()
        };
      }

      return {
        ...base,
        setsDone: Number(exercise.setsDone || exercise.targetSets || 0),
        weight: String(exercise.weight || "").trim(),
        reps: String(exercise.actualReps || "").trim()
      };
    });

    const nextLog = {
      id: `log_${Date.now()}`,
      createdAt: new Date().toISOString(),
      workoutId: workout.id,
      workoutTitle: workout.title,
      week: this.data.week,
      completedCount,
      exercises,
      intensityFeedback: this.data.intensityFeedback,
      note: this.data.note
    };

    store.logs = Array.isArray(store.logs) ? store.logs : [];
    store.logs.push(nextLog);
    app.setStore(store);
    app.syncTrainingLog(nextLog);
    this.setData({ note: "", intensityFeedback: "right" });
    wx.removeStorageSync(getDraftKey(workout, this.data.week));
    this.refresh();
    wx.showToast({ title: "已记录", icon: "success" });
  },

  setBodyField(event) {
    const key = event.currentTarget.dataset.key;
    const bodyDraft = {
      ...this.data.bodyDraft,
      [key]: event.detail.value
    };
    this.setData({ bodyDraft });
    wx.setStorageSync(BODY_DRAFT_KEY, bodyDraft);
  },

  saveBodyLog() {
    const bodyDraft = this.data.bodyDraft || {};
    const weight = Number(bodyDraft.weight || 0);
    if (!weight) {
      wx.showToast({ title: "先填写体重", icon: "none" });
      return;
    }

    const app = getApp();
    const store = app.getStore();
    const nextBodyLog = {
      id: `body_${Date.now()}`,
      createdAt: new Date().toISOString(),
      weight,
      bodyFat: bodyDraft.bodyFat ? Number(bodyDraft.bodyFat) : null,
      sleep: bodyDraft.sleep ? Number(bodyDraft.sleep) : null,
      note: String(bodyDraft.note || "").trim()
    };

    store.bodyLogs = Array.isArray(store.bodyLogs) ? store.bodyLogs : [];
    store.bodyLogs.push(nextBodyLog);
    app.setStore(store);
    wx.removeStorageSync(BODY_DRAFT_KEY);
    this.setData({
      bodyDraft: {
        weight: "",
        bodyFat: "",
        sleep: "",
        note: ""
      }
    });
    this.refresh();
    wx.showToast({ title: "身体已记录", icon: "success" });
  }
});
