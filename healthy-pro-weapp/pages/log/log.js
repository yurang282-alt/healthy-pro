const { formatDateTime } = require("../../utils/format");

const TRAINING_DRAFT_PREFIX = "healthyProTrainingDraft";
const BODY_DRAFT_PREFIX = "healthyProBodyDraft";
const FEELING_CHOICES = [
  { value: 2, code: "轻", label: "偏轻" },
  { value: 3, code: "稳", label: "正好" },
  { value: 5, code: "重", label: "偏重" },
  { value: 6, code: "偏", label: "动作不稳" }
];

function parseFirstNumber(value, fallback = "") {
  const match = String(value || "").match(/\d+(\.\d+)?/);
  return match ? match[0] : fallback;
}

function parseSetCount(value) {
  return Number(parseFirstNumber(value, "1")) || 1;
}

function parseRestSeconds(value) {
  if (String(value || "").indexOf("无") >= 0) return 0;
  return Number(parseFirstNumber(value, "60")) || 60;
}

function getRestRemainingSeconds(value) {
  const targetTime = Number(value || 0);
  if (!Number.isFinite(targetTime) || targetTime <= Date.now()) return 0;
  return Math.ceil((targetTime - Date.now()) / 1000);
}

function formatSeconds(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const restSeconds = safeSeconds % 60;
  return `${minutes}:${String(restSeconds).padStart(2, "0")}`;
}

function getDraftScope() {
  const app = getApp();
  const store = app && app.getStore ? app.getStore() : {};
  return store.cloud && store.cloud.openid || store.social && store.social.localUserId || "local";
}

function getDraftKey(workout, week, scope) {
  const workoutId = workout && workout.id ? workout.id : "unknown";
  return `${TRAINING_DRAFT_PREFIX}:${scope || "local"}:${workoutId}:${week || 1}`;
}

function getBodyDraftKey(scope) {
  return `${BODY_DRAFT_PREFIX}:${scope || "local"}`;
}

function getIntensityLabel(value) {
  if (value === "too-easy") return "偏轻";
  if (value === "too-hard") return "偏重";
  if (value === "unstable") return "动作不稳";
  return "正好";
}

function getFeelingLabel(value) {
  const feeling = Number(value || 3);
  const matched = FEELING_CHOICES.find((choice) => choice.value === feeling);
  return matched ? matched.label : "刚好";
}

function isSessionComplete(exerciseRecords = []) {
  return exerciseRecords.length > 0 && exerciseRecords.every((item) => item.done);
}

function getNextPendingIndex(exerciseRecords = [], currentIndex = 0) {
  const start = Number(currentIndex || 0) + 1;
  for (let index = start; index < exerciseRecords.length; index += 1) {
    if (!exerciseRecords[index].done) return index;
  }
  for (let index = 0; index < start; index += 1) {
    if (!exerciseRecords[index].done) return index;
  }
  return -1;
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

function getPostTrainingCoachFeedback(user, logRecord, workout) {
  const exercises = Array.isArray(logRecord && logRecord.exercises) ? logRecord.exercises : [];
  const completedExercises = exercises.filter((exercise) => exercise.done);
  const completedCount = completedExercises.length;
  const totalCount = workout && workout.exercises ? workout.exercises.length : exercises.length || completedCount;
  const intensityFeedback = logRecord && logRecord.intensityFeedback || "right";
  const highFeelingCount = completedExercises.filter((exercise) => Number(exercise.feeling || 0) >= 5).length;
  const unstableFeelingCount = completedExercises.filter((exercise) => Number(exercise.feeling || 0) >= 6).length;
  const lowFeelingCount = completedExercises.filter((exercise) => Number(exercise.feeling || 0) <= 2).length;
  const target = user && user.plan && user.plan.goal && user.plan.goal.type || "当前目标";
  const partial = totalCount > completedCount;
  let title = "完成得不错，继续保持节奏";
  let summary = `完成 ${completedCount}/${totalCount} 个动作，强度刚好。下次维持重量，把动作轨迹做稳定。`;
  const tips = [];

  if (intensityFeedback === "unstable" || unstableFeelingCount >= 1) {
    title = "动作质量优先，下一次先降难度";
    summary = `完成 ${completedCount}/${totalCount} 个动作，但有动作不稳反馈。下一次先降低重量或档位，把轨迹和控制做稳定。`;
    tips.push("下一次先降 5%-10% 重量，动作稳定后再恢复");
  } else if (intensityFeedback === "too-hard" || highFeelingCount >= 2) {
    title = "今天强度偏高，先稳住恢复";
    summary = `完成 ${completedCount}/${totalCount} 个动作，反馈偏吃力。下一次先保持重量，必要时每个主动作少做 1 组。`;
    tips.push("下一次不要追重量，优先动作稳定和恢复");
  } else if (intensityFeedback === "too-easy" || lowFeelingCount >= Math.max(2, Math.ceil(completedCount / 2))) {
    title = "今天偏轻松，下次小幅进阶";
    summary = `完成 ${completedCount}/${totalCount} 个动作，整体偏轻松。下次只给 1-2 个主动作小幅加重量，不要整套一起加。`;
    tips.push("优先给主动作加 5% 左右，仍以动作稳定为准");
  } else if (partial) {
    title = "先把计划做完整";
    summary = `完成 ${completedCount}/${totalCount} 个动作，先把计划动作补齐比额外加量更重要。`;
    tips.push("下次优先完成没做完的动作，再考虑加重量");
  }

  if (!tips.length) tips.push("主动作先稳定轨迹，再考虑加重量");
  tips.push(`${target}阶段更看重连续记录和可恢复进步`);

  return {
    title,
    summary,
    tips: tips.slice(0, 3),
    createdAt: logRecord && logRecord.createdAt || new Date().toISOString()
  };
}

function getActiveTrainingMeta(record, index, total) {
  if (!record) {
    return {
      indexText: "第 0 项",
      progressPercent: 0,
      actionLabel: "开始",
      targetText: ""
    };
  }
  const doneCount = Number(record.setsDone || 0);
  const targetSets = Math.max(1, Number(record.targetSets || 1));
  const progressPercent = total ? Math.round(((Number(index || 0) + (record.done ? 1 : 0)) / total) * 100) : 0;
  const actionLabel = record.done
    ? "已完成"
    : (record.isStrength && targetSets > 1 ? `完成第 ${Math.min(doneCount + 1, targetSets)}/${targetSets} 组` : "完成当前动作");
  return {
    indexText: `第 ${Number(index || 0) + 1}/${total || 1} 项`,
    progressPercent,
    actionLabel,
    targetText: record.done ? "已完成" : (record.isCardio ? record.reps : `${doneCount}/${targetSets} 组`),
    nextText: record.done ? "检查后继续下一项" : actionLabel,
    primaryCue: Array.isArray(record.cues) && record.cues[0] ? record.cues[0] : record.cue || "",
    cueCount: Array.isArray(record.cues) ? Math.max(0, record.cues.length - 1) : 0,
    statusTags: [
      record.load ? `起步 ${record.load}` : "",
      record.effort ? `吃力 ${record.effort}` : "",
      record.rest ? `休息 ${record.rest}` : ""
    ].filter(Boolean)
  };
}

Page({
  data: {
    workout: {
      title: "训练记录",
      focus: "",
      exercises: []
    },
    trainingExecution: null,
    week: 1,
    logs: [],
    bodyLogs: [],
    latestBodyLog: null,
    exerciseRecords: [],
    activeExerciseIndex: 0,
    activeRecord: null,
    activeMeta: getActiveTrainingMeta(null, 0, 0),
    restRemaining: 0,
    restRemainingText: "0:00",
    feelingChoices: FEELING_CHOICES,
    sessionNumber: 1,
    completedCount: 0,
    sessionComplete: false,
    showCompletionPrompt: false,
    completionPromptDismissed: false,
    intensityFeedback: "right",
    note: "",
    showQueue: false,
    showActionDetails: false,
    showAfterTraining: false,
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

  onHide() {
    this.stopRestTimer();
  },

  onUnload() {
    this.stopRestTimer();
  },

  refresh() {
    const context = getApp().getTrainingContext();
    const workout = context.workout;
    const week = context.week;
    const draftScope = getDraftScope();
    const draft = this.loadTrainingDraft(workout, week, draftScope);
    const exerciseRecords = this.buildExerciseRecords(workout, draft);
    const activeExerciseIndex = Math.max(0, Math.min(exerciseRecords.length - 1, Number(draft.activeExerciseIndex || 0)));
    const bodyDraft = wx.getStorageSync(getBodyDraftKey(draftScope)) || this.data.bodyDraft;
    const sourceLogs = context.logs || [];
    const completedCount = exerciseRecords.filter((item) => item.done).length;
    const sessionComplete = isSessionComplete(exerciseRecords);
    this.setData({
      workout,
      trainingExecution: context.trainingExecution || null,
      week,
      exerciseRecords,
      activeExerciseIndex,
      activeRecord: exerciseRecords[activeExerciseIndex] || null,
      activeMeta: getActiveTrainingMeta(exerciseRecords[activeExerciseIndex], activeExerciseIndex, exerciseRecords.length),
      sessionNumber: sourceLogs.length + 1,
      completedCount,
      sessionComplete,
      completionPromptDismissed: sessionComplete ? this.data.completionPromptDismissed : false,
      showCompletionPrompt: sessionComplete && !this.data.completionPromptDismissed,
      intensityFeedback: draft.intensityFeedback || this.data.intensityFeedback || "right",
      note: draft.note || "",
      bodyDraft,
      logs: sourceLogs.map((item, index) => this.formatHistoryLog(item, index)).reverse(),
      bodyLogs: (context.bodyLogs || []).slice().reverse().map((item) => ({
        ...item,
        createdLabel: formatDateTime(item.createdAt)
      })),
      latestBodyLog: this.formatLatestBodyLog(context.bodyLogs || [])
    });
    this.refreshRestTimer();
    this.startRestTimer();
  },

  goAssessment() {
    wx.navigateTo({ url: "/pages/assessment/assessment" });
  },

  loadTrainingDraft(workout, week, scope) {
    return wx.getStorageSync(getDraftKey(workout, week, scope || getDraftScope())) || {};
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
        rest: exercise.rest,
        effort: exercise.effort,
        load: exercise.load || "",
        loadDetail: exercise.loadDetail || "",
        loadCaution: exercise.loadCaution || "",
        cue: exercise.cue,
        cues: exercise.cues || [],
        done: Boolean(saved.done),
        targetSets,
        setsDone: saved.setsDone || "",
        restUntil: saved.restUntil || "",
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

  formatHistoryLog(log, index = 0) {
    const completed = (log.exercises || []).filter((exercise) => exercise.done);
    const sessionNumber = Number(log.sessionNumber || index + 1);
    const completedNames = completed.map((exercise, exerciseIndex) => `${exerciseIndex + 1}. ${exercise.name}`);
    const scheduleLabel = log.schedule && log.schedule.mode === "one-off-override" ? "临时改练" : "";
    const createdLabel = formatDateTime(log.createdAt);
    const feedbackLabel = getIntensityLabel(log.intensityFeedback);
    return {
      ...log,
      sessionNumber,
      sessionLabel: `第 ${sessionNumber} 次训练`,
      scheduleLabel,
      createdLabel,
      feedbackLabel,
      historyMeta: [
        `第 ${log.week} 周`,
        createdLabel,
        feedbackLabel,
        `完成 ${completed.length} 个动作`,
        scheduleLabel
      ].filter(Boolean).join(" · "),
      coachFeedbackTitle: log.coachFeedback && log.coachFeedback.title || "",
      coachFeedbackSummary: log.coachFeedback && log.coachFeedback.summary || "",
      completedText: completedNames.join("、"),
      detailLines: completed.map((exercise, exerciseIndex) => {
        const detail = formatExerciseDetail(exercise);
        return detail ? `${exerciseIndex + 1}. ${detail}` : "";
      }).filter(Boolean)
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
      activeExerciseIndex: this.data.activeExerciseIndex,
      ...patch
    };
    wx.setStorageSync(getDraftKey(this.data.workout, this.data.week, getDraftScope()), {
      intensityFeedback: nextData.intensityFeedback,
      note: nextData.note,
      activeExerciseIndex: Number(nextData.activeExerciseIndex || 0),
      exercises: (nextData.exerciseRecords || []).map((item) => ({
        id: item.id,
        done: Boolean(item.done),
        feeling: Number(item.feeling || 3),
        setsDone: item.setsDone || "",
        restUntil: item.restUntil || "",
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

  applyExerciseRecords(exerciseRecords, activeExerciseIndex = this.data.activeExerciseIndex) {
    const safeIndex = Math.max(0, Math.min(exerciseRecords.length - 1, Number(activeExerciseIndex || 0)));
    const wasComplete = this.data.showCompletionPrompt;
    const sessionComplete = isSessionComplete(exerciseRecords);
    const showCompletionPrompt = sessionComplete && !this.data.completionPromptDismissed;
    this.setData({
      exerciseRecords,
      activeExerciseIndex: safeIndex,
      activeRecord: exerciseRecords[safeIndex] || null,
      activeMeta: getActiveTrainingMeta(exerciseRecords[safeIndex], safeIndex, exerciseRecords.length),
      completedCount: exerciseRecords.filter((item) => item.done).length,
      sessionComplete,
      showCompletionPrompt
    });
    this.persistTrainingDraft({ exerciseRecords, activeExerciseIndex: safeIndex });
    this.refreshRestTimer();
    if (!wasComplete && showCompletionPrompt) {
      this.notifySessionComplete();
    }
  },

  notifySessionComplete() {
    if (!wx.vibrateShort) return;
    wx.vibrateShort({ type: "light" });
  },

  dismissCompletionPrompt() {
    this.setData({
      completionPromptDismissed: true,
      showCompletionPrompt: false
    });
  },

  toggleQueue() {
    this.setData({ showQueue: !this.data.showQueue });
  },

  toggleActionDetails() {
    this.setData({ showActionDetails: !this.data.showActionDetails });
  },

  toggleAfterTraining() {
    this.setData({ showAfterTraining: !this.data.showAfterTraining });
  },

  saveDraft() {
    this.persistTrainingDraft();
    wx.showToast({ title: "草稿已保存", icon: "success" });
  },

  refreshRestTimer() {
    const activeRecord = this.data.activeRecord;
    const restRemaining = getRestRemainingSeconds(activeRecord && activeRecord.restUntil);
    this.setData({
      restRemaining,
      restRemainingText: formatSeconds(restRemaining)
    });
  },

  startRestTimer() {
    this.stopRestTimer();
    this.restTimer = setInterval(() => {
      this.refreshRestTimer();
      if (!this.data.restRemaining) {
        this.stopRestTimer();
      }
    }, 1000);
  },

  stopRestTimer() {
    if (this.restTimer) {
      clearInterval(this.restTimer);
      this.restTimer = null;
    }
  },

  jumpExercise(event) {
    const activeExerciseIndex = Number(event.currentTarget.dataset.index);
    this.applyExerciseRecords(this.data.exerciseRecords, activeExerciseIndex);
    this.startRestTimer();
  },

  previousExercise() {
    this.jumpToIndex(this.data.activeExerciseIndex - 1);
  },

  nextExercise() {
    this.jumpToIndex(this.data.activeExerciseIndex + 1);
  },

  jumpToIndex(index) {
    this.applyExerciseRecords(this.data.exerciseRecords, index);
    this.startRestTimer();
  },

  skipRest() {
    const index = Number(this.data.activeExerciseIndex || 0);
    const exerciseRecords = this.data.exerciseRecords.map((item, itemIndex) => (
      itemIndex === index ? { ...item, restUntil: "" } : item
    ));
    this.applyExerciseRecords(exerciseRecords, index);
    this.stopRestTimer();
  },

  completeActiveStrengthSet() {
    const index = Number(this.data.activeExerciseIndex || 0);
    let shouldJump = false;
    const exerciseRecords = this.data.exerciseRecords.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const targetSets = Math.max(1, Number(item.targetSets || 1));
      const currentSets = Math.max(0, Number(item.setsDone || 0));
      const nextSets = Math.min(targetSets, currentSets + 1);
      const isDone = nextSets >= targetSets;
      const restSeconds = parseRestSeconds(item.rest);
      shouldJump = isDone;
      return {
        ...item,
        done: isDone,
        setsDone: String(nextSets),
        restUntil: !isDone && restSeconds ? String(Date.now() + restSeconds * 1000) : ""
      };
    });
    this.applyExerciseRecords(exerciseRecords, index);
    this.startRestTimer();
    const nextIndex = shouldJump ? getNextPendingIndex(exerciseRecords, index) : -1;
    if (shouldJump && nextIndex >= 0) {
      setTimeout(() => this.jumpToIndex(nextIndex), 250);
    }
  },

  completeActiveCardio() {
    const index = Number(this.data.activeExerciseIndex || 0);
    const exerciseRecords = this.data.exerciseRecords.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      return {
        ...item,
        done: true,
        durationMinutes: item.durationMinutes || parseFirstNumber(item.reps, "8")
      };
    });
    this.applyExerciseRecords(exerciseRecords, index);
    const nextIndex = getNextPendingIndex(exerciseRecords, index);
    if (nextIndex >= 0) {
      setTimeout(() => this.jumpToIndex(nextIndex), 250);
    }
  },

  markActiveIncomplete() {
    const index = Number(this.data.activeExerciseIndex || 0);
    const exerciseRecords = this.data.exerciseRecords.map((item, itemIndex) => (
      itemIndex === index ? { ...item, done: false, setsDone: "", restUntil: "" } : item
    ));
    this.setData({ completionPromptDismissed: false });
    this.applyExerciseRecords(exerciseRecords, index);
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
    this.applyExerciseRecords(exerciseRecords);
  },

  setRecordField(event) {
    const index = Number(event.currentTarget.dataset.index);
    const key = event.currentTarget.dataset.key;
    const value = event.detail.value;
    const exerciseRecords = this.data.exerciseRecords.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      return {
        ...item,
        [key]: value
      };
    });
    this.applyExerciseRecords(exerciseRecords);
  },

  chooseFeeling(event) {
    const index = Number(event.currentTarget.dataset.index);
    const feeling = Number(event.currentTarget.dataset.value);
    const exerciseRecords = this.data.exerciseRecords.map((item, itemIndex) => (
      itemIndex === index ? { ...item, feeling } : item
    ));
    this.applyExerciseRecords(exerciseRecords);
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

    const exercises = records.map((exercise, exerciseIndex) => {
      const base = {
        id: exercise.id,
        exerciseId: exercise.id,
        sourceExerciseId: exercise.sourceExerciseId || exercise.id,
        order: exerciseIndex + 1,
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
      sessionNumber: store.logs.length + 1,
      workoutId: workout.id,
      workoutTitle: workout.title,
      week: this.data.week,
      completedCount,
      exercises,
      intensityFeedback: this.data.intensityFeedback,
      note: this.data.note
    };
    const execution = this.data.trainingExecution || {};
    nextLog.schedule = {
      mode: execution.isOverride ? "one-off-override" : "planned",
      scheduledWorkoutId: execution.scheduledWorkout && execution.scheduledWorkout.id || workout.id,
      actualWorkoutId: workout.id,
      resumeWorkoutId: execution.isOverride && execution.scheduledWorkout
        ? execution.scheduledWorkout.id
        : ""
    };
    nextLog.coachFeedback = getPostTrainingCoachFeedback(store.user, nextLog, workout);

    store.logs = Array.isArray(store.logs) ? store.logs : [];
    app.advanceTrainingSchedule(store, workout.id);
    store.logs.push(nextLog);
    app.setStore(store);
    app.syncTrainingLog(nextLog);
    this.setData({ note: "", intensityFeedback: "right", completionPromptDismissed: false });
    wx.removeStorageSync(getDraftKey(workout, this.data.week, getDraftScope()));
    this.refresh();
    const resumeNotice = nextLog.schedule.mode === "one-off-override" && execution.scheduledWorkout
      ? `\n\n临时改练已完成，下一次恢复${execution.scheduledWorkout.title}。`
      : "";
    wx.showModal({
      title: `已保存第 ${nextLog.sessionNumber} 次训练`,
      content: `${nextLog.coachFeedback.summary}${resumeNotice}`,
      showCancel: false,
      confirmText: "知道了"
    });
  },

  setBodyField(event) {
    const key = event.currentTarget.dataset.key;
    const bodyDraft = {
      ...this.data.bodyDraft,
      [key]: event.detail.value
    };
    this.setData({ bodyDraft });
    wx.setStorageSync(getBodyDraftKey(getDraftScope()), bodyDraft);
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
    wx.removeStorageSync(getBodyDraftKey(getDraftScope()));
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
