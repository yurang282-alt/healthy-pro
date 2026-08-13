const FEEDBACK_LABELS = Object.freeze({
  "too-easy": "偏轻",
  right: "正好",
  "too-hard": "偏重",
  unstable: "动作不稳"
});

const EQUIPMENT_IMAGES = Object.freeze({
  treadmill: "public/assets/equipment/treadmill.png",
  elliptical: "public/assets/equipment/elliptical.png",
  "recumbent-bike": "public/assets/equipment/recumbent-bike.png",
  rower: "public/assets/equipment/rower.png",
  "chest-back-press": "public/assets/equipment/chest-press.png",
  "high-row": "public/assets/equipment/lat-pulldown.png",
  "seated-row": "public/assets/equipment/seated-row.png",
  "leg-press": "public/assets/equipment/leg-press.png",
  "leg-extension-curl": "public/assets/equipment/leg-extension-curl.png",
  "shoulder-press": "public/assets/equipment/shoulder-press.png",
  "rear-delt": "public/assets/equipment/rear-delt.png",
  "assisted-pullup": "public/assets/equipment/assisted-pullup.png",
  "hack-squat": "public/assets/equipment/hack-squat.png",
  "smith-machine": "public/assets/web/smith-machine.jpg",
  "cable-station": "public/assets/equipment/cable-station.png",
  "hip-thrust": "public/assets/equipment/hip-thrust.png",
  "dumbbell-rack": "public/assets/equipment/dumbbell-rack.png"
});

export const WEB_EQUIPMENT_IDS = Object.freeze(Object.keys(EQUIPMENT_IMAGES));

export function buildHealthyViewModel(payload, now = new Date()) {
  const data = payload?.data || payload || {};
  const plan = data.plan && typeof data.plan === "object" ? data.plan : null;
  const logs = sortLogs(Array.isArray(data.logs) ? data.logs : []);
  const workouts = Array.isArray(plan?.workouts) ? plan.workouts.map(normalizeWorkout) : [];
  const weeks = normalizeWeeks(plan);
  const sessionsPerWeek = Math.max(0, Number(plan?.frequency?.sessionsPerWeek || 0));
  const currentWeek = getCurrentWeek(plan, logs);
  const weekInfo = getWeekInfo(plan, currentWeek);
  const weeklyLogs = getLogsInCurrentWeek(logs, now);
  const execution = data.trainingExecution || {};
  const nextWorkout = getNextWorkout(workouts, logs, execution);

  return Object.freeze({
    nickname: cleanText(data.profile?.nickname, 40) || "Rocky 用户",
    hasPlan: Boolean(plan && workouts.length),
    source: {
      kind: data.source?.kind || "healthy-weapp-cloudbase",
      syncedAt: data.source?.syncedAt || ""
    },
    goal: cleanText(plan?.goal?.type, 30) || "等待评估",
    goalReason: cleanText(plan?.goal?.priority, 160),
    pattern: cleanText(plan?.frequency?.pattern, 120) || workouts.map((item) => item.title).join(" / "),
    duration: cleanText(plan?.duration?.label, 40) || `${Number(plan?.duration?.budget || 0)} 分钟`,
    sessionsPerWeek,
    weeks,
    currentWeek,
    weekLabel: weekInfo.label,
    weekRule: weekInfo.rule,
    workouts,
    nextWorkout,
    weekly: {
      completed: weeklyLogs.length,
      target: sessionsPerWeek,
      percent: sessionsPerWeek ? Math.min(100, Math.round((weeklyLogs.length / sessionsPerWeek) * 100)) : 0,
      remaining: Math.max(0, sessionsPerWeek - weeklyLogs.length),
      days: buildWeekDays(weeklyLogs, now)
    },
    logs: logs.slice(0, 20).map(normalizeLog),
    totalSessions: logs.length,
    recentFeedback: FEEDBACK_LABELS[logs[0]?.intensityFeedback] || "暂无"
  });
}

function normalizeWeeks(plan) {
  const source = Array.isArray(plan?.weeks) && plan.weeks.length
    ? plan.weeks
    : [
        { week: 1, label: "适应周", rule: "动作标准优先" },
        { week: 2, label: "稳定周", rule: "稳定完成目标次数" },
        { week: 3, label: "微进阶周", rule: "主动作小幅加量" },
        { week: 4, label: "复盘周", rule: "根据记录调整下一轮" }
      ];
  return source.slice(0, 6).map((item, index) => ({
    week: Math.max(1, Number(item?.week || index + 1)),
    label: cleanText(item?.label, 40) || `第 ${index + 1} 周`,
    rule: cleanText(item?.rule, 140)
  }));
}

export function getEquipmentImage(equipmentId) {
  return EQUIPMENT_IMAGES[equipmentId] || "";
}

function normalizeWorkout(workout, index) {
  const exercises = Array.isArray(workout?.exercises) ? workout.exercises.map((exercise, exerciseIndex) => ({
    id: cleanText(exercise?.id, 80) || `exercise-${index}-${exerciseIndex}`,
    name: cleanText(exercise?.name, 80) || "未命名动作",
    equipmentId: cleanText(exercise?.equipmentId, 80),
    equipmentName: cleanText(exercise?.equipmentName, 80),
    type: exercise?.type === "cardio" ? "cardio" : "strength",
    sets: cleanText(exercise?.sets, 30),
    reps: cleanText(exercise?.reps || exercise?.target, 40),
    rest: cleanText(exercise?.rest, 30),
    loadLabel: cleanText(exercise?.loadLabel || exercise?.load, 80)
  })) : [];
  return {
    id: cleanText(workout?.id, 80) || `workout-${index}`,
    title: cleanText(workout?.title, 80) || `训练日 ${index + 1}`,
    focus: cleanText(workout?.focus, 160),
    exercises
  };
}

function normalizeLog(log) {
  return {
    id: cleanText(log?.id, 100),
    createdAt: log?.createdAt || "",
    dateLabel: formatDate(log?.createdAt),
    workoutId: cleanText(log?.workoutId, 80),
    title: cleanText(log?.workoutTitle, 80) || "训练记录",
    week: Math.max(1, Number(log?.week || 1)),
    completedCount: Math.max(0, Number(log?.completedCount || 0)),
    feedback: FEEDBACK_LABELS[log?.intensityFeedback] || "已完成",
    exercises: Array.isArray(log?.exercises) ? log.exercises.map((exercise) => ({
      id: cleanText(exercise?.id, 80),
      name: cleanText(exercise?.name, 80) || "训练动作",
      done: exercise?.done !== false,
      summary: getExerciseLogSummary(exercise),
      feeling: cleanText(exercise?.feelingLabel, 30)
    })) : []
  };
}

function getExerciseLogSummary(exercise) {
  if (exercise?.durationMinutes || exercise?.duration) {
    return `${exercise.durationMinutes || exercise.duration} 分钟`;
  }
  const parts = [];
  if (exercise?.setsDone) parts.push(`${exercise.setsDone} 组`);
  if (exercise?.weight) parts.push(`${exercise.weight}kg`);
  if (exercise?.reps) parts.push(`${exercise.reps} 次`);
  return parts.join(" · ") || "已完成";
}

function getNextWorkout(workouts, logs, execution) {
  if (!workouts.length) return null;
  const explicitId = execution?.overrideWorkoutId || execution?.nextWorkoutId;
  const explicit = workouts.find((workout) => workout.id === explicitId);
  if (explicit) return explicit;
  const lastWorkoutId = logs[0]?.workoutId;
  const lastIndex = workouts.findIndex((workout) => workout.id === lastWorkoutId);
  return workouts[(lastIndex + 1 + workouts.length) % workouts.length] || workouts[0];
}

function getCurrentWeek(plan, logs) {
  const explicitWeeks = Array.isArray(plan?.weeks) ? plan.weeks : [];
  const maxWeek = Math.max(1, explicitWeeks.length || 4);
  const latestWeek = Number(logs[0]?.week || 0);
  if (latestWeek) return Math.min(maxWeek, Math.max(1, latestWeek));
  return 1;
}

function getWeekInfo(plan, currentWeek) {
  const weeks = Array.isArray(plan?.weeks) ? plan.weeks : [];
  const current = weeks.find((item) => Number(item?.week) === currentWeek) || weeks[currentWeek - 1] || {};
  return {
    label: cleanText(current?.label, 40) || `第 ${currentWeek} 周`,
    rule: cleanText(current?.rule, 140)
  };
}

function sortLogs(logs) {
  return logs.slice().sort((left, right) => new Date(right?.createdAt || 0) - new Date(left?.createdAt || 0));
}

function getLogsInCurrentWeek(logs, now) {
  const weekStart = startOfWeek(now);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);
  return logs.filter((log) => {
    const date = new Date(log?.createdAt || 0);
    return date >= weekStart && date < nextWeek;
  });
}

function buildWeekDays(weeklyLogs, now) {
  const labels = ["一", "二", "三", "四", "五", "六", "日"];
  const start = startOfWeek(now);
  return labels.map((label, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const completed = weeklyLogs.some((log) => sameDay(new Date(log.createdAt), date));
    const isToday = sameDay(date, now);
    return { label, day: date.getDate(), completed, isToday };
  });
}

function startOfWeek(dateValue) {
  const date = new Date(dateValue);
  const day = date.getDay() || 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day + 1);
  return date;
}

function sameDay(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function formatDate(value) {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return "日期未知";
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", weekday: "short" }).format(date);
}

function cleanText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}
