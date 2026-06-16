const focusLabels = {
  chest: "胸",
  back: "背",
  legs: "腿",
  shoulders: "肩",
  glutes: "臀"
};

const COACH_SPEC_VERSION = "mvp-2026-06-05-model-v2";

const equipment = [
  {
    id: "treadmill",
    name: "跑步机",
    category: "有氧训练区",
    image: "/assets/equipment/treadmill.png",
    muscles: "热身 / 心肺",
    setup: "先从能完整说话的速度开始，安全扣夹好。"
  },
  {
    id: "chest-press",
    name: "胸肌/背肌推举训练机",
    category: "力量训练区",
    image: "/assets/equipment/chest-press.png",
    muscles: "胸 / 肩稳定",
    setup: "座椅调到把手略低于肩，背部贴紧靠垫。"
  },
  {
    id: "smith-machine",
    name: "史密斯训练架",
    category: "自由力量训练区",
    image: "/assets/equipment/dumbbell-rack.png",
    muscles: "胸 / 腿 / 臀",
    setup: "先空杆熟悉轨迹，确认安全扣位置。"
  },
  {
    id: "lat-pulldown",
    name: "高拉训练器",
    category: "力量训练区",
    image: "/assets/equipment/lat-pulldown.png",
    muscles: "背 / 肱二头肌",
    setup: "先沉肩再下拉，不要后仰借力。"
  },
  {
    id: "seated-row",
    name: "坐姿划船机",
    category: "力量训练区",
    image: "/assets/equipment/seated-row.png",
    muscles: "中背 / 后肩",
    setup: "胸口贴稳靠垫，把手拉到肋骨两侧。"
  },
  {
    id: "leg-press",
    name: "坐式蹬腿训练器",
    category: "力量训练区",
    image: "/assets/equipment/leg-press.png",
    muscles: "股四头肌 / 臀",
    setup: "脚放踏板中上方，膝盖和脚尖同向。"
  },
  {
    id: "leg-extension-curl",
    name: "腿部伸展/弯曲训练机",
    category: "力量训练区",
    image: "/assets/equipment/leg-extension-curl.png",
    muscles: "大腿前侧 / 后侧",
    setup: "膝盖轴心对准机器转轴，动作慢起慢落。"
  },
  {
    id: "shoulder-press",
    name: "坐式肩膀推举训练器",
    category: "力量训练区",
    image: "/assets/equipment/shoulder-press.png",
    muscles: "肩 / 肱三头肌",
    setup: "背贴靠垫，手腕保持中立。"
  },
  {
    id: "cable-station",
    name: "双滑轮拉力训练机",
    category: "自由力量训练区",
    image: "/assets/equipment/cable-station.png",
    muscles: "胸 / 背 / 手臂",
    setup: "先选轻重量，站稳后再拉。"
  },
  {
    id: "hip-thrust",
    name: "臀推训练机",
    category: "力量训练区",
    image: "/assets/equipment/hip-thrust.png",
    muscles: "臀 / 腘绳肌",
    setup: "下巴微收，顶端夹臀停 1 秒。"
  }
];

const equipmentById = equipment.reduce((map, item) => {
  map[item.id] = item;
  return map;
}, {});

const exerciseLibrary = {
  treadmillWarmup: {
    id: "treadmill-warmup",
    name: "跑步机短热身",
    equipmentId: "treadmill",
    type: "cardio",
    sets: "1 段",
    reps: "5-8 分钟",
    effort: "6/10",
    load: "",
    cue: "适中，结束后还能说完整句子。"
  },
  chestPress: {
    id: "chest-press",
    name: "坐姿推胸",
    equipmentId: "chest-press",
    type: "strength",
    sets: "3 组",
    reps: "10-12 次",
    effort: "6/10",
    load: "20-30kg",
    cue: "背贴稳，推起不锁死手肘。"
  },
  smithInclinePress: {
    id: "smith-incline-press",
    name: "史密斯上斜推胸",
    equipmentId: "smith-machine",
    type: "strength",
    sets: "3 组",
    reps: "8-10 次",
    effort: "6/10",
    load: "20-25kg 总重",
    cue: "先空杆确认轨迹，肩不前顶。"
  },
  latPulldown: {
    id: "lat-pulldown",
    name: "高位下拉",
    equipmentId: "lat-pulldown",
    type: "strength",
    sets: "3 组",
    reps: "10-12 次",
    effort: "6/10",
    load: "20-30kg",
    cue: "先沉肩，再把肘拉向身体两侧。"
  },
  seatedRow: {
    id: "seated-row",
    name: "坐姿划船",
    equipmentId: "seated-row",
    type: "strength",
    sets: "3 组",
    reps: "10-12 次",
    effort: "6/10",
    load: "20-30kg",
    cue: "胸口贴稳，避免腰部甩动。"
  },
  legPress: {
    id: "leg-press",
    name: "坐式蹬腿",
    equipmentId: "leg-press",
    type: "strength",
    sets: "3 组",
    reps: "12-15 次",
    effort: "6/10",
    load: "50-70kg",
    cue: "膝盖朝脚尖方向，不要锁死膝盖。"
  },
  legCurl: {
    id: "leg-curl",
    name: "腿部弯曲",
    equipmentId: "leg-extension-curl",
    type: "strength",
    sets: "2 组",
    reps: "12-15 次",
    effort: "6/10",
    load: "15-20kg",
    cue: "慢起慢落，不要甩腿。"
  },
  shoulderPress: {
    id: "shoulder-press",
    name: "坐式肩推",
    equipmentId: "shoulder-press",
    type: "strength",
    sets: "2 组",
    reps: "10-12 次",
    effort: "6/10",
    load: "10-20kg",
    cue: "肩膀不要耸到耳朵旁边。"
  },
  cableFly: {
    id: "cable-fly",
    name: "绳索夹胸",
    equipmentId: "cable-station",
    type: "strength",
    sets: "2 组",
    reps: "12-15 次",
    effort: "6/10",
    load: "5-10kg/侧",
    cue: "胸发力合拢，手臂只是抱住轨迹。"
  },
  hipThrust: {
    id: "hip-thrust",
    name: "臀推",
    equipmentId: "hip-thrust",
    type: "strength",
    sets: "2 组",
    reps: "10-12 次",
    effort: "6/10",
    load: "30-40kg",
    cue: "顶端夹臀，不要用腰硬顶。"
  }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function formatShortDate(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function decorateExercise(exercise) {
  const item = equipmentById[exercise.equipmentId];
  return {
    ...clone(exercise),
    equipmentName: item ? item.name : "训练器械",
    image: item ? item.image : "/assets/equipment/dumbbell-rack.png"
  };
}

function getFocusLabels(focusAreas = []) {
  return focusAreas.map((id) => focusLabels[id]).filter(Boolean);
}

function normalizeAssessment(form = {}) {
  const focusAreas = Array.isArray(form.focusAreas) && form.focusAreas.length ? form.focusAreas : ["chest", "back"];
  const frequency = Number(form.frequency || form.weeklyLimit || 3);
  const targetPreference = form.targetPreference || (form.target === "muscle" ? "gain" : form.target) || "gain";
  return {
    age: Number(form.age || 28),
    gender: form.gender || "male",
    height: Number(form.height || 170),
    weight: Number(form.weight || 65),
    bodyFat: Number(form.bodyFat || 14),
    targetPreference: ["auto", "fat-loss", "gain", "shape"].includes(targetPreference) ? targetPreference : "gain",
    trainingExperience: form.trainingExperience || form.experience || "familiar",
    weeklyLimit: ["coach", "2", "3", "4"].includes(String(form.weeklyLimit || frequency)) ? String(form.weeklyLimit || frequency) : "3",
    injury: form.injury || "none",
    sessionBudget: Number(form.sessionBudget || 75),
    focusAreas
  };
}

function generatePlan(input = {}) {
  const assessment = normalizeAssessment(input);
  const focus = getFocusLabels(assessment.focusAreas);
  const workouts = [
    {
      id: "workout_chest",
      title: "胸部强化",
      focus: "主练胸，肩和三头只做辅助，不抢恢复",
      exercises: [
        exerciseLibrary.treadmillWarmup,
        exerciseLibrary.chestPress,
        exerciseLibrary.smithInclinePress,
        exerciseLibrary.cableFly,
        exerciseLibrary.shoulderPress
      ].map(decorateExercise)
    },
    {
      id: "workout_back",
      title: "背部强化",
      focus: "主练背，兼顾肩胛稳定和手臂辅助",
      exercises: [
        exerciseLibrary.treadmillWarmup,
        exerciseLibrary.latPulldown,
        exerciseLibrary.seatedRow,
        exerciseLibrary.shoulderPress
      ].map(decorateExercise)
    },
    {
      id: "workout_legs",
      title: "腿臀辅助",
      focus: "覆盖股四头、臀和大腿后侧，保守渐进",
      exercises: [
        exerciseLibrary.treadmillWarmup,
        exerciseLibrary.legPress,
        exerciseLibrary.legCurl,
        exerciseLibrary.hipThrust
      ].map(decorateExercise)
    }
  ].slice(0, Math.max(2, Math.min(4, Number(assessment.weeklyLimit === "coach" ? 3 : assessment.weeklyLimit))));

  return {
    id: createId("plan"),
    version: COACH_SPEC_VERSION,
    safetyHold: false,
    goal: {
      type: assessment.targetPreference === "fat-loss" ? "减脂塑形基础期" : "精益增肌期",
      priority: assessment.targetPreference === "fat-loss"
        ? "先稳定训练频次和饮食记录，再逐步拉高消耗。"
        : "你的体重和体脂更适合精益增肌，重点是力量动作质量和渐进加量。"
    },
    focusAreas: assessment.focusAreas.map((id) => ({ id, label: focusLabels[id] || id })),
    focusText: focus.length ? focus.join("、") : "全身均衡",
    frequency: {
      sessionsPerWeek: workouts.length,
      pattern: workouts.map((item) => item.title).join(" / "),
      limitLabel: assessment.weeklyLimit === "coach" ? "教练安排" : `最多 ${assessment.weeklyLimit} 次`,
      restDays: "两次力量训练之间尽量间隔 1 天"
    },
    duration: {
      label: assessment.sessionBudget >= 75 ? "45-60 分钟" : "30-45 分钟",
      budget: assessment.sessionBudget,
      split: "热身 5-8 分钟，力量训练为主，组间保留完整休息。"
    },
    experience: {
      id: assessment.trainingExperience,
      label: {
        beginner: "健身小白",
        familiar: "略有了解",
        years: "健身多年",
        coach: "资深教练"
      }[assessment.trainingExperience] || "略有了解"
    },
    review: {
      status: "new",
      recommendation: "完成第一周记录后，再根据感觉、强弱反馈和完成度调整。"
    },
    weeks: [
      { week: 1, label: "适应周", note: "找到能稳定完成的重量，不急着加量。" },
      { week: 2, label: "稳定周", note: "动作稳定时，每个动作争取多完成 1-2 次。" },
      { week: 3, label: "微进阶周", note: "感觉偏轻的动作小幅加重量，不超过 5-10%。" },
      { week: 4, label: "复盘周", note: "保留训练频次，观察疲劳和动作质量。" }
    ],
    workouts,
    rationale: "小程序当前使用本地预览模型，但字段结构与 PWA v2 计划保持一致，后续可直接接 CloudBase。",
    adjustmentGuide: "重新调整会读取最近训练反馈；觉得太弱或太强时，先记录训练，再回到计划页调整。",
    createdAt: new Date().toISOString()
  };
}

function createDemoUser() {
  const assessment = normalizeAssessment({});
  return {
    id: "demo-user",
    openid: "",
    assessment,
    plan: generatePlan(assessment)
  };
}

function getCurrentWeek(plan, logs = []) {
  if (!plan) return 1;
  const frequency = Number((plan.frequency && plan.frequency.sessionsPerWeek) || 3);
  return Math.max(1, Math.min(4, Math.floor(logs.length / frequency) + 1));
}

function getNextWorkout(plan, logs = []) {
  if (!plan || !plan.workouts || !plan.workouts.length) return null;
  return plan.workouts[logs.length % plan.workouts.length];
}

function parseSetCount(sets = "") {
  const match = String(sets).match(/(\d+)\s*组/);
  return match ? Number(match[1]) : 0;
}

function rewriteSetCount(sets = "", nextCount) {
  if (!/(\d+)\s*组/.test(String(sets))) return sets;
  return String(sets).replace(/(\d+)\s*组/, `${nextCount} 组`);
}

function getAdjustmentSignal(logs = []) {
  const recent = logs.slice(-3).map((item) => {
    if (!item) return null;
    if (item.intensityFeedback) return item.intensityFeedback;
    if (item.feeling === "easy") return "too-easy";
    if (item.feeling === "hard") return "too-hard";
    if (item.feeling === "right") return "right";
    return null;
  }).filter(Boolean);
  if (!recent.length) {
    return {
      status: "empty",
      title: "先记录一次训练",
      summary: "重新调整需要读取最近训练感觉。先完成并保存一次训练，再回来调整会更准。"
    };
  }

  const easyCount = recent.filter((feedback) => feedback === "too-easy").length;
  const hardCount = recent.filter((feedback) => feedback === "too-hard").length;
  const threshold = recent.length >= 2 ? 2 : 1;
  if (hardCount >= threshold) {
    return {
      status: "reduce",
      title: "下调一点容量",
      summary: `最近 ${recent.length} 次里偏吃力，下一版每个训练日会减少少量力量组数，先把动作质量找回来。`
    };
  }
  if (easyCount >= threshold) {
    return {
      status: "increase",
      title: "小幅加一点容量",
      summary: `最近 ${recent.length} 次里偏轻松，下一版会给主要力量动作小幅加组，但不直接大幅加重量。`
    };
  }
  return {
    status: "hold",
    title: "维持当前计划",
    summary: `最近 ${recent.length} 次反馈没有持续偏强或偏弱，先维持计划，只更新复盘说明。`
  };
}

function tuneExercise(exercise, signal, index) {
  const next = clone(exercise);
  if (next.type !== "strength") return next;

  const currentSets = parseSetCount(next.sets);
  if (!currentSets) return next;

  if (signal.status === "reduce") {
    next.sets = rewriteSetCount(next.sets, clamp(currentSets - 1, 1, 4));
    next.effort = "5-6/10";
    next.cue = "先降一点容量，保证动作稳和恢复。";
  }

  if (signal.status === "increase" && index <= 2) {
    next.sets = rewriteSetCount(next.sets, clamp(currentSets + 1, 2, 4));
    next.effort = "6-7/10";
    next.cue = "动作稳定时再小幅加量，不要跳重量。";
  }

  return next;
}

function getPlanHistory(plan) {
  return Array.isArray(plan && plan.customization && plan.customization.previousPlans)
    ? plan.customization.previousPlans
    : [];
}

function getPreviousPlan(plan) {
  return getPlanHistory(plan)[0] || null;
}

function createPlanHistorySnapshot(plan) {
  if (!plan) return null;
  const snapshot = clone(plan);
  if (snapshot.customization) {
    snapshot.customization = {
      mode: snapshot.customization.mode,
      updatedAt: snapshot.customization.updatedAt,
      label: snapshot.customization.label,
      review: snapshot.customization.review
    };
  }
  return snapshot;
}

function getOriginalCoachPlan(plan) {
  if (plan && plan.customization && plan.customization.originalCoachPlan) {
    return clone(plan.customization.originalCoachPlan);
  }
  return null;
}

function canRestoreOriginalPlan(plan) {
  return Boolean(getOriginalCoachPlan(plan) && plan.customization && plan.customization.mode !== "coach-restored");
}

function createPlanVersion(plan, options = {}) {
  const now = new Date();
  const previousPlan = createPlanHistorySnapshot(plan);
  const originalCoachPlan = getOriginalCoachPlan(plan) || previousPlan;
  const nextPlan = {
    ...clone(plan),
    ...(options.patch || {}),
    id: createId("plan"),
    createdAt: now.toISOString(),
    customization: {
      mode: options.mode || "custom",
      updatedAt: now.toISOString(),
      label: options.label || `计划调整 · ${formatShortDate(now)}`,
      originalCoachPlan: clone(originalCoachPlan),
      previousPlans: [previousPlan, ...getPlanHistory(plan)].filter(Boolean).slice(0, 5),
      review: options.review || {
        level: "ok",
        summary: "这版计划可以执行，建议完成 1-2 次训练后再继续调整。",
        warnings: [],
        suggestions: ["先看动作质量和恢复，再决定是否继续加量。"],
        positives: ["训练记录和身体记录不会被删除。"]
      }
    }
  };
  return nextPlan;
}

function adjustPlanFromLogs(plan, logs = []) {
  const signal = getAdjustmentSignal(logs);
  if (!plan || signal.status === "empty") {
    return {
      changed: false,
      signal,
      plan
    };
  }

  const patch = {
    adjustment: {
    status: signal.status,
    title: signal.title,
    summary: signal.summary,
    basedOn: logs.slice(-3).length,
      createdAt: new Date().toISOString()
    }
  };

  if (signal.status === "reduce" || signal.status === "increase") {
    patch.workouts = (plan.workouts || []).map((workout) => ({
      ...workout,
      exercises: (workout.exercises || []).map((exercise, index) => tuneExercise(exercise, signal, index))
    }));
  }

  if (signal.status === "reduce") {
    patch.duration = {
      ...(plan.duration || {}),
      label: "30-45 分钟"
    };
  }

  if (signal.status === "increase" && Number(plan.duration && plan.duration.budget) >= 75) {
    patch.duration = {
      ...(plan.duration || {}),
      label: "45-60 分钟"
    };
  }

  const nextPlan = createPlanVersion(plan, {
    mode: signal.status === "hold" ? "reviewed" : "adjusted",
    label: `${signal.title} · ${formatShortDate(new Date())}`,
    patch,
    review: {
      level: signal.status === "reduce" ? "warning" : "ok",
      summary: signal.summary,
      warnings: signal.status === "reduce" ? ["这次先降容量，不建议同时加重量。"] : [],
      suggestions: signal.status === "increase" ? ["只给主力动作小幅加组；如果动作变形，立刻回到上一版。"] : ["继续观察最近 1-2 次训练反馈。"],
      positives: ["调整不会删除训练记录。"]
    }
  });

  return {
    changed: signal.status !== "hold",
    signal,
    plan: nextPlan
  };
}

function restoreOriginalPlan(plan) {
  const original = getOriginalCoachPlan(plan);
  if (!original) {
    return {
      changed: false,
      message: "当前已经是 AI 原始计划。",
      plan
    };
  }

  const restoredPlan = createPlanVersion(plan, {
    mode: "coach-restored",
    label: `恢复 AI 计划 · ${formatShortDate(new Date())}`,
    patch: clone(original),
    review: {
      level: "ok",
      summary: "已恢复到 AI 原始计划。建议先按这个版本完成 1 次训练，再根据记录微调。",
      warnings: [],
      suggestions: ["如果还想微调，可以再次进入编辑计划。"],
      positives: ["原始计划仍保留基础评估里的目标、频次和单次时长。"]
    }
  });

  return {
    changed: true,
    message: "已恢复 AI 原始计划。",
    plan: restoredPlan
  };
}

function restorePreviousPlan(plan) {
  const previous = getPreviousPlan(plan);
  if (!previous) {
    return {
      changed: false,
      message: "还没有上一版计划。",
      plan
    };
  }

  const restoredPlan = createPlanVersion(plan, {
    mode: "previous-restored",
    label: `恢复上一版 · ${formatShortDate(new Date())}`,
    patch: clone(previous),
    review: {
      level: "ok",
      summary: "已恢复到上一版计划。建议按这个版本完成 1 次训练，再决定是否继续微调。",
      warnings: [],
      suggestions: ["恢复前的当前版本已进入历史，可以继续查看或再次恢复。"],
      positives: ["恢复计划不会删除训练记录。"]
    }
  });

  return {
    changed: true,
    message: "已恢复上一版计划。",
    plan: restoredPlan
  };
}

function getExerciseOptions() {
  return Object.keys(exerciseLibrary).map((key) => {
    const exercise = decorateExercise(exerciseLibrary[key]);
    return {
      key,
      id: exercise.id,
      name: exercise.name,
      equipmentName: exercise.equipmentName,
      type: exercise.type,
      sets: exercise.sets,
      reps: exercise.reps,
      load: exercise.load,
      effort: exercise.effort,
      cue: exercise.cue
    };
  });
}

function createExerciseFromKey(key) {
  const source = exerciseLibrary[key] || exerciseLibrary.chestPress;
  return decorateExercise({
    ...source,
    id: `${source.id}-${Date.now().toString(16)}`
  });
}

function buildCustomPlan(plan, draft = {}) {
  const workouts = (draft.workouts || []).map((workout, index) => ({
    id: workout.id || createId("workout"),
    title: String(workout.title || `训练日 ${index + 1}`).slice(0, 18),
    focus: String(workout.focus || "按当前目标执行，注意动作质量。").slice(0, 80),
    exercises: (workout.exercises || []).map((exercise) => ({
      ...exercise,
      sets: String(exercise.sets || "2 组").slice(0, 12),
      reps: String(exercise.reps || "10-12 次").slice(0, 16)
    })).filter((exercise) => exercise.name)
  })).filter((workout) => workout.exercises.length);

  const safeWorkouts = workouts.length ? workouts : clone(plan.workouts || []);
  return createPlanVersion(plan, {
    mode: "custom",
    label: `手动编辑 · ${formatShortDate(new Date())}`,
    patch: {
      workouts: safeWorkouts,
      frequency: {
        ...(plan.frequency || {}),
        sessionsPerWeek: safeWorkouts.length,
        pattern: safeWorkouts.map((item) => item.title).join(" / ")
      }
    },
    review: {
      level: "ok",
      summary: "你已基于 AI 计划手动编辑。建议先按新版本完成 1 次训练，再看恢复和动作质量。",
      warnings: safeWorkouts.length >= 4 ? ["每周 4 次以上对恢复要求更高，睡眠和饮食要跟上。"] : [],
      suggestions: ["只从现有动作库调整，暂不支持用户自建动作。"],
      positives: ["原始 AI 计划和上一版都会保留。"]
    }
  });
}

function getEquipment() {
  return equipment.map((item) => ({ ...item }));
}

module.exports = {
  COACH_SPEC_VERSION,
  adjustPlanFromLogs,
  buildCustomPlan,
  canRestoreOriginalPlan,
  createDemoUser,
  createExerciseFromKey,
  equipmentById,
  generatePlan,
  getCurrentWeek,
  getEquipment,
  getExerciseOptions,
  getOriginalCoachPlan,
  getPreviousPlan,
  getNextWorkout,
  normalizeAssessment,
  restoreOriginalPlan,
  restorePreviousPlan
};
