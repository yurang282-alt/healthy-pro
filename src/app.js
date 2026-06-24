import {
  COACH_SPEC_VERSION,
  EQUIPMENT,
  EQUIPMENT_BY_ID,
  EXPERIENCE_LEVELS,
  FOCUS_AREAS,
  generateCoachPlan,
  getCurrentWeek,
  getLoadRecommendation,
  getNextWorkout,
  getPrescription,
  getWorkoutDuration,
  PLAN_EXERCISES,
  validateAssessment,
  VISIBLE_EQUIPMENT_IDS
} from "./coach.js?v=__HEALTHY_PRO_BUILD_VERSION__";
import {
  addCloudFriend,
  clearCloudSession,
  deleteCloudFriendship,
  getActiveCloudSession,
  getCloudConfigStatus,
  isCloudConfigured,
  loadCloudSocial,
  loadCloudReleases,
  loadCloudUser,
  markCloudReleaseRead,
  respondCloudFriendship,
  saveCloudAssessment,
  saveCloudBodyLog,
  saveCloudFeedback,
  saveCloudFriendProfile,
  saveCloudFriendSummary,
  saveCloudPlan,
  saveCloudTrainingLog,
  signInCloud,
  signOutCloud,
  signUpCloud
} from "./cloud.js?v=__HEALTHY_PRO_BUILD_VERSION__";

const STORAGE_KEY = "healthy-pro-store-v3";
const INSTALL_DISMISSED_KEY = "healthy-pro-install-dismissed-v1";
const LOCAL_RELEASES = [
  {
    id: "local-v0.5.0",
    version: "v0.5.0",
    title: "界面和训练流程简化",
    summary: "首页、计划、记录、器械和我的页重新分层，让训练时更容易知道下一步做什么。",
    highlights: [
      "首页聚焦今天训练和开始按钮",
      "计划页优先展示本周安排，教练解释改为折叠",
      "记录页改为逐项展开，器械页支持搜索和今日器械"
    ],
    details: "这次更新重点不是增加复杂功能，而是把训练流程变得更像一个可以拿在手里的私人教练工具。",
    releaseType: "improvement",
    publishedAt: "2026-06-09T00:00:00+08:00"
  },
  {
    id: "local-v0.6.0",
    version: "v0.6.0",
    title: "动作详情和训练中辅助",
    summary: "训练动作可以点进详情，记录页也升级成边练边看的训练助手。",
    highlights: [
      "新增动作详情页，包含器械图、调节方式、动作提示、常见错误和替代动作",
      "记录页新增当前动作卡、完成组数、训练队列和组间休息倒计时",
      "器械页可以直接查看相关动作，训练时更容易确认自己该怎么做"
    ],
    details: "这次更新让 App 不只是生成计划和记录结果，而是在训练过程中给你更清晰的动作指引。后续会继续把训练记录转化成动作进步分析和更主动的计划调整建议。",
    releaseType: "feature",
    publishedAt: "2026-06-10T11:20:00+08:00"
  },
  {
    id: "local-v0.7.0",
    version: "v0.7.0",
    title: "微信小程序功能迁移",
    summary: "小程序端补齐 PWA 已验证的训练记录、好友排行、反馈和更新公告能力。",
    highlights: [
      "记录页升级为训练助手，支持当前动作、休息倒计时和动作详情",
      "我的页补齐好友码、好友请求、稳定榜和结构化反馈",
      "小程序端发布公告支持多版本展示和已读状态"
    ],
    details: "这次更新重点是让微信小程序端和 PWA 的可用功能保持一致，方便朋友直接在微信里体验和反馈。",
    releaseType: "feature",
    publishedAt: "2026-06-22T00:00:00+08:00"
  },
  {
    id: "local-v0.7.1",
    version: "v0.7.1",
    title: "小程序用户数据隔离修复",
    summary: "微信小程序启动时会自动绑定当前微信用户，新用户不再默认进入同一套演示计划。",
    highlights: [
      "启动时自动读取微信身份并按 openid 加载云端数据",
      "新用户先进入基础评估，不再共用默认 demo 计划",
      "本地训练草稿和身体草稿按微信用户隔离"
    ],
    details: "这次修复解决体验版里不同用户先看到相同默认数据的问题。云端仍按微信 openid 分用户保存，已有误同步的纯 demo seed 会被识别并清理。",
    releaseType: "fix",
    publishedAt: "2026-06-22T12:00:00+08:00"
  },
  {
    id: "local-v0.7.2",
    version: "v0.7.2",
    title: "小程序我的页简化",
    summary: "微信小程序我的页改为训练档案、周报摘要和更多入口，减少首屏信息堆叠。",
    highlights: [
      "首屏保留训练状态和本周周报摘要",
      "好友排行、更新公告、设置与反馈改为入口卡片",
      "保留原有好友、反馈、同步和公告能力，不改变数据逻辑"
    ],
    details: "这次更新重点是减少我的页默认展示的信息量，让朋友打开后更容易知道自己当前计划状态，再按需进入周报、好友、更新或设置详情。",
    releaseType: "improvement",
    publishedAt: "2026-06-24T00:00:00+08:00"
  }
];
const app = document.querySelector("#app");
const urlParams = new URLSearchParams(window.location.search);
const isDemoMode = urlParams.get("demo") === "focus";

let store = loadStore();
let activeView = getInitialView(urlParams);
let authMode = "login";
let notice = "";
let selectedPlanWeek = getInitialWeek(urlParams);
let selectedExerciseId = urlParams.get("exercise") || "";
let selectedExerciseReturnView = urlParams.get("returnView") || "plan";
let equipmentQuery = "";
let appReady = false;
let networkOnline = navigator.onLine;
let installPromptEvent = null;
let installPromptDismissed = localStorage.getItem(INSTALL_DISMISSED_KEY) === "1";
let syncState = createInitialSyncState();
let restTimerTimeout = null;
let noticeTimeout = null;

app.innerHTML = renderLoading();
bootstrapApp();
setupPwaEvents();

app.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;

  if (action === "switch-auth") {
    authMode = authMode === "login" ? "register" : "login";
    notice = "";
    render();
  }

  if (action === "nav") {
    activeView = event.target.closest("[data-view]").dataset.view;
    render();
  }

  if (action === "view-exercise") {
    const button = event.target.closest("[data-exercise-id]");
    selectedExerciseId = button?.dataset.exerciseId || "";
    selectedExerciseReturnView = button?.dataset.returnView || activeView || "plan";
    activeView = "exercise-detail";
    render();
  }

  if (action === "select-week") {
    selectedPlanWeek = Number(event.target.closest("[data-week]").dataset.week);
    render({ keepScroll: true });
  }

  if (action === "logout") {
    if (useCloudMode()) {
      await signOutCloud();
      store.cloudUser = null;
    } else {
      store.sessionUserId = null;
    }
    saveStore();
    syncState = createInitialSyncState();
    activeView = "home";
    render();
  }

  if (action === "install-app") {
    await promptInstallApp();
  }

  if (action === "dismiss-install") {
    installPromptDismissed = true;
    localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
    render({ keepScroll: true });
  }

  if (action === "start-training") {
    activeView = "log";
    render();
  }

  if ([
    "training-prev",
    "training-next",
    "training-jump",
    "training-complete-set",
    "training-complete-cardio",
    "training-skip-rest"
  ].includes(action)) {
    handleTrainingAction(event, action);
  }

  if (action === "edit-plan") {
    const user = getUser();
    if (!user?.plan || user.plan.safetyHold) return;
    initializePlanEditorDraft(user);
    saveStore();
    activeView = "plan-edit";
    render();
  }

  if (action === "cancel-plan-edit") {
    const user = getUser();
    if (user?.drafts) delete user.drafts.planEditor;
    saveStore();
    activeView = "plan";
    render();
  }

  if (action === "add-plan-exercise") {
    const user = getUser();
    const form = event.target.closest("[data-plan-editor-form]");
    if (!user || !form) return;
    syncPlanEditorDraftFromForm(user, form);
    const workoutId = event.target.closest("[data-workout-id]")?.dataset.workoutId;
    addExerciseToPlanDraft(user, workoutId, form);
    saveStore();
    render({ keepScroll: true });
  }

  if (action === "remove-plan-exercise") {
    const user = getUser();
    const form = event.target.closest("[data-plan-editor-form]");
    if (!user || !form) return;
    syncPlanEditorDraftFromForm(user, form);
    const button = event.target.closest("[data-workout-id][data-exercise-index]");
    removeExerciseFromPlanDraft(user, button?.dataset.workoutId, Number(button?.dataset.exerciseIndex));
    saveStore();
    render({ keepScroll: true });
  }

  if (action === "toggle-previous-plan") {
    const user = getUser();
    user.drafts = user.drafts || {};
    user.drafts.showPreviousPlan = !user.drafts.showPreviousPlan;
    saveStore();
    render({ keepScroll: true });
  }

  if (action === "restore-original-plan") {
    await restoreOriginalCoachPlan();
  }

  if (action === "restore-previous-plan") {
    await restorePreviousPlan();
  }

  if (action === "friend-accept" || action === "friend-decline") {
    await handleFriendResponse(event, action === "friend-accept" ? "accepted" : "declined");
  }

  if (action === "friend-remove") {
    await handleFriendRemove(event);
  }

  if (action === "mark-release-read") {
    await handleReleaseRead(event);
  }

  if (action === "reset-assessment") {
    const user = getUser();
    if (!user) return;
    user.drafts = {
      ...(user.drafts || {}),
      assessment: user.assessment || user.drafts?.assessment || null
    };
    user.assessment = null;
    user.plan = null;
    user.assessmentRowId = null;
    user.planRowId = null;
    saveStore();
    activeView = "home";
    render();
  }

  if (action === "adjust-plan") {
    const user = getUser();
    if (!user?.assessment) return;
    if (useCloudMode() && !ensureCloudCanWrite()) return;
    user.plan = generateCoachPlan(user.assessment, user.logs || []);
    user.drafts = { ...(user.drafts || {}), training: {} };
    if (useCloudMode()) {
      try {
        setSyncState("syncing", "正在保存新计划...");
        await persistCloudPlan(user);
        setSyncState("synced", "新计划已保存到云端。");
      } catch (error) {
        notice = getFriendlyCloudError(error);
        setSyncState("error", "计划保存失败。");
        render();
        return;
      }
    }
    saveStore();
    selectedPlanWeek = getCurrentWeek(user.plan, user.logs || []);
    notice = "已根据最近训练的完成情况、动作感觉和整体强弱反馈重新调整计划。";
    activeView = "plan";
    render();
  }
});

app.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;

  if (form.matches("[data-auth-form]")) {
    await handleAuth(form);
  }

  if (form.matches("[data-assessment-form]")) {
    await handleAssessment(form);
  }

  if (form.matches("[data-training-form]")) {
    await handleTrainingLog(form);
  }

  if (form.matches("[data-body-form]")) {
    await handleBodyLog(form);
  }

  if (form.matches("[data-plan-editor-form]")) {
    await handlePlanEditor(form);
  }

  if (form.matches("[data-social-profile-form]")) {
    await handleSocialProfile(form);
  }

  if (form.matches("[data-add-friend-form]")) {
    await handleAddFriend(form);
  }

  if (form.matches("[data-feedback-form]")) {
    await handleFeedback(form);
  }
});

app.addEventListener("input", handleDraftChange);
app.addEventListener("change", handleDraftChange);

async function bootstrapApp() {
  applyDemoSeed(urlParams);
  migrateStoredPlans();

  if (useCloudMode()) {
    try {
      setSyncState("syncing", "正在恢复云端会话...");
      const session = await getActiveCloudSession();
      if (session) {
        await refreshCloudUser();
        setSyncState("synced", "云端数据已同步。");
      } else {
        store.cloudUser = null;
        setSyncState("idle", "请登录云端账号。");
      }
    } catch (error) {
      if (store.cloudUser && isNetworkError(error)) {
        setSyncState("offline", "网络不可用，正在显示最近一次云端数据。");
      } else {
        clearCloudSession();
        store.cloudUser = null;
        setSyncState("error", "云端会话已失效，请重新登录。");
        notice = getFriendlyCloudError(error);
      }
    }
  }

  appReady = true;
  saveStore();
  render();
  registerServiceWorker();
}

async function refreshCloudUser() {
  const cloudUser = await loadCloudUser();
  const localDrafts = store.cloudDrafts?.[cloudUser.id] || store.cloudUser?.drafts || {};
  cloudUser.drafts = localDrafts;
  store.cloudUser = cloudUser;

  if (cloudUser.assessment && (!cloudUser.plan || cloudUser.plan.version !== COACH_SPEC_VERSION)) {
    cloudUser.plan = generateCoachPlan(cloudUser.assessment, cloudUser.logs || []);
    await persistCloudPlan(cloudUser);
  }

  await syncCloudSocial(cloudUser);
  await syncCloudReleases(cloudUser);
  saveStore();
  return cloudUser;
}

async function persistCloudPlan(user) {
  const planRow = await saveCloudPlan(user.assessmentRowId, user.plan);
  user.planRowId = planRow.id;
  return planRow;
}

async function syncCloudSocial(user) {
  if (!useCloudMode() || !user) return;
  try {
    await saveCloudFriendSummary(getFriendSummary(user));
    user.social = await loadCloudSocial();
  } catch (error) {
    user.social = {
      schemaReady: false,
      message: getFriendlyCloudError(error)
    };
  }
}

async function syncCloudReleases(user) {
  if (!useCloudMode() || !user) return;
  try {
    user.releases = await loadCloudReleases();
  } catch (error) {
    user.releases = {
      schemaReady: false,
      message: getFriendlyCloudError(error),
      releases: [],
      unreadCount: 0
    };
  }
}

function useCloudMode() {
  return isCloudConfigured() && !isDemoMode;
}

function ensureCloudCanWrite() {
  if (!useCloudMode()) return true;
  if (!networkOnline) {
    notice = "当前离线，可以查看已加载数据；保存到云端需要恢复网络。";
    setSyncState("offline", "离线，暂不能保存。");
    render();
    return false;
  }
  return true;
}

function setSyncState(status, message) {
  syncState = { status, message, updatedAt: new Date().toISOString() };
}

function createInitialSyncState() {
  const configStatus = getCloudConfigStatus();
  if (!configStatus.ready || isDemoMode) {
    return { status: "local", message: isDemoMode ? "演示模式，本机临时数据。" : "本地模式，未连接云端保存。" };
  }
  if (!networkOnline) return { status: "offline", message: "离线，可查看已缓存数据。" };
  return { status: "idle", message: "准备连接云端。" };
}

async function handleAuth(form) {
  const formData = new FormData(form);
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email.includes("@") || password.length < 6) {
    notice = "请输入有效邮箱，密码至少 6 位。";
    render();
    return;
  }

  if (useCloudMode()) {
    await handleCloudAuth(email, password);
    return;
  }

  const passwordHash = await hashPassword(password);
  const existing = store.users.find((user) => user.email === email);

  if (authMode === "register") {
    if (existing) {
      notice = "这个邮箱已经注册，直接登录就行。";
      render();
      return;
    }

    const user = {
      id: createId("user"),
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
      assessment: null,
      plan: null,
      logs: [],
      bodyLogs: [],
      drafts: {}
    };
    store.users.push(user);
    store.sessionUserId = user.id;
    saveStore();
    notice = "";
    activeView = "home";
    render();
    return;
  }

  if (!existing || existing.passwordHash !== passwordHash) {
    notice = "邮箱或密码不匹配。";
    render();
    return;
  }

  store.sessionUserId = existing.id;
  saveStore();
  notice = "";
  activeView = "home";
  render();
}

async function handleCloudAuth(email, password) {
  if (!networkOnline) {
    notice = "当前离线，云端账号需要联网登录。";
    render();
    return;
  }

  try {
    setSyncState("syncing", authMode === "register" ? "正在创建云端账号..." : "正在登录云端账号...");
    if (authMode === "register") {
      const result = await signUpCloud(email, password);
      if (!result.session) {
        notice = "账号已创建。如果当前要求邮箱确认，请先确认邮件；如果想免确认，可以在账号服务设置里关闭邮箱确认。";
        setSyncState("idle", "等待账号确认。");
        render();
        return;
      }
    } else {
      await signInCloud(email, password);
    }

    await refreshCloudUser();
    notice = "";
    activeView = "home";
    setSyncState("synced", "云端数据已同步。");
    render();
  } catch (error) {
    notice = getFriendlyCloudError(error);
    setSyncState("error", "云端登录失败。");
    render();
  }
}

async function handleAssessment(form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  const assessment = {
    gender: data.gender,
    age: Number(data.age),
    height: Number(data.height),
    weight: Number(data.weight),
    bodyFat: data.bodyFat ? Number(data.bodyFat) : "",
    trainingExperience: data.trainingExperience,
    targetPreference: data.targetPreference,
    weeklyLimit: data.weeklyLimit,
    sessionBudget: Number(data.sessionBudget),
    focusAreas: formData.getAll("focusAreas").slice(0, 3),
    injury: data.injury
  };

  const validation = validateAssessment(assessment);
  if (!validation.valid) {
    const user = getUser();
    if (user) {
      user.drafts = {
        ...(user.drafts || {}),
        assessment
      };
      saveStore();
    }
    notice = validation.errors.join("");
    render();
    return;
  }

  const user = getUser();
  if (useCloudMode() && !ensureCloudCanWrite()) return;

  user.assessment = validation.normalized;
  user.plan = generateCoachPlan(validation.normalized, user.logs || []);
  user.drafts = {
    ...(user.drafts || {}),
    assessment: null
  };

  if (useCloudMode()) {
    try {
      setSyncState("syncing", "正在保存评估和计划...");
      const assessmentRow = await saveCloudAssessment(user.assessment);
      user.assessmentRowId = assessmentRow.id;
      await persistCloudPlan(user);
      setSyncState("synced", "评估和计划已保存到云端。");
    } catch (error) {
      notice = getFriendlyCloudError(error);
      setSyncState("error", "评估保存失败。");
      render();
      return;
    }
  }

  saveStore();
  notice = "";
  activeView = "home";
  render();
}

async function handleTrainingLog(form) {
  const user = getUser();
  if (!user?.plan || user.plan.safetyHold) return;
  if (useCloudMode() && !ensureCloudCanWrite()) return;

  const formData = new FormData(form);
  const workout = getNextWorkout(user.plan, user.logs || []);
  const week = getCurrentWeek(user.plan, user.logs || []);
  const exercises = workout.exercises.map((exercise) => {
    const id = exercise.id;
    const base = {
      exerciseId: id,
      name: exercise.name,
      type: exercise.type,
      done: formData.get(`done-${id}`) === "on",
      feeling: Number(formData.get(`feeling-${id}`) || 4)
    };

    if (exercise.type === "cardio") {
      return {
        ...base,
        durationMinutes: String(formData.get(`duration-${id}`) || "").trim(),
        speed: String(formData.get(`speed-${id}`) || "").trim(),
        incline: String(formData.get(`incline-${id}`) || "").trim(),
        resistance: String(formData.get(`resistance-${id}`) || "").trim()
      };
    }

    return {
      ...base,
      setsDone: Number(formData.get(`setsDone-${id}`) || 0),
      weight: String(formData.get(`weight-${id}`) || "").trim(),
      reps: String(formData.get(`reps-${id}`) || "").trim()
    };
  });

  const completedCount = exercises.filter((exercise) => exercise.done).length;
  if (!completedCount) {
    notice = "至少勾选一个已完成动作。";
    render();
    return;
  }

  user.logs = user.logs || [];
  const logRecord = {
    id: createId("log"),
    createdAt: new Date().toISOString(),
    workoutId: workout.id,
    workoutTitle: workout.title,
    week,
    completedCount,
    exercises,
    intensityFeedback: String(formData.get("intensityFeedback") || "right"),
    note: String(formData.get("note") || "").trim()
  };

  if (useCloudMode()) {
    try {
      setSyncState("syncing", "正在保存训练记录...");
      const savedLog = await saveCloudTrainingLog(user.planRowId, logRecord);
      user.logs.push(savedLog);
      setSyncState("synced", "训练记录已保存到云端。");
    } catch (error) {
      notice = getFriendlyCloudError(error);
      setSyncState("error", "训练记录保存失败。");
      render();
      return;
    }
  } else {
    user.logs.push(logRecord);
  }

  clearTrainingDraft(user, workout, week);

  if (useCloudMode()) {
    await syncCloudSocial(user);
  }

  saveStore();
  notice = "训练已记录。";
  activeView = "home";
  render();
}

async function handleBodyLog(form) {
  const user = getUser();
  if (!user) return;
  if (useCloudMode() && !ensureCloudCanWrite()) return;
  const formData = new FormData(form);
  const record = {
    id: createId("body"),
    createdAt: new Date().toISOString(),
    weight: Number(formData.get("bodyWeight") || 0),
    bodyFat: formData.get("bodyFatLog") ? Number(formData.get("bodyFatLog")) : null,
    sleep: Number(formData.get("sleep") || 0),
    note: String(formData.get("bodyNote") || "").trim()
  };

  if (!record.weight) {
    notice = "体重是身体记录的必填项。";
    render();
    return;
  }

  user.bodyLogs = user.bodyLogs || [];

  if (useCloudMode()) {
    try {
      setSyncState("syncing", "正在保存身体记录...");
      const savedRecord = await saveCloudBodyLog(record);
      user.bodyLogs.push(savedRecord);
      setSyncState("synced", "身体记录已保存到云端。");
    } catch (error) {
      notice = getFriendlyCloudError(error);
      setSyncState("error", "身体记录保存失败。");
      render();
      return;
    }
  } else {
    user.bodyLogs.push(record);
  }

  user.drafts = user.drafts || {};
  user.drafts.body = null;
  saveStore();
  notice = "身体状态已记录。";
  activeView = "home";
  render();
}

async function handlePlanEditor(form) {
  const user = getUser();
  if (!user?.plan || user.plan.safetyHold) return;
  if (useCloudMode() && !ensureCloudCanWrite()) return;

  syncPlanEditorDraftFromForm(user, form);
  const draft = getPlanEditorDraft(user);
  const previousPlan = createPlanHistorySnapshot(user.plan);
  const originalCoachPlan = getOriginalCoachPlan(user.plan) || previousPlan;
  const customPlan = buildCustomPlanFromDraft(user, draft, previousPlan, originalCoachPlan);

  user.plan = customPlan;
  user.drafts = {
    ...(user.drafts || {}),
    training: {},
    planEditor: null,
    showPreviousPlan: false
  };

  if (useCloudMode()) {
    try {
      setSyncState("syncing", "正在保存自定义计划...");
      await persistCloudPlan(user);
      setSyncState("synced", "自定义计划已保存到云端。");
    } catch (error) {
      notice = getFriendlyCloudError(error);
      setSyncState("error", "自定义计划保存失败。");
      render();
      return;
    }
  }

  saveStore();
  selectedPlanWeek = getCurrentWeek(user.plan, user.logs || []);
  notice = "自定义计划已保存。教练建议已更新，你可以按当前计划执行。";
  activeView = "plan";
  render();
}

async function handleSocialProfile(form) {
  const user = getUser();
  if (!user) return;
  if (!useCloudMode()) {
    notice = "好友排行需要云端账号。请用线上云端账号登录后再设置。";
    render({ keepScroll: true });
    return;
  }
  if (!ensureCloudCanWrite()) return;

  const formData = new FormData(form);
  const nickname = String(formData.get("nickname") || "").trim().slice(0, 16);
  if (!nickname) {
    notice = "昵称不能为空。";
    render({ keepScroll: true });
    return;
  }

  try {
    setSyncState("syncing", "正在保存好友设置...");
    await saveCloudFriendProfile({
      nickname,
      shareLeaderboard: formData.get("shareLeaderboard") === "on",
      shareWeeklySummary: formData.get("shareWeeklySummary") === "on",
      summary: getFriendSummary(user)
    });
    user.social = await loadCloudSocial();
    setSyncState("synced", "好友设置已保存。");
    saveStore();
    notice = "好友设置已保存。";
    render({ keepScroll: true });
  } catch (error) {
    notice = getFriendlyCloudError(error);
    setSyncState("error", "好友设置保存失败。");
    render({ keepScroll: true });
  }
}

async function handleAddFriend(form) {
  const user = getUser();
  if (!user) return;
  if (!useCloudMode()) {
    notice = "添加好友需要云端账号。";
    render({ keepScroll: true });
    return;
  }
  if (!ensureCloudCanWrite()) return;

  const code = String(new FormData(form).get("friendCode") || "").trim();
  try {
    setSyncState("syncing", "正在发送好友请求...");
    await addCloudFriend(code);
    user.social = await loadCloudSocial();
    setSyncState("synced", "好友请求已发送。");
    saveStore();
    notice = "好友请求已发送，等待对方确认。";
    render({ keepScroll: true });
  } catch (error) {
    notice = getFriendlyCloudError(error);
    setSyncState("error", "好友请求失败。");
    render({ keepScroll: true });
  }
}

async function handleFriendResponse(event, status) {
  const user = getUser();
  const friendshipId = event.target.closest("[data-friendship-id]")?.dataset.friendshipId;
  if (!user || !friendshipId || !useCloudMode()) return;
  if (!ensureCloudCanWrite()) return;

  try {
    setSyncState("syncing", status === "accepted" ? "正在确认好友..." : "正在拒绝请求...");
    await respondCloudFriendship(friendshipId, status);
    user.social = await loadCloudSocial();
    setSyncState("synced", status === "accepted" ? "好友已确认。" : "好友请求已拒绝。");
    saveStore();
    notice = status === "accepted" ? "好友已确认。" : "已拒绝这个好友请求。";
    render({ keepScroll: true });
  } catch (error) {
    notice = getFriendlyCloudError(error);
    setSyncState("error", "好友操作失败。");
    render({ keepScroll: true });
  }
}

async function handleFriendRemove(event) {
  const user = getUser();
  const friendshipId = event.target.closest("[data-friendship-id]")?.dataset.friendshipId;
  if (!user || !friendshipId || !useCloudMode()) return;
  if (!ensureCloudCanWrite()) return;

  try {
    setSyncState("syncing", "正在移除好友...");
    await deleteCloudFriendship(friendshipId);
    user.social = await loadCloudSocial();
    setSyncState("synced", "好友已移除。");
    saveStore();
    notice = "好友已移除。";
    render({ keepScroll: true });
  } catch (error) {
    notice = getFriendlyCloudError(error);
    setSyncState("error", "移除好友失败。");
    render({ keepScroll: true });
  }
}

async function handleFeedback(form) {
  const user = getUser();
  if (!user) return;
  if (!useCloudMode()) {
    notice = "反馈需要云端账号，这样我才能在后台看到。";
    render({ keepScroll: true });
    return;
  }
  if (!ensureCloudCanWrite()) return;

  const formData = new FormData(form);
  const message = String(formData.get("feedbackMessage") || "").trim();
  if (message.length < 2) {
    notice = "反馈内容至少写 2 个字。";
    render({ keepScroll: true });
    return;
  }

  try {
    setSyncState("syncing", "正在提交反馈...");
    await saveCloudFeedback({
      rating: Number(formData.get("feedbackRating") || 5),
      category: String(formData.get("feedbackCategory") || "other"),
      page: activeView,
      message
    });
    setSyncState("synced", "反馈已提交。");
    notice = "反馈已提交，我会在后台看到。";
    render({ keepScroll: true });
  } catch (error) {
    notice = getFriendlyCloudError(error);
    setSyncState("error", "反馈提交失败。");
    render({ keepScroll: true });
  }
}

async function handleReleaseRead(event) {
  const user = getUser();
  const releaseId = event.target.closest("[data-release-id]")?.dataset.releaseId;
  if (!user || !releaseId) return;

  if (useCloudMode() && !isLocalReleaseId(releaseId)) {
    if (!ensureCloudCanWrite()) return;
    try {
      setSyncState("syncing", "正在更新公告已读状态...");
      await markCloudReleaseRead(releaseId);
      user.releases = await loadCloudReleases();
      setSyncState("synced", "公告已标记为已读。");
      saveStore();
      showTemporaryNotice("已标记为已读。", { keepScroll: true });
    } catch (error) {
      notice = getFriendlyCloudError(error);
      setSyncState("error", "公告已读状态保存失败。");
      render({ keepScroll: true });
    }
    return;
  }

  store.releaseReads = {
    ...(store.releaseReads || {}),
    [releaseId]: new Date().toISOString()
  };
  saveStore();
  showTemporaryNotice("已标记为已读。", { keepScroll: true });
}

function showTemporaryNotice(message, renderOptions = {}) {
  notice = message;
  render(renderOptions);
  if (noticeTimeout) window.clearTimeout(noticeTimeout);
  noticeTimeout = window.setTimeout(() => {
    if (notice !== message) return;
    notice = "";
    noticeTimeout = null;
    render({ keepScroll: true });
  }, 1800);
}

function isLocalReleaseId(releaseId) {
  return LOCAL_RELEASES.some((release) => release.id === releaseId);
}

function handleDraftChange(event) {
  if (event.target.matches?.("[data-equipment-search]")) {
    equipmentQuery = String(event.target.value || "");
    render({ keepScroll: true });
    return;
  }

  const form = event.target.closest?.("[data-training-form], [data-body-form], [data-plan-editor-form]");
  const user = getUser();
  if (!form || !user) return;

  user.drafts = user.drafts || {};

  if (form.matches("[data-plan-editor-form]")) {
    syncPlanEditorDraftFromForm(user, form);
    if (event.target.name?.startsWith("exercise-")) {
      render({ keepScroll: true });
      return;
    }
    if (event.target.name === "customFrequency") {
      resizePlanDraftWorkouts(user.drafts.planEditor, Number(event.target.value || 3));
      render({ keepScroll: true });
      return;
    }
  }

  if (form.matches("[data-training-form]") && user.plan && !user.plan.safetyHold) {
    const workout = getNextWorkout(user.plan, user.logs || []);
    const week = getCurrentWeek(user.plan, user.logs || []);
    user.drafts.training = user.drafts.training || {};
    user.drafts.training[getTrainingDraftKey(user, workout, week)] = readFormDraft(form);
  }

  if (form.matches("[data-body-form]")) {
    user.drafts.body = readFormDraft(form);
  }

  if (useCloudMode()) {
    store.cloudDrafts = {
      ...(store.cloudDrafts || {}),
      [user.id]: user.drafts
    };
  }

  saveStore();
}

function handleTrainingAction(event, action) {
  const user = getUser();
  if (!user?.plan || user.plan.safetyHold) return;

  const workout = getNextWorkout(user.plan, user.logs || []);
  const week = getCurrentWeek(user.plan, user.logs || []);
  const exercises = workout.exercises || [];
  if (!exercises.length) return;

  const form = event.target.closest("[data-training-form]");
  const draft = {
    ...getTrainingDraft(user, workout, week),
    ...(form ? readFormDraft(form) : {})
  };
  const currentIndex = getActiveTrainingIndex(workout, draft);
  const button = event.target.closest("[data-action]");

  if (action === "training-prev") {
    draft.activeExerciseIndex = Math.max(0, currentIndex - 1);
    persistTrainingDraft(user, workout, week, draft);
    render({ keepScroll: true });
    return;
  }

  if (action === "training-next") {
    draft.activeExerciseIndex = Math.min(exercises.length - 1, currentIndex + 1);
    persistTrainingDraft(user, workout, week, draft);
    render({ keepScroll: true });
    return;
  }

  if (action === "training-jump") {
    const index = Number(button?.dataset.exerciseIndex);
    if (Number.isFinite(index)) {
      draft.activeExerciseIndex = Math.max(0, Math.min(exercises.length - 1, index));
      persistTrainingDraft(user, workout, week, draft);
      render({ keepScroll: true });
    }
    return;
  }

  const exerciseId = button?.dataset.exerciseId || exercises[currentIndex]?.id;
  const exerciseIndex = exercises.findIndex((item) => item.id === exerciseId);
  const resolvedExerciseIndex = exerciseIndex >= 0 ? exerciseIndex : currentIndex;
  const exercise = exercises[resolvedExerciseIndex];
  if (!exercise) return;

  if (action === "training-skip-rest") {
    delete draft[`restUntil-${exercise.id}`];
    persistTrainingDraft(user, workout, week, draft);
    render({ keepScroll: true });
    return;
  }

  if (action === "training-complete-cardio") {
    draft[`done-${exercise.id}`] = "on";
    draft[`feeling-${exercise.id}`] = draft[`feeling-${exercise.id}`] || 3;
    if (!draft[`duration-${exercise.id}`]) {
      draft[`duration-${exercise.id}`] = String(getTargetMinuteFallback(exercise) || "");
    }
    draft.activeExerciseIndex = getNextTrainingIndex(exercises, resolvedExerciseIndex);
    persistTrainingDraft(user, workout, week, draft);
    render({ keepScroll: true });
    return;
  }

  if (action === "training-complete-set") {
    const target = getPrescription(exercise, week, user.plan?.weeks);
    const targetSetCount = getTargetSetCount(exercise, week, user.plan?.weeks);
    const nextSetCount = Math.min(targetSetCount, getDraftSetCount(draft, exercise, targetSetCount) + 1);
    draft[`setsDone-${exercise.id}`] = nextSetCount;
    draft[`feeling-${exercise.id}`] = draft[`feeling-${exercise.id}`] || 3;

    if (nextSetCount >= targetSetCount) {
      draft[`done-${exercise.id}`] = "on";
      delete draft[`restUntil-${exercise.id}`];
      draft.activeExerciseIndex = getNextTrainingIndex(exercises, resolvedExerciseIndex);
    } else {
      draft[`restUntil-${exercise.id}`] = String(Date.now() + parseRestSeconds(target.rest) * 1000);
      draft.activeExerciseIndex = resolvedExerciseIndex;
    }

    persistTrainingDraft(user, workout, week, draft);
    render({ keepScroll: true });
  }
}

function render(options = {}) {
  if (!appReady) {
    app.innerHTML = renderLoading();
    return;
  }

  const user = getUser();
  if (!user) {
    app.innerHTML = renderAuth();
    if (!options.keepScroll) resetScroll();
    scheduleRestTimerTick(null);
    return;
  }

  const needsAssessment = !user.assessment || !user.plan;
  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">Healthy Pro</p>
          <h1>${getHeaderTitle(user, needsAssessment)}</h1>
        </div>
      </header>
      ${notice ? `<div class="notice">${notice}</div>` : ""}
      ${renderStatusBanners(user)}
      <main class="screen">
        ${needsAssessment ? renderAssessment(user) : renderActiveView(user)}
      </main>
      ${needsAssessment ? "" : renderNav()}
    </div>
  `;
  if (!options.keepScroll) resetScroll();
  scheduleRestTimerTick(user);
}

function renderLoading() {
  return `
    <main class="auth-screen">
      <section class="auth-panel">
        <p class="eyebrow">Healthy Pro</p>
        <h1>正在准备你的私教数据</h1>
        <p class="auth-copy">正在检查账号状态和本地缓存。</p>
      </section>
    </main>
  `;
}

function resetScroll() {
  requestAnimationFrame(() => window.scrollTo(0, 0));
}

function renderAuth() {
  const configStatus = getCloudConfigStatus();
  const cloudCopy = useCloudMode()
    ? "账号和训练数据会保存到云端，换手机或浏览器也能继续用。"
    : "当前还没有连接云端保存，暂时使用本地模式。";
  return `
    <main class="auth-screen">
      <section class="auth-panel">
        <p class="eyebrow">Healthy Pro</p>
        <h1>你的第一位健身房私教</h1>
        <p class="auth-copy">输入基础信息后，系统会按你的身体数据、训练经验和目标给出训练安排。${cloudCopy}</p>
        <div class="sync-banner ${useCloudMode() ? "synced" : "local"}">
          <strong>${configStatus.label}</strong>
          <span>${syncState.message}</span>
        </div>
        ${notice ? `<div class="notice">${notice}</div>` : ""}
        <form class="stack" data-auth-form>
          <label>
            邮箱
            <input name="email" type="email" autocomplete="email" placeholder="you@example.com" required />
          </label>
          <label>
            密码
            <input name="password" type="password" autocomplete="${authMode === "login" ? "current-password" : "new-password"}" minlength="6" placeholder="至少 6 位" required />
          </label>
          <button class="primary-button" type="submit">${authMode === "login" ? "登录" : "创建账号"}</button>
        </form>
        <button class="link-button" type="button" data-action="switch-auth">
          ${authMode === "login" ? "还没有账号，去注册" : "已有账号，去登录"}
        </button>
      </section>
    </main>
  `;
}

function renderStatusBanners(user) {
  const items = [];
  if (shouldShowInstallPrompt(user)) {
    items.push(`
      <div class="install-banner">
        <div>
          <strong>添加到手机桌面</strong>
          <span>像 App 一样打开 Healthy Pro。</span>
        </div>
        <div class="banner-actions">
          <button class="small-button" type="button" data-action="install-app">安装</button>
          <button class="small-button subtle" type="button" data-action="dismiss-install">稍后</button>
        </div>
      </div>
    `);
  }

  return items.length ? `<div class="status-stack">${items.join("")}</div>` : "";
}

function renderActiveView(user) {
  if (user.plan?.safetyHold) return renderSafetyHold(user);

  if (activeView === "plan") return renderPlan(user);
  if (activeView === "plan-edit") return renderPlanEditor(user);
  if (activeView === "exercise-detail") return renderExerciseDetail(user);
  if (activeView === "log") return renderLog(user);
  if (activeView === "equipment") return renderEquipment(user);
  if (activeView === "profile-weekly") return renderProfileWeekly(user);
  if (activeView === "profile-friends") return renderProfileFriends(user);
  if (activeView === "profile-releases") return renderProfileReleases(user);
  if (activeView === "profile-settings") return renderProfileSettings(user);
  if (activeView === "profile") return renderProfile(user);
  return renderHome(user);
}

function renderHome(user) {
  const plan = user.plan;
  const logs = user.logs || [];
  const workout = getNextWorkout(plan, logs);
  const week = getCurrentWeek(plan, logs);
  const workoutDuration = getWorkoutDuration(workout, week, plan.weeks);
  const latestBody = getLatest(user.bodyLogs);
  const totalCompleted = logs.reduce((sum, log) => sum + Number(log.completedCount || 0), 0);
  const focusText = getFocusText(plan);
  const previewExercises = workout.exercises.slice(0, 3);
  const remainingCount = Math.max(0, workout.exercises.length - previewExercises.length);

  return `
    <section class="today-hero">
      <div class="section-head">
        <div>
          <p class="eyebrow">今天训练</p>
          <h2>${workout.title}</h2>
        </div>
        <span class="pill">第 ${week} 周</span>
      </div>
      <p class="muted">${workout.focus}</p>
      <div class="today-meta">
        <div><span>预计</span><strong>${workoutDuration.label}</strong></div>
        <div><span>动作</span><strong>${workout.exercises.length} 个</strong></div>
        <div><span>本周</span><strong>${logs.length}/${plan.frequency.sessionsPerWeek}</strong></div>
      </div>
      <button class="primary-button hero-action" type="button" data-action="start-training">开始训练</button>
      <button class="link-button compact-link" type="button" data-action="nav" data-view="plan">查看完整计划</button>
    </section>

    <section class="section-block quiet-section">
      <div class="section-head">
        <div>
          <p class="eyebrow">今日顺序</p>
          <h2>先做这几项</h2>
        </div>
      </div>
      <div class="exercise-list compact">
        ${previewExercises.map((exercise) => renderExerciseSummary(exercise, week, user)).join("")}
      </div>
      ${remainingCount ? `<p class="empty-note">后面还有 ${remainingCount} 个动作，开始训练后按顺序完成。</p>` : ""}
    </section>

    <section class="coach-summary-card">
      <div>
        <p class="eyebrow">今日建议</p>
        <h2>${plan.goal.type}</h2>
        <p>今天先完成 ${workout.title}，动作稳定比追重量更重要。${focusText ? `当前重点：${focusText}。` : ""}</p>
      </div>
      <div class="metric-grid">
        <div><span>BMI</span><strong>${plan.metrics.bmi}</strong></div>
        <div><span>频次</span><strong>${plan.frequency.sessionsPerWeek} 次/周</strong></div>
        <div><span>时长</span><strong>${workoutDuration.label}</strong></div>
      </div>
    </section>

    <section class="section-block quiet-section">
      <div class="section-head">
        <div>
          <p class="eyebrow">最近状态</p>
          <h2>训练反馈</h2>
        </div>
        <button class="small-button" type="button" data-action="adjust-plan">调整计划</button>
      </div>
      <div class="insight-grid">
        <div><span>训练次数</span><strong>${logs.length}</strong></div>
        <div><span>完成动作</span><strong>${totalCompleted}</strong></div>
        <div><span>最近体重</span><strong>${latestBody ? `${latestBody.weight}kg` : "未记录"}</strong></div>
      </div>
      <p class="coach-note">${plan.review.recommendation}</p>
    </section>
  `;
}

function renderAssessment(user) {
  const email = user.email;
  const saved = user.assessment || user.drafts?.assessment || {};
  const selectedExperience = saved.trainingExperience || "beginner";
  const selectedTarget = saved.targetPreference || "auto";
  const selectedFocusAreas = new Set(Array.isArray(saved.focusAreas) ? saved.focusAreas : []);
  const selectedWeeklyLimit = saved.weeklyLimit || "coach";
  const selectedSessionBudget = Number(saved.sessionBudget || getDemoSessionBudget(urlParams) || 60);
  const selectedInjury = saved.injury || "none";
  return `
    <section class="section-block first-run">
      <p class="eyebrow">${email}</p>
      <h2>先做一次基础评估</h2>
      <p class="muted">只填事实和限制，目标、频次、动作和器械由教练判断。</p>
      <form class="stack" data-assessment-form>
        <div class="form-grid two">
          <label>
            年龄
            <input name="age" type="number" min="14" max="80" inputmode="numeric" value="${escapeAttr(saved.age || "")}" required />
          </label>
          <label>
            性别
            <select name="gender" required>
              <option value="male" ${saved.gender === "male" || !saved.gender ? "selected" : ""}>男</option>
              <option value="female" ${saved.gender === "female" ? "selected" : ""}>女</option>
              <option value="other" ${saved.gender === "other" ? "selected" : ""}>其他</option>
            </select>
          </label>
        </div>
        <div class="form-grid two">
          <label>
            身高 cm
            <input name="height" type="number" min="120" max="230" inputmode="decimal" value="${escapeAttr(saved.height || "")}" required />
          </label>
          <label>
            体重 kg
            <input name="weight" type="number" min="30" max="250" step="0.1" inputmode="decimal" value="${escapeAttr(saved.weight || "")}" required />
          </label>
        </div>
        <label>
          体脂率 %
          <input name="bodyFat" type="number" min="3" max="60" step="0.1" inputmode="decimal" placeholder="不知道可不填" value="${escapeAttr(saved.bodyFat || "")}" />
        </label>

        <fieldset>
          <legend>你对健身的了解程度</legend>
          <div class="choice-grid">
            ${EXPERIENCE_LEVELS.map((item) => radio("trainingExperience", item.id, item.label, item.id === selectedExperience)).join("")}
          </div>
        </fieldset>

        <fieldset>
          <legend>目标偏好</legend>
          <div class="choice-grid">
            ${radio("targetPreference", "auto", "让教练判断", selectedTarget === "auto")}
            ${radio("targetPreference", "fat-loss", "更想减脂", selectedTarget === "fat-loss")}
            ${radio("targetPreference", "gain", "更想增肌", selectedTarget === "gain")}
            ${radio("targetPreference", "shape", "更想塑形", selectedTarget === "shape")}
          </div>
        </fieldset>

        <fieldset>
          <legend>想重点加强哪里</legend>
          <p class="field-help">可不选；最多选 3 个。教练会在全身基础上多加一点对应动作。</p>
          <div class="choice-grid">
            ${FOCUS_AREAS.map((item) => checkbox("focusAreas", item.id, item.label, selectedFocusAreas.has(item.id))).join("")}
          </div>
        </fieldset>

        <fieldset>
          <legend>每周时间上限</legend>
          <div class="choice-grid">
            ${radio("weeklyLimit", "coach", "教练安排", selectedWeeklyLimit === "coach")}
            ${radio("weeklyLimit", "2", "最多 2 次", selectedWeeklyLimit === "2")}
            ${radio("weeklyLimit", "3", "约 3 次", selectedWeeklyLimit === "3")}
            ${radio("weeklyLimit", "4", "4 次以上", selectedWeeklyLimit === "4")}
          </div>
        </fieldset>

        <fieldset>
          <legend>单次可接受时长</legend>
          <div class="choice-grid three">
            ${radio("sessionBudget", "45", "45 分钟", selectedSessionBudget === 45)}
            ${radio("sessionBudget", "60", "60 分钟", selectedSessionBudget === 60)}
            ${radio("sessionBudget", "75", "75 分钟", selectedSessionBudget === 75)}
          </div>
        </fieldset>

        <fieldset>
          <legend>伤病或医生限制</legend>
          <div class="choice-grid">
            ${radio("injury", "none", "无明显伤病", selectedInjury === "none")}
            ${radio("injury", "knee", "膝盖疼痛", selectedInjury === "knee")}
            ${radio("injury", "back", "腰背疼痛", selectedInjury === "back")}
            ${radio("injury", "shoulder", "肩颈疼痛", selectedInjury === "shoulder")}
            ${radio("injury", "heart", "心血管限制", selectedInjury === "heart")}
          </div>
        </fieldset>

        <button class="primary-button" type="submit">生成我的 4 周计划</button>
      </form>
    </section>
  `;
}

function renderSafetyHold(user) {
  return `
    <section class="section-block danger-block">
      <p class="eyebrow">安全边界</p>
      <h2>暂不建议用 App 自行训练</h2>
      <p>${user.plan.risk.label}。${user.plan.risk.boundary}</p>
      <button class="primary-button" type="button" data-action="reset-assessment">重新填写评估</button>
    </section>
  `;
}

function renderPlan(user) {
  const plan = user.plan;
  const logs = user.logs || [];
  const currentWeek = getCurrentWeek(plan, logs);
  const week = selectedPlanWeek || currentWeek;
  const focusText = getFocusText(plan);
  const previousPlan = getPreviousPlan(plan);

  return `
    <section class="section-block plan-overview-card">
      <div class="section-head">
        <div>
          <p class="eyebrow">本周安排</p>
          <h2>第 ${week} 周 · ${plan.weeks[week - 1]?.label || "训练周"}</h2>
        </div>
        <button class="small-button" type="button" data-action="adjust-plan">重新调整</button>
      </div>
      <div class="plan-brief-grid">
        <div><span>训练结构</span><strong>${plan.frequency.pattern}</strong></div>
        <div><span>频次</span><strong>${plan.frequency.sessionsPerWeek} 次/周</strong></div>
        <div><span>单次上限</span><strong>${plan.duration.budget || user.assessment?.sessionBudget || 60} 分钟</strong></div>
      </div>
      <div class="week-strip" aria-label="选择周">
        ${plan.weeks.map((item) => `
          <button class="week-chip ${item.week === week ? "active" : ""}" type="button" data-action="select-week" data-week="${item.week}">
            <span>第 ${item.week} 周${item.week === currentWeek ? " · 当前" : ""}</span>
            <strong>${item.label}</strong>
          </button>
        `).join("")}
      </div>
      <p class="adjust-explainer">${plan.weeks[week - 1]?.load || ""}。${plan.weeks[week - 1]?.rule || ""}</p>
    </section>

    ${renderPlanActions(user, previousPlan)}

    ${user.drafts?.showPreviousPlan && previousPlan ? renderPreviousPlan(previousPlan) : ""}

    <section class="section-block">
      <p class="eyebrow">动作安排</p>
      <h2>这一周怎么练</h2>
      <div class="workout-stack">
        ${plan.workouts.map((workout, index) => renderWorkoutCard(workout, week, user, index)).join("")}
      </div>
    </section>

    <details class="section-block coach-details">
      <summary>
        <span>
          <p class="eyebrow">教练解释</p>
          <strong>${plan.goal.type}</strong>
        </span>
        <b>展开</b>
      </summary>
      <p class="coach-note">${plan.rationale}</p>
      ${plan.decisionSummary && !plan.customization?.review ? `<p class="adjust-explainer">${plan.decisionSummary}</p>` : ""}
      ${renderPlanReview(plan)}
      <div class="fact-list">
        <div><span>目标阶段</span><strong>${plan.goal.type}</strong></div>
        <div><span>时间上限</span><strong>${plan.frequency.limitLabel || "教练安排"}</strong></div>
        <div><span>训练经验</span><strong>${plan.experience?.label || "未填写"}</strong></div>
        <div><span>重点部位</span><strong>${focusText || "全身均衡"}</strong></div>
        <div><span>容量判断</span><strong>${getVolumeTierLabel(plan.trainingProfile?.volumeTier)}</strong></div>
        <div><span>有效组数</span><strong>${formatWeeklySetAnchor(plan.trainingProfile?.weeklySetAnchor)}</strong></div>
        <div><span>恢复安排</span><strong>${plan.frequency.restDays}</strong></div>
        <div><span>时间分配</span><strong>${plan.duration.split}</strong></div>
      </div>
      <p class="empty-note">${plan.adjustmentGuide}</p>
    </details>
  `;
}

function renderPlanActions(user, previousPlan) {
  const plan = user.plan;
  const versionLabel = plan.customization?.label || "AI 计划";
  const hasPrevious = Boolean(previousPlan);

  return `
    <details class="section-block profile-panel plan-actions">
      <summary>
        <span>
          <p class="eyebrow">计划管理</p>
          <strong>编辑、恢复或查看旧版</strong>
        </span>
        <b>${escapeHtml(versionLabel)}</b>
      </summary>
      <div class="plan-actions-body">
        <button class="primary-button" type="button" data-action="edit-plan">编辑计划</button>
        <div class="button-row">
        ${hasPrevious ? `<button class="small-button" type="button" data-action="restore-previous-plan">恢复上一版</button>` : ""}
        ${hasPrevious ? `<button class="small-button" type="button" data-action="toggle-previous-plan">${user.drafts?.showPreviousPlan ? "收起上一版" : "查看上一版"}</button>` : ""}
        ${canRestoreOriginalPlan(plan) ? `<button class="small-button" type="button" data-action="restore-original-plan">恢复 AI 计划</button>` : ""}
        </div>
      </div>
    </details>
  `;
}

function renderPlanEditor(user) {
  const draft = getPlanEditorDraft(user);
  const review = reviewCustomPlanDraft(user, draft);

  return `
    <form class="stack" data-plan-editor-form>
      <section class="section-block">
        <div class="section-head">
          <div>
            <p class="eyebrow">自定义计划</p>
            <h2>基于 AI 计划微调</h2>
          </div>
          <button class="small-button subtle" type="button" data-action="cancel-plan-edit">取消</button>
        </div>
        <p class="muted">只能从现有动作库替换或增加动作。保存后会生成新版本，原始 AI 计划仍可恢复。</p>
        ${renderPlanReview({ customization: { review } })}
        <label>
          每周训练频次
          <select name="customFrequency">
            ${[2, 3, 4].map((count) => `<option value="${count}" ${Number(draft.frequency?.sessionsPerWeek || draft.workouts.length) === count ? "selected" : ""}>每周 ${count} 次</option>`).join("")}
          </select>
        </label>
      </section>

      ${draft.workouts.map((workout, workoutIndex) => renderPlanEditorWorkout(workout, workoutIndex)).join("")}

      <section class="section-block">
        <button class="primary-button" type="submit">保存为当前执行计划</button>
        <button class="link-button" type="button" data-action="cancel-plan-edit">放弃修改</button>
      </section>
    </form>
  `;
}

function renderPlanEditorWorkout(workout, workoutIndex) {
  return `
    <section class="section-block plan-editor-workout" data-workout-id="${escapeAttr(workout.id)}">
      <p class="eyebrow">训练日 ${workoutIndex + 1}</p>
      <label>
        训练日主题
        <input name="workoutTitle-${escapeAttr(workout.id)}" value="${escapeAttr(workout.title)}" maxlength="18" />
      </label>
      <label>
        本日重点说明
        <textarea name="workoutFocus-${escapeAttr(workout.id)}" rows="2" maxlength="80">${escapeHtml(workout.focus || "")}</textarea>
      </label>
      <div class="plan-edit-list">
        ${workout.exercises.map((exercise, exerciseIndex) => renderPlanEditorExercise(workout, exercise, exerciseIndex)).join("")}
      </div>
      <div class="add-exercise-row">
        <label>
          增加动作
          <select name="addExercise-${escapeAttr(workout.id)}">
            ${renderExerciseOptions("")}
          </select>
        </label>
        <button class="small-button" type="button" data-action="add-plan-exercise">增加</button>
      </div>
    </section>
  `;
}

function renderPlanEditorExercise(workout, exercise, exerciseIndex) {
  const equipment = EQUIPMENT_BY_ID[exercise.equipmentId];
  const id = `${workout.id}-${exerciseIndex}`;
  const targetFields = exercise.type === "cardio"
    ? `
      <label>
        目标时长
        <input name="target-${escapeAttr(id)}" value="${escapeAttr(exercise.target || exercise.reps || "")}" maxlength="20" />
      </label>
    `
    : `
      <label>
        组数
        <input name="sets-${escapeAttr(id)}" type="number" min="1" max="6" step="1" inputmode="numeric" value="${Number(exercise.baseSets || 1)}" />
      </label>
      <label>
        次数
        <input name="reps-${escapeAttr(id)}" value="${escapeAttr(exercise.reps || "10-12 次")}" maxlength="20" />
      </label>
    `;

  return `
    <article class="plan-edit-exercise" data-workout-id="${escapeAttr(workout.id)}" data-exercise-index="${exerciseIndex}">
      <img class="thumb" src="${escapeAttr(equipment?.imageSrc || "/public/assets/equipment/dumbbell-rack.png")}" alt="" aria-hidden="true" />
      <div class="plan-edit-fields">
        <label>
          动作
          <select name="exercise-${escapeAttr(id)}">
            ${renderExerciseOptions(getBaseExerciseId(exercise))}
          </select>
        </label>
        <div class="form-grid two">
          ${targetFields}
        </div>
        <p class="field-help">${equipment?.name || "训练器械"} · ${exercise.type === "cardio" ? "有氧/热身" : "力量动作"}</p>
      </div>
      <button class="small-button subtle" type="button" data-action="remove-plan-exercise" data-workout-id="${escapeAttr(workout.id)}" data-exercise-index="${exerciseIndex}">删除</button>
    </article>
  `;
}

function renderLog(user) {
  const plan = user.plan;
  const logs = user.logs || [];
  const workout = getNextWorkout(plan, logs);
  const week = getCurrentWeek(plan, logs);
  const trainingDraft = getTrainingDraft(user, workout, week);
  const activeIndex = getActiveTrainingIndex(workout, trainingDraft);
  const completedCount = getDraftCompletedCount(workout, trainingDraft);
  const bodyDraft = user.drafts?.body || {};

  return `
    <section class="section-block">
      <p class="eyebrow">训练记录</p>
      <h2>${workout.title}</h2>
      <p class="muted">${workout.focus}</p>
      <div class="training-session-panel">
        <div>
          <span>进度</span>
          <strong>${completedCount}/${workout.exercises.length}</strong>
        </div>
        <div>
          <span>当前</span>
          <strong>第 ${activeIndex + 1} 项</strong>
        </div>
        <div>
          <span>草稿</span>
          <strong>自动保存</strong>
        </div>
      </div>
      <form class="stack" data-training-form>
        ${renderTrainingCoachPanel(workout, week, trainingDraft, user, activeIndex)}
        ${renderTrainingHiddenFields(workout.exercises, activeIndex, trainingDraft)}
        ${renderTrainingQueue(workout, trainingDraft, activeIndex)}
        <fieldset>
          <legend>这次练完感觉</legend>
          <div class="choice-grid three">
            ${radio("intensityFeedback", "too-easy", "太弱了", trainingDraft.intensityFeedback === "too-easy")}
            ${radio("intensityFeedback", "right", "刚刚好", !trainingDraft.intensityFeedback || trainingDraft.intensityFeedback === "right")}
            ${radio("intensityFeedback", "too-hard", "太强了", trainingDraft.intensityFeedback === "too-hard")}
          </div>
        </fieldset>
        <label>
          备注
          <textarea name="note" rows="3" placeholder="比如某个动作不稳、器械找不到、重量太轻">${escapeHtml(trainingDraft.note || "")}</textarea>
        </label>
        <button class="primary-button" type="submit">${completedCount === workout.exercises.length ? "保存本次训练" : "保存已完成训练"}</button>
      </form>
    </section>

    ${renderTrainingHistory(logs)}

    <details class="section-block profile-panel log-panel">
      <summary>
        <span>
          <p class="eyebrow">身体</p>
          <strong>身体状态</strong>
        </span>
        <b>可选</b>
      </summary>
      <form class="stack" data-body-form>
        <div class="form-grid two">
          <label>
            体重 kg
            <input name="bodyWeight" type="number" min="30" max="250" step="0.1" inputmode="decimal" value="${escapeAttr(bodyDraft.bodyWeight || "")}" required />
          </label>
          <label>
            体脂 %
            <input name="bodyFatLog" type="number" min="3" max="60" step="0.1" inputmode="decimal" placeholder="可选" value="${escapeAttr(bodyDraft.bodyFatLog || "")}" />
          </label>
        </div>
        <label>
          睡眠小时
          <input name="sleep" type="number" min="0" max="14" step="0.5" inputmode="decimal" value="${escapeAttr(bodyDraft.sleep || "")}" />
        </label>
        <label>
          身体备注
          <textarea name="bodyNote" rows="2" placeholder="精神状态、酸痛、饮食波动">${escapeHtml(bodyDraft.bodyNote || "")}</textarea>
        </label>
        <button class="secondary-button" type="submit">保存身体记录</button>
      </form>
    </details>
  `;
}

function renderTrainingCoachPanel(workout, week, draft, user, activeIndex) {
  const exercise = workout.exercises[activeIndex] || workout.exercises[0];
  if (!exercise) return "";

  const equipment = EQUIPMENT_BY_ID[exercise.equipmentId];
  const target = getPrescription(exercise, week, user?.plan?.weeks);
  const load = getLoadRecommendation(exercise, user?.assessment, user?.logs || [], week);
  const done = isDraftDone(draft, exercise.id);
  const isCardio = exercise.type === "cardio";
  const targetSetCount = getTargetSetCount(exercise, week, user?.plan?.weeks);
  const setsDone = isCardio ? (done ? 1 : 0) : getDraftSetCount(draft, exercise, targetSetCount);
  const restRemaining = getRestRemainingSeconds(draft[`restUntil-${exercise.id}`]);
  const progress = Math.round((getDraftCompletedCount(workout, draft) / Math.max(1, workout.exercises.length)) * 100);

  return `
    <article class="training-coach-card">
      <div class="training-progress-line" aria-label="本次训练完成进度">
        <span style="width: ${escapeAttr(progress)}%"></span>
      </div>
      <div class="training-current-head">
        <img class="training-visual" src="${escapeAttr(equipment?.imageSrc || "/public/assets/equipment/dumbbell-rack.png")}" alt="${escapeAttr(equipment?.name || exercise.name)}示意图" />
        <div>
          <p class="eyebrow">第 ${activeIndex + 1} 项</p>
          <h3>${escapeHtml(exercise.name)}</h3>
          <p>${escapeHtml(equipment?.name || "训练器械")} · ${target.sets} · ${target.reps}</p>
          ${load ? `<strong class="load-help">${escapeHtml(load.label)}</strong>` : ""}
        </div>
      </div>

      <div class="training-tip-grid">
        <div><span>吃力程度</span><strong>${target.effort}</strong></div>
        <div><span>休息</span><strong>${target.rest}</strong></div>
        <div><span>${isCardio ? "目标时长" : "目标组数"}</span><strong>${isCardio ? target.reps : `${setsDone}/${targetSetCount}`}</strong></div>
      </div>

      <ul class="cue-list">
        ${(exercise.cues || []).slice(0, 3).map((cue) => `<li>${escapeHtml(cue)}</li>`).join("")}
      </ul>
      ${load ? `<p class="load-note">${escapeHtml(load.detail)}${load.caution ? ` ${escapeHtml(load.caution)}` : ""}</p>` : ""}
      <button class="small-button subtle detail-inline-button" type="button" data-action="view-exercise" data-exercise-id="${escapeAttr(getBaseExerciseId(exercise))}" data-return-view="log">看动作详情</button>

      ${isCardio
        ? renderActiveCardioFields(exercise, draft, done)
        : renderActiveStrengthFields(exercise, draft, targetSetCount, setsDone, restRemaining, done)}

      <fieldset class="feeling-field">
        <legend>这个动作感觉如何</legend>
        ${renderFeelingChoices(`feeling-${exercise.id}`, Number(draft[`feeling-${exercise.id}`] || 3))}
      </fieldset>

      <div class="training-controls">
        <button class="small-button subtle" type="button" data-action="training-prev" ${activeIndex <= 0 ? "disabled" : ""}>上一项</button>
        <button class="small-button subtle" type="button" data-action="training-next" ${activeIndex >= workout.exercises.length - 1 ? "disabled" : ""}>下一项</button>
      </div>
    </article>
  `;
}

function renderActiveStrengthFields(exercise, draft, targetSetCount, setsDone, restRemaining, done) {
  const nextSet = Math.min(targetSetCount, setsDone + 1);
  return `
    <div class="set-progress" aria-label="已完成组数">
      ${Array.from({ length: targetSetCount }, (_, index) => `<span class="${index < setsDone ? "done" : ""}">${index + 1}</span>`).join("")}
    </div>
    ${restRemaining > 0 && !done
      ? `
        <div class="rest-timer">
          <div>
            <span>组间休息</span>
            <strong data-rest-until="${escapeAttr(draft[`restUntil-${exercise.id}`] || "")}">${formatSeconds(restRemaining)}</strong>
          </div>
          <button class="small-button subtle" type="button" data-action="training-skip-rest">跳过</button>
        </div>
      `
      : ""}
    <div class="form-grid two">
      <label>
        重量
        <input name="weight-${exercise.id}" type="text" inputmode="decimal" placeholder="kg/档位" value="${escapeAttr(draft[`weight-${exercise.id}`] || "")}" />
      </label>
      <label>
        实际次数
        <input name="reps-${exercise.id}" type="text" inputmode="numeric" placeholder="如 12/12/10" value="${escapeAttr(draft[`reps-${exercise.id}`] || "")}" />
      </label>
    </div>
    <button class="primary-button training-main-button" type="button" data-action="training-complete-set" data-exercise-id="${escapeAttr(exercise.id)}" ${done ? "disabled" : ""}>
      ${done ? "本动作已完成" : `完成第 ${nextSet} 组`}
    </button>
  `;
}

function renderActiveCardioFields(exercise, draft, done) {
  return `
    <div class="form-grid four">
      <label>
        时长 分钟
        <input name="duration-${exercise.id}" type="number" min="0" max="180" step="1" inputmode="decimal" placeholder="8" value="${escapeAttr(draft[`duration-${exercise.id}`] || "")}" />
      </label>
      <label>
        速度
        <input name="speed-${exercise.id}" type="number" min="0" max="30" step="0.1" inputmode="decimal" placeholder="5.5" value="${escapeAttr(draft[`speed-${exercise.id}`] || "")}" />
      </label>
      <label>
        坡度 %
        <input name="incline-${exercise.id}" type="number" min="0" max="30" step="0.5" inputmode="decimal" placeholder="3" value="${escapeAttr(draft[`incline-${exercise.id}`] || "")}" />
      </label>
      <label>
        阻力 档
        <input name="resistance-${exercise.id}" type="number" min="0" max="30" step="1" inputmode="decimal" placeholder="5" value="${escapeAttr(draft[`resistance-${exercise.id}`] || "")}" />
      </label>
    </div>
    <button class="primary-button training-main-button" type="button" data-action="training-complete-cardio" data-exercise-id="${escapeAttr(exercise.id)}" ${done ? "disabled" : ""}>
      ${done ? "本动作已完成" : "完成这段有氧"}
    </button>
  `;
}

function renderTrainingHiddenFields(exercises, activeIndex, draft = {}) {
  const fields = [hiddenInput("activeExerciseIndex", activeIndex)];
  exercises.forEach((exercise, index) => {
    fields.push(hiddenInput(`setsDone-${exercise.id}`, draft[`setsDone-${exercise.id}`] || ""));
    fields.push(hiddenInput(`restUntil-${exercise.id}`, draft[`restUntil-${exercise.id}`] || ""));
    if (index === activeIndex) {
      if (isDraftDone(draft, exercise.id)) fields.push(hiddenInput(`done-${exercise.id}`, "on"));
      return;
    }
    fields.push(renderHiddenExerciseDraft(exercise, draft));
  });

  return `<div class="training-hidden-fields">${fields.join("")}</div>`;
}

function renderHiddenExerciseDraft(exercise, draft = {}) {
  const fields = [
    isDraftDone(draft, exercise.id) ? hiddenInput(`done-${exercise.id}`, "on") : "",
    hiddenInput(`feeling-${exercise.id}`, draft[`feeling-${exercise.id}`] || 3)
  ];

  if (exercise.type === "cardio") {
    fields.push(
      hiddenInput(`duration-${exercise.id}`, draft[`duration-${exercise.id}`] || ""),
      hiddenInput(`speed-${exercise.id}`, draft[`speed-${exercise.id}`] || ""),
      hiddenInput(`incline-${exercise.id}`, draft[`incline-${exercise.id}`] || ""),
      hiddenInput(`resistance-${exercise.id}`, draft[`resistance-${exercise.id}`] || "")
    );
  } else {
    fields.push(
      hiddenInput(`weight-${exercise.id}`, draft[`weight-${exercise.id}`] || ""),
      hiddenInput(`reps-${exercise.id}`, draft[`reps-${exercise.id}`] || "")
    );
  }

  return fields.join("");
}

function renderTrainingQueue(workout, draft, activeIndex) {
  return `
    <div class="training-queue">
      <div class="training-queue-head">
        <strong>今天顺序</strong>
        <span>${getDraftCompletedCount(workout, draft)}/${workout.exercises.length}</span>
      </div>
      <div class="training-queue-list">
        ${workout.exercises.map((exercise, index) => {
          const equipment = EQUIPMENT_BY_ID[exercise.equipmentId];
          return `
            <button class="queue-item ${index === activeIndex ? "active" : ""} ${isDraftDone(draft, exercise.id) ? "done" : ""}" type="button" data-action="training-jump" data-exercise-index="${index}">
              <span>${index + 1}</span>
              <div>
                <strong>${escapeHtml(exercise.name)}</strong>
                <em>${escapeHtml(equipment?.name || "器械")}</em>
              </div>
            </button>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function hiddenInput(name, value) {
  return `<input type="hidden" name="${escapeAttr(name)}" value="${escapeAttr(value ?? "")}" />`;
}

function renderWorkoutCard(workout, week, user, index = 0) {
  const duration = getWorkoutDuration(workout, week, user?.plan?.weeks);
  return `
    <details class="workout-card" ${index === 0 ? "open" : ""}>
      <summary class="workout-card-head">
        <div>
          <h3>${workout.title}</h3>
          <p>${workout.focus}</p>
        </div>
        <span class="pill">预计 ${duration.label}</span>
      </summary>
      <div class="exercise-list">
        ${workout.exercises.map((exercise) => renderExerciseSummary(exercise, week, user)).join("")}
      </div>
    </details>
  `;
}

function renderTrainingHistory(logs = []) {
  const recentLogs = [...logs].reverse().slice(0, 12);

  return `
    <details class="section-block profile-panel log-panel">
      <summary>
        <span>
          <p class="eyebrow">历史</p>
          <strong>过去的训练</strong>
        </span>
        <b>${logs.length} 次</b>
      </summary>
      ${recentLogs.length
        ? `
          <div class="history-list">
            ${recentLogs.map((log) => {
              const completedExercises = log.exercises
                .filter((exercise) => exercise.done)
                .map((exercise) => exercise.name)
                .slice(0, 4);

              return `
                <article class="history-card">
                  <div class="history-card-head">
                    <div>
                      <strong>${log.workoutTitle}</strong>
                      <span>第 ${log.week} 周 · ${formatDate(log.createdAt)}</span>
                    </div>
                    <span>${getIntensityLabel(log.intensityFeedback)}</span>
                  </div>
                  <p>完成 ${log.completedCount} 个动作${completedExercises.length ? `：${completedExercises.join("、")}` : ""}</p>
                  ${log.note ? `<p class="history-note">${escapeHtml(log.note)}</p>` : ""}
                </article>
              `;
            }).join("")}
          </div>
        `
        : `<p class="empty-note">还没有历史训练。保存一次训练后，会按时间倒序显示在这里。</p>`}
    </details>
  `;
}

function renderPlanReview(plan) {
  const review = plan.customization?.review;
  if (!review) return "";
  const warnings = review.warnings || [];
  const suggestions = review.suggestions || [];
  const positives = review.positives || [];
  const items = [...warnings, ...suggestions, ...positives].slice(0, 5);

  return `
    <div class="plan-review ${warnings.length ? "warning" : "ok"}">
      <strong>教练建议</strong>
      <p>${escapeHtml(review.summary || "这个计划可以执行，按记录继续观察。")}</p>
      ${items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
    </div>
  `;
}

function renderPreviousPlan(plan) {
  return `
    <section class="section-block">
      <div class="section-head">
        <div>
          <p class="eyebrow">上一版计划</p>
          <h2>${plan.customization?.label || formatDate(plan.createdAt || new Date())}</h2>
        </div>
        <span class="pill">${plan.frequency?.sessionsPerWeek || plan.workouts?.length || 0} 次/周</span>
      </div>
      <div class="workout-stack compact">
        ${(plan.workouts || []).map((workout) => `
          <article class="history-card">
            <strong>${escapeHtml(workout.title)}</strong>
            <p>${escapeHtml(workout.focus || "")}</p>
            <p>${(workout.exercises || []).map((exercise) => escapeHtml(exercise.name)).join("、")}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderExerciseOptions(selectedId) {
  return `
    <option value="">选择动作</option>
    ${PLAN_EXERCISES.map((exercise) => {
      const equipment = EQUIPMENT_BY_ID[exercise.equipmentId];
      const label = `${exercise.name} · ${equipment?.name || "器械"}`;
      return `<option value="${escapeAttr(exercise.id)}" ${exercise.id === selectedId ? "selected" : ""}>${escapeHtml(label)}</option>`;
    }).join("")}
  `;
}

function renderEquipment(user) {
  const visibleEquipment = EQUIPMENT.filter((item) => VISIBLE_EQUIPMENT_IDS.includes(item.id));
  const query = equipmentQuery.trim().toLowerCase();
  const currentItems = getCurrentWorkoutEquipment(user, visibleEquipment);
  const filteredEquipment = query
    ? visibleEquipment.filter((item) => equipmentMatchesQuery(item, query))
    : visibleEquipment;
  const groups = groupEquipmentByCategory(filteredEquipment);
  return `
    <section class="section-block">
      <p class="eyebrow">器械库</p>
      <h2>先找今天要用的</h2>
      <p class="muted">器械型号会有差异，先认外形和调节方式；找不到时用同类器械替代。</p>
      <label class="search-field">
        搜索器械
        <input data-equipment-search type="search" value="${escapeAttr(equipmentQuery)}" placeholder="输入胸、背、跑步机、史密斯" />
      </label>
      ${currentItems.length && !query
        ? `
          <section class="equipment-focus">
            <div class="equipment-group-title">
              <h3>今天会用到</h3>
              <span>${currentItems.length} 类设备</span>
            </div>
            <div class="equipment-grid compact">
              ${currentItems.map((item) => renderEquipmentCard(item, true)).join("")}
            </div>
          </section>
        `
        : ""}
      ${query && !filteredEquipment.length ? `<p class="empty-note">没有找到相关器械。可以试试输入部位，比如「胸」「背」「腿」。</p>` : ""}
      <div class="equipment-zones">
        ${groups.map(([category, items]) => `
          <details class="equipment-zone" ${query || category === "有氧训练区" ? "open" : ""}>
            <summary class="equipment-group-title">
              <h3>${category}</h3>
              <span>${items.length} 类设备</span>
            </summary>
            <div class="equipment-grid">
              ${items.map((item) => renderEquipmentCard(item)).join("")}
            </div>
          </details>
        `).join("")}
      </div>
    </section>
  `;
}

function renderEquipmentCard(item, compact = false) {
  const primaryExercise = getPrimaryExerciseForEquipment(item.id);
  return `
    <article class="equipment-card ${compact ? "compact" : ""}">
      <img class="equipment-visual" src="${escapeAttr(item.imageSrc)}" alt="${escapeAttr(item.name)}示意图" />
      <div class="equipment-body">
        <h3>${item.name}</h3>
        <p>${item.muscles.join(" / ")}</p>
        <div class="mini-list">
          <strong>怎么调</strong>
          ${item.setup.slice(0, compact ? 2 : item.setup.length).map((text) => `<span>${text}</span>`).join("")}
        </div>
        ${compact ? "" : `
          <div class="mini-list warning">
            <strong>别这样</strong>
            ${item.mistakes.map((text) => `<span>${text}</span>`).join("")}
          </div>
        `}
        ${primaryExercise
          ? `<button class="small-button equipment-action" type="button" data-action="view-exercise" data-exercise-id="${escapeAttr(primaryExercise.id)}" data-return-view="equipment">查看动作</button>`
          : ""}
      </div>
    </article>
  `;
}

function renderExerciseDetail(user) {
  const exercise = getExerciseForDetail(user, selectedExerciseId);
  if (!exercise) {
    return `
      <section class="section-block">
        <p class="eyebrow">动作详情</p>
        <h2>没有找到这个动作</h2>
        <p class="empty-note">可能是计划刚刚更新过。先回到计划页重新打开动作。</p>
        <button class="secondary-button" type="button" data-action="nav" data-view="plan">返回计划</button>
      </section>
    `;
  }

  const equipment = EQUIPMENT_BY_ID[exercise.equipmentId];
  const week = getCurrentWeek(user.plan, user.logs || []);
  const target = getPrescription(exercise, week, user.plan?.weeks);
  const load = getLoadRecommendation(exercise, user.assessment, user.logs || [], week);
  const loadFactLabel = exercise.type === "cardio" ? "无需重量" : load?.shortLabel || "按感觉试";
  const relatedExercises = getRelatedExercises(exercise);
  const returnView = selectedExerciseReturnView || "plan";

  return `
    <section class="profile-subhead detail-subhead">
      <button class="small-button subtle" type="button" data-action="nav" data-view="${escapeAttr(returnView)}">返回</button>
      <div>
        <p class="eyebrow">动作详情</p>
        <h2>${escapeHtml(exercise.name)}</h2>
        <p>${escapeHtml(equipment?.name || "训练器械")} · ${escapeHtml(getExerciseArea(exercise))}</p>
      </div>
    </section>

    <section class="section-block exercise-detail-hero">
      <img class="detail-visual" src="${escapeAttr(equipment?.imageSrc || "/public/assets/equipment/dumbbell-rack.png")}" alt="${escapeAttr(equipment?.name || exercise.name)}示意图" />
      <div class="detail-facts">
        <div><span>目标</span><strong>${target.sets} · ${target.reps}</strong></div>
        <div><span>休息</span><strong>${target.rest}</strong></div>
        <div><span>吃力程度</span><strong>${target.effort}</strong></div>
        <div><span>建议重量</span><strong>${escapeHtml(loadFactLabel)}</strong></div>
      </div>
      <p class="coach-note">先用保守重量确认动作轨迹。只要出现刺痛、麻木或关节不适，本次动作直接停止。</p>
    </section>

    ${renderGuideList("先把器械调对", equipment?.setup || [])}
    ${renderGuideList("怎么做", getExerciseInstructionSteps(exercise, equipment))}
    ${load ? `
      <section class="section-block">
        <p class="eyebrow">重量建议</p>
        <h2>${escapeHtml(load.label)}</h2>
        <p class="load-note">${escapeHtml(load.detail)}${load.caution ? ` ${escapeHtml(load.caution)}` : ""}</p>
      </section>
    ` : ""}
    ${renderGuideList("别这样", equipment?.mistakes || [], "warning")}

    <section class="section-block">
      <div class="section-head">
        <div>
          <p class="eyebrow">替代动作</p>
          <h2>器械被占时怎么换</h2>
        </div>
      </div>
      ${relatedExercises.length
        ? `<div class="alternative-list">${relatedExercises.map((item) => {
          const itemEquipment = EQUIPMENT_BY_ID[item.equipmentId];
          return `
            <button class="alternative-card" type="button" data-action="view-exercise" data-exercise-id="${escapeAttr(item.id)}" data-return-view="${escapeAttr(returnView)}">
              <img class="thumb" src="${escapeAttr(itemEquipment?.imageSrc || "/public/assets/equipment/dumbbell-rack.png")}" alt="" aria-hidden="true" />
              <span><strong>${escapeHtml(item.name)}</strong><em>${escapeHtml(itemEquipment?.name || "同类器械")}</em></span>
            </button>
          `;
        }).join("")}</div>`
        : `<p class="empty-note">这个动作暂时没有合适替代。器械被占时先做下一个动作，回来再补。</p>`}
    </section>
  `;
}

function renderGuideList(title, items = [], variant = "") {
  if (!items.length) return "";
  return `
    <section class="section-block guide-block ${variant}">
      <p class="eyebrow">${variant === "warning" ? "风险提醒" : "现场提示"}</p>
      <h2>${escapeHtml(title)}</h2>
      <ol class="guide-list">
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ol>
    </section>
  `;
}

function getExerciseForDetail(user, exerciseId) {
  const id = exerciseId || "";
  const planExercises = (user?.plan?.workouts || []).flatMap((workout) => workout.exercises || []);
  const matchedPlanExercise = planExercises.find((exercise) => {
    const baseId = getBaseExerciseId(exercise);
    return [exercise.id, exercise.sourceExerciseId, baseId].includes(id);
  });
  if (matchedPlanExercise) return matchedPlanExercise;

  const libraryExercise = createExerciseFromLibrary(id);
  if (libraryExercise) return libraryExercise;

  const nextWorkout = user?.plan && !user.plan.safetyHold ? getNextWorkout(user.plan, user.logs || []) : null;
  return nextWorkout?.exercises?.[0] || null;
}

function getExerciseInstructionSteps(exercise, equipment) {
  const intro = exercise.type === "cardio"
    ? ["先从低速度或低阻力开始，身体热起来后再微调。"]
    : ["先用轻重量做 1 组试动作，确认轨迹和关节感觉。"];
  return [...intro, ...(exercise.cues || []), ...(equipment?.setup?.slice(0, 1) || [])].slice(0, 5);
}

function getRelatedExercises(exercise) {
  const baseId = getBaseExerciseId(exercise);
  const area = getExerciseArea(exercise);
  const sameEquipment = PLAN_EXERCISES.filter((item) =>
    item.id !== baseId &&
    item.equipmentId === exercise.equipmentId
  );
  const sameArea = PLAN_EXERCISES.filter((item) =>
    item.id !== baseId &&
    item.equipmentId !== exercise.equipmentId &&
    getExerciseArea(item) === area
  );
  return [...sameEquipment, ...sameArea].slice(0, 3);
}

function getPrimaryExerciseForEquipment(equipmentId) {
  return PLAN_EXERCISES.find((exercise) => exercise.equipmentId === equipmentId) || null;
}

function getCurrentWorkoutEquipment(user, visibleEquipment) {
  if (!user?.plan || user.plan.safetyHold) return [];
  const workout = getNextWorkout(user.plan, user.logs || []);
  const ids = new Set((workout.exercises || []).map((exercise) => exercise.equipmentId));
  return visibleEquipment.filter((item) => ids.has(item.id));
}

function equipmentMatchesQuery(item, query) {
  const source = [
    item.name,
    item.category,
    ...(item.muscles || []),
    ...(item.setup || []),
    ...(item.mistakes || [])
  ].join(" ").toLowerCase();
  return source.includes(query);
}

function renderProfile(user) {
  const insights = getProfileInsights(user);
  const plan = user.plan;
  const releaseState = getReleaseState(user);
  const socialSummary = getSocialSummary(user);

  return `
    <section class="profile-identity section-block">
      <p class="eyebrow">训练档案</p>
      <h2>当前计划执行中</h2>
      <p class="muted">当前目标：${plan.goal.type} · ${plan.frequency.sessionsPerWeek} 次/周</p>
      <div class="profile-chip-row">
        <span>本周 ${insights.thisWeekCount}/${insights.weekTarget || "-"} 次</span>
        <span>${useCloudMode() ? "云端数据" : "本地数据"}</span>
        <span>${releaseState.unreadCount ? `${releaseState.unreadCount} 条更新` : "已是最新"}</span>
      </div>
    </section>

    <section class="section-block profile-overview profile-summary-card">
      <div class="section-head">
        <div>
          <p class="eyebrow">周报</p>
          <h2>${insights.weekTitle}</h2>
        </div>
        <span class="pill">${insights.weekCompletionRate}%</span>
      </div>
      <div class="profile-progress" aria-label="本周训练完成率">
        <div class="progress-track">
          <span class="progress-fill" style="width: ${escapeAttr(insights.weekCompletionRate)}%"></span>
        </div>
      </div>
      <div class="metric-grid">
        <div><span>本周训练</span><strong>${insights.thisWeekCount}/${insights.weekTarget || "-"}</strong></div>
        <div><span>完成动作</span><strong>${insights.thisWeekCompleted}</strong></div>
        <div><span>最近感觉</span><strong>${insights.intensity.feelingLabel}</strong></div>
      </div>
      <p class="coach-note">${insights.coachMessage}</p>
    </section>

    <section class="section-block profile-hub">
      <p class="eyebrow">更多</p>
      <h2>选择你要看的内容</h2>
      <div class="profile-entry-list">
        ${renderProfileEntry({
          view: "profile-weekly",
          eyebrow: "周报",
          title: "周报与趋势",
          summary: `本周 ${insights.thisWeekCount}/${insights.weekTarget || "-"} 次 · ${insights.intensity.feelingLabel}`
        })}
        ${renderProfileEntry({
          view: "profile-friends",
          eyebrow: "好友",
          title: "好友与排行",
          summary: socialSummary
        })}
        ${renderProfileEntry({
          view: "profile-releases",
          eyebrow: "更新",
          title: "更新公告",
          summary: releaseState.unreadCount ? `${releaseState.unreadCount} 条未读` : "查看最近版本变化"
        })}
        ${renderProfileEntry({
          view: "profile-settings",
          eyebrow: "设置",
          title: "设置与反馈",
          summary: "账号、评估、反馈与退出"
        })}
      </div>
    </section>
  `;
}

function renderProfileEntry({ view, eyebrow, title, summary }) {
  return `
    <button class="profile-entry-card" type="button" data-action="nav" data-view="${escapeAttr(view)}">
      <span>${escapeHtml(eyebrow)}</span>
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(summary)}</p>
    </button>
  `;
}

function renderProfileWeekly(user) {
  const insights = getProfileInsights(user);
  return `
    ${renderProfileSubHeader("周报与趋势", "训练、身体和感觉变化", "profile")}
    <section class="section-block profile-overview">
      <div class="section-head">
        <div>
          <p class="eyebrow">周报</p>
          <h2>${insights.weekTitle}</h2>
        </div>
        <span class="pill">${insights.weekCompletionRate}%</span>
      </div>
      <div class="profile-progress" aria-label="本周训练完成率">
        <div class="progress-track">
          <span class="progress-fill" style="width: ${escapeAttr(insights.weekCompletionRate)}%"></span>
        </div>
      </div>
      <div class="metric-grid">
        <div><span>本周训练</span><strong>${insights.thisWeekCount}/${insights.weekTarget || "-"}</strong></div>
        <div><span>完成动作</span><strong>${insights.thisWeekCompleted}</strong></div>
        <div><span>最近感觉</span><strong>${insights.intensity.feelingLabel}</strong></div>
      </div>
      <p class="coach-note">${insights.coachMessage}</p>
    </section>
    <section class="section-block">
      <p class="eyebrow">趋势</p>
      <h2>最近 4 周</h2>
      ${renderWeeklyTrainingTrend(insights)}
      ${renderBodyTrend(insights.bodyTrend)}
      ${renderIntensityTrend(insights.intensity)}
    </section>
    <section class="section-block">
      <p class="eyebrow">档案</p>
      <h2>个人记录</h2>
      <div class="record-grid">
        ${insights.records.map((record) => `
          <div>
            <span>${record.label}</span>
            <strong>${record.value}</strong>
            <p>${record.note}</p>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderProfileFriends(user) {
  const insights = getProfileInsights(user);
  return `
    ${renderProfileSubHeader("好友与排行", "昵称、好友码和本周稳定榜", "profile")}
    ${renderFriendsSection(user, insights)}
  `;
}

function renderProfileReleases(user) {
  return `
    ${renderProfileSubHeader("更新公告", "看看最近改了什么", "profile")}
    ${renderReleaseNotice(user)}
    ${renderReleaseSection(user, true)}
  `;
}

function renderProfileSettings(user) {
  const insights = getProfileInsights(user);
  return `
    ${renderProfileSubHeader("设置与反馈", "账号、评估和体验反馈", "profile")}
    ${renderFeedbackSection()}
    ${renderSettingsSection(user, insights)}
  `;
}

function renderProfileSubHeader(title, summary, backView) {
  return `
    <section class="profile-subhead">
      <button class="small-button subtle" type="button" data-action="nav" data-view="${escapeAttr(backView)}">返回</button>
      <div>
        <p class="eyebrow">我的</p>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(summary)}</p>
      </div>
    </section>
  `;
}

function renderSettingsSection(user, insights) {
  const status = getDataStatusSummary();
  return `
    <section class="section-block">
      <p class="eyebrow">账号与设置</p>
      <h2>设置</h2>
      <div class="fact-list">
        <div><span>账号</span><strong>${escapeHtml(user.email)}</strong></div>
        <div><span>数据模式</span><strong>${escapeHtml(status.mode)}</strong></div>
        <div><span>同步状态</span><strong>${escapeHtml(status.message)}</strong></div>
        <div><span>最近训练</span><strong>${insights.latestLog ? formatDate(insights.latestLog.createdAt) : "未记录"}</strong></div>
        <div><span>最近身体记录</span><strong>${insights.bodyTrend.latest ? formatDate(insights.bodyTrend.latest.createdAt) : "未记录"}</strong></div>
      </div>
      <button class="secondary-button" type="button" data-action="reset-assessment">重新评估</button>
      <button class="link-button danger-link" type="button" data-action="logout">退出登录</button>
    </section>
  `;
}

function getDataStatusSummary() {
  if (!networkOnline) {
    return {
      mode: useCloudMode() ? getCloudConfigStatus().label : "本地浏览器",
      message: "当前离线"
    };
  }

  if (!useCloudMode()) {
    return {
      mode: isDemoMode ? "演示模式" : "本地浏览器",
      message: isDemoMode ? "本机临时数据" : "未连接云端保存"
    };
  }

  return {
    mode: getCloudConfigStatus().label,
    message: syncState.message || "云端数据已同步"
  };
}

function renderReleaseNotice(user) {
  const releaseState = getReleaseState(user);
  if (releaseState.schemaReady === false || !releaseState.unreadCount) return "";
  const latestUnread = releaseState.releases.find((release) => !release.isRead);
  if (!latestUnread) return "";

  return `
    <section class="release-alert" data-release-id="${escapeAttr(latestUnread.id)}">
      <div>
        <p class="eyebrow">新版本</p>
        <h2>${escapeHtml(latestUnread.version)} · ${escapeHtml(latestUnread.title)}</h2>
        <p>${escapeHtml(latestUnread.summary)}</p>
      </div>
      <button class="small-button" type="button" data-action="mark-release-read">我知道了</button>
    </section>
  `;
}

function renderReleaseSection(user, forceOpen = false) {
  const releaseState = getReleaseState(user);
  const releases = releaseState.releases || [];
  const shouldOpen = forceOpen || Boolean(releaseState.unreadCount) || releaseState.schemaReady === false;

  return `
    <details class="section-block profile-panel release-panel" ${shouldOpen ? "open" : ""}>
      <summary>
        <span>
          <p class="eyebrow">更新</p>
          <strong>更新公告</strong>
        </span>
        <b>${releaseState.unreadCount ? `${releaseState.unreadCount} 条未读` : "展开"}</b>
      </summary>
      ${releaseState.schemaReady === false
        ? `<p class="empty-note">${escapeHtml(releaseState.message || "更新公告需要先更新 Supabase 表结构。")}</p>`
        : ""}
      ${releaseState.schemaReady !== false && !releases.length
        ? `<p class="empty-note">还没有发布公告。后续每次合并上线后，会把重点变化放在这里。</p>`
        : ""}
      ${releaseState.schemaReady !== false && releases.length
        ? `<div class="release-list">${releases.slice(0, 5).map((release) => renderReleaseCard(release)).join("")}</div>`
        : ""}
    </details>
  `;
}

function renderReleaseCard(release) {
  return `
    <article class="release-card ${release.isRead ? "read" : "unread"}" data-release-id="${escapeAttr(release.id)}">
      <div class="release-card-head">
        <div>
          <span>${escapeHtml(release.version)} · ${formatReleaseDate(release.publishedAt)}</span>
          <strong>${escapeHtml(release.title)}</strong>
        </div>
        <em>${getReleaseTypeLabel(release.releaseType)}</em>
      </div>
      <p>${escapeHtml(release.summary)}</p>
      ${release.highlights?.length
        ? `<ul>${release.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
        : ""}
      ${release.details ? `<p class="release-detail">${escapeHtml(release.details)}</p>` : ""}
      ${release.isRead
        ? `<span class="read-mark">已读</span>`
        : `<button class="secondary-button" type="button" data-action="mark-release-read">我知道了</button>`}
    </article>
  `;
}

function getReleaseState(user) {
  const builtInState = getBuiltInReleaseState();

  if (useCloudMode()) {
    const cloudState = user.releases || {
      schemaReady: true,
      releases: [],
      unreadCount: 0
    };

    if (cloudState.schemaReady === false) {
      return {
        ...cloudState,
        releases: builtInState.releases,
        unreadCount: builtInState.unreadCount
      };
    }

    return mergeReleaseStates(cloudState, builtInState);
  }

  return builtInState;
}

function getBuiltInReleaseState() {
  const reads = store.releaseReads || {};
  const releases = LOCAL_RELEASES.map((release) => ({
    ...release,
    readAt: reads[release.id] || null,
    isRead: Boolean(reads[release.id])
  }));

  return {
    schemaReady: true,
    releases,
    unreadCount: releases.filter((release) => !release.isRead).length
  };
}

function mergeReleaseStates(cloudState, builtInState) {
  const cloudReleases = cloudState.releases || [];
  const cloudVersions = new Set(cloudReleases.map((release) => release.version));
  const fallbackReleases = builtInState.releases.filter((release) => !cloudVersions.has(release.version));
  const releases = [...cloudReleases, ...fallbackReleases]
    .sort((left, right) => new Date(right.publishedAt) - new Date(left.publishedAt));

  return {
    ...cloudState,
    releases,
    unreadCount: releases.filter((release) => !release.isRead).length
  };
}

function getReleaseTypeLabel(type) {
  if (type === "feature") return "新功能";
  if (type === "fix") return "修复";
  return "优化";
}

function getSocialSummary(user) {
  if (!useCloudMode()) return "登录云端后可添加好友";
  const social = user.social || {};
  if (social.schemaReady === false) return "需要更新云端表结构";
  const friendships = social.friendships || [];
  const incoming = friendships.filter((item) => item.status === "pending" && item.direction === "incoming").length;
  const accepted = friendships.filter((item) => item.status === "accepted").length;
  if (incoming) return `${incoming} 个好友请求待确认`;
  if (accepted) return `${accepted} 个好友 · 榜单 ${social.leaderboard?.length || 0} 人`;
  return "添加好友后查看本周排行";
}

function renderFriendsSection(user, insights) {
  if (!useCloudMode()) {
    return `
      <section class="section-block">
        <div class="section-head">
          <div>
            <p class="eyebrow">好友排行</p>
            <h2>云端账号可用</h2>
          </div>
          <span class="pill muted-pill">未开启</span>
        </div>
        <p class="empty-note">好友、昵称和排行需要云端账号。朋友体验时请用线上地址注册或登录。</p>
      </section>
    `;
  }

  const social = user.social || {};
  if (social.schemaReady === false) {
    return `
      <section class="section-block">
        <p class="eyebrow">好友排行</p>
        <h2>需要更新云端表结构</h2>
        <p class="empty-note">${escapeHtml(social.message || "请先在 Supabase SQL Editor 执行最新 docs/supabase-schema.sql。")}</p>
      </section>
    `;
  }

  const profile = social.friendProfile || {};
  const friendships = social.friendships || [];
  const incoming = friendships.filter((item) => item.status === "pending" && item.direction === "incoming");
  const outgoing = friendships.filter((item) => item.status === "pending" && item.direction === "outgoing");
  const accepted = friendships.filter((item) => item.status === "accepted");

  return `
    <section class="section-block">
      <div class="section-head">
        <div>
          <p class="eyebrow">好友排行</p>
          <h2>本周稳定榜</h2>
        </div>
        <span class="pill">${social.leaderboard?.length || 0} 人</span>
      </div>

      <form class="stack social-settings" data-social-profile-form>
        <label>
          昵称
          <input name="nickname" maxlength="16" value="${escapeAttr(profile.nickname || getDefaultNickname(user.email))}" />
        </label>
        <div class="friend-code-card">
          <span>我的好友码</span>
          <strong>${escapeHtml(profile.friendCode || "同步后生成")}</strong>
          <p>发给朋友，对方输入后你确认即可成为好友。</p>
        </div>
        <div class="share-grid">
          <label class="check-card">
            <input type="checkbox" name="shareLeaderboard" ${profile.shareLeaderboard ? "checked" : ""} />
            <span>参与好友排行</span>
          </label>
          <label class="check-card">
            <input type="checkbox" name="shareWeeklySummary" ${profile.shareWeeklySummary ? "checked" : ""} />
            <span>共享本周摘要</span>
          </label>
        </div>
        <button class="secondary-button" type="submit">保存昵称和共享设置</button>
      </form>

      <form class="add-friend-form" data-add-friend-form>
        <label>
          添加好友
          <input name="friendCode" maxlength="12" placeholder="输入好友码" />
        </label>
        <button class="small-button" type="submit">发送请求</button>
      </form>

      ${renderLeaderboard(social.leaderboard || [], profile)}
      ${renderFriendRequests(incoming, outgoing)}
      ${renderAcceptedFriends(accepted)}
      <p class="empty-note">排行只展示完成率、训练次数和连续记录周数，不展示体重、体脂和训练重量。</p>
    </section>
  `;
}

function renderLeaderboard(leaderboard, profile) {
  if (!leaderboard.length) {
    return `<p class="empty-note">打开「参与好友排行」并添加好友后，这里会显示本周榜单。</p>`;
  }

  return `
    <div class="leaderboard-preview">
      ${leaderboard.map((item, index) => `
        <div class="leaderboard-row ${item.isSelf ? "self" : ""}">
          <span>${index + 1}</span>
          <div>
            <strong>${escapeHtml(item.nickname)}${item.isSelf ? " · 我" : ""}</strong>
            <p>完成率 ${item.currentWeekCompletionRate}% · 本周 ${item.currentWeekCount} 次 · 连续 ${item.streakWeeks} 周</p>
          </div>
        </div>
      `).join("")}
    </div>
    ${profile.shareLeaderboard ? "" : `<p class="empty-note">你还没有参与排行。打开共享后，好友才能在榜单看到你的摘要。</p>`}
  `;
}

function renderFriendRequests(incoming, outgoing) {
  if (!incoming.length && !outgoing.length) return "";
  return `
    <div class="friend-list">
      ${incoming.map((item) => `
        <article class="friend-card" data-friendship-id="${escapeAttr(item.id)}">
          <div>
            <strong>${escapeHtml(item.nickname)}</strong>
            <p>请求添加你为好友</p>
          </div>
          <div class="friend-actions">
            <button class="small-button" type="button" data-action="friend-accept">确认</button>
            <button class="small-button subtle" type="button" data-action="friend-decline">拒绝</button>
          </div>
        </article>
      `).join("")}
      ${outgoing.map((item) => `
        <article class="friend-card">
          <div>
            <strong>${escapeHtml(item.nickname)}</strong>
            <p>等待对方确认</p>
          </div>
          <span class="pill muted-pill">待确认</span>
        </article>
      `).join("")}
    </div>
  `;
}

function renderAcceptedFriends(friends) {
  if (!friends.length) return `<p class="empty-note">还没有好友。先让朋友发你好友码，或输入朋友的好友码。</p>`;
  return `
    <div class="friend-list">
      ${friends.map((item) => `
        <article class="friend-card" data-friendship-id="${escapeAttr(item.id)}">
          <div>
            <strong>${escapeHtml(item.nickname)}</strong>
            <p>${item.shareLeaderboard ? `本周 ${item.currentWeekCount} 次 · 完成率 ${item.currentWeekCompletionRate}%` : "对方未参与排行"}</p>
          </div>
          <button class="small-button subtle" type="button" data-action="friend-remove">移除</button>
        </article>
      `).join("")}
    </div>
  `;
}

function renderFeedbackSection(embedded = false) {
  const body = `
      <div class="section-head">
        <div>
          <p class="eyebrow">体验反馈</p>
          <h2>给我提意见</h2>
        </div>
        <span class="pill">测试期</span>
      </div>
      <form class="stack" data-feedback-form>
        <div class="form-grid two">
          <label>
            评分
            <select name="feedbackRating">
              <option value="5">5 分 · 很顺</option>
              <option value="4">4 分 · 还不错</option>
              <option value="3">3 分 · 一般</option>
              <option value="2">2 分 · 有点卡</option>
              <option value="1">1 分 · 不好用</option>
            </select>
          </label>
          <label>
            类型
            <select name="feedbackCategory">
              <option value="confusing">看不懂</option>
              <option value="plan">计划不合理</option>
              <option value="equipment">器械找不到</option>
              <option value="ux">页面不好用</option>
              <option value="other">其他</option>
            </select>
          </label>
        </div>
        <label>
          反馈内容
          <textarea name="feedbackMessage" rows="3" maxlength="500" placeholder="哪里卡住了，或者你希望增加什么"></textarea>
        </label>
        <button class="secondary-button" type="submit">提交反馈</button>
      </form>
      <p class="empty-note">反馈只有项目维护者在 Supabase 后台查看，好友之间不可见。</p>
  `;

  return embedded ? `<div class="embedded-panel">${body}</div>` : `<section class="section-block">${body}</section>`;
}

function renderWeeklyTrainingTrend(insights) {
  const maxCount = Math.max(1, insights.weekTarget || 0, ...insights.weeklyBuckets.map((item) => item.count));
  return `
    <div class="trend-block">
      <div class="trend-title">
        <strong>训练完成趋势</strong>
        <span>计划 ${insights.weekTarget || "-"} 次/周</span>
      </div>
      <div class="trend-list">
        ${insights.weeklyBuckets.map((item) => {
          const width = Math.min(100, Math.round((item.count / maxCount) * 100));
          return `
            <div class="trend-row">
              <div class="trend-meta">
                <span>${item.label}</span>
                <strong>${item.count} 次 · ${item.completed} 动作</strong>
              </div>
              <div class="trend-track"><span class="trend-fill" style="width: ${escapeAttr(width)}%"></span></div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function renderBodyTrend(bodyTrend) {
  if (!bodyTrend.latest) {
    return `<p class="empty-note">还没有身体记录。保存体重后，这里会显示体重和体脂变化。</p>`;
  }

  return `
    <div class="trend-block">
      <div class="trend-title">
        <strong>身体记录</strong>
        <span>${formatDate(bodyTrend.latest.createdAt)}</span>
      </div>
      <div class="body-trend-grid">
        <div>
          <span>体重</span>
          <strong>${formatMetric(bodyTrend.latest.weight)}kg</strong>
          <p>${bodyTrend.weightDelta}</p>
        </div>
        <div>
          <span>体脂</span>
          <strong>${bodyTrend.latest.bodyFat ? `${formatMetric(bodyTrend.latest.bodyFat)}%` : "未记录"}</strong>
          <p>${bodyTrend.bodyFatDelta}</p>
        </div>
      </div>
    </div>
  `;
}

function renderIntensityTrend(intensity) {
  if (!intensity.recentCount) {
    return `<p class="empty-note">还没有训练感觉记录。保存训练后，会分析偏轻、刚好或偏强。</p>`;
  }

  const maxCount = Math.max(1, intensity.tooEasy, intensity.right, intensity.tooHard);
  const rows = [
    ["太弱", intensity.tooEasy],
    ["刚好", intensity.right],
    ["太强", intensity.tooHard]
  ];

  return `
    <div class="trend-block">
      <div class="trend-title">
        <strong>强度趋势</strong>
        <span>近 ${intensity.recentCount} 次训练</span>
      </div>
      <div class="intensity-summary">
        <div><span>平均感觉</span><strong>${intensity.feelingLabel}</strong></div>
        <div><span>最新反馈</span><strong>${intensity.latestFeedbackLabel}</strong></div>
      </div>
      <div class="trend-list">
        ${rows.map(([label, count]) => {
          const width = Math.min(100, Math.round((count / maxCount) * 100));
          return `
            <div class="trend-row compact">
              <div class="trend-meta">
                <span>${label}</span>
                <strong>${count} 次</strong>
              </div>
              <div class="trend-track"><span class="trend-fill soft" style="width: ${escapeAttr(width)}%"></span></div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function renderExerciseSummary(exercise, week, user) {
  const equipment = EQUIPMENT_BY_ID[exercise.equipmentId];
  const target = getPrescription(exercise, week, user?.plan?.weeks);
  const load = getLoadRecommendation(exercise, user?.assessment, user?.logs || [], week);
  const tag = exercise.focusTag ? ` · ${exercise.focusTag}` : "";
  return `
    <button class="exercise-row exercise-row-button" type="button" data-action="view-exercise" data-exercise-id="${escapeAttr(getBaseExerciseId(exercise))}" data-return-view="${escapeAttr(activeView)}">
      <img class="thumb" src="${escapeAttr(equipment.imageSrc)}" alt="" aria-hidden="true" />
      <div>
        <strong>${exercise.name}</strong>
        <span>${equipment.name}${tag} · ${target.sets} · ${target.reps}</span>
        ${load ? `<span class="load-help">${load.label}</span>` : ""}
        <span class="effort-help">吃力程度 ${target.effort}：${target.effortText}</span>
      </div>
    </button>
  `;
}

function renderExerciseLog(exercise, week, draft = {}, user, index = 0) {
  const equipment = EQUIPMENT_BY_ID[exercise.equipmentId];
  const target = getPrescription(exercise, week, user?.plan?.weeks);
  const load = getLoadRecommendation(exercise, user?.assessment, user?.logs || [], week);
  const metricFields = exercise.type === "cardio"
    ? `
      <div class="form-grid four">
        <label>
          时长 分钟
          <input name="duration-${exercise.id}" type="number" min="0" max="180" step="1" inputmode="decimal" placeholder="10" value="${escapeAttr(draft[`duration-${exercise.id}`] || "")}" />
        </label>
        <label>
          速度
          <input name="speed-${exercise.id}" type="number" min="0" max="30" step="0.1" inputmode="decimal" placeholder="5.5" value="${escapeAttr(draft[`speed-${exercise.id}`] || "")}" />
        </label>
        <label>
          坡度 %
          <input name="incline-${exercise.id}" type="number" min="0" max="30" step="0.5" inputmode="decimal" placeholder="3" value="${escapeAttr(draft[`incline-${exercise.id}`] || "")}" />
        </label>
        <label>
          阻力 档
          <input name="resistance-${exercise.id}" type="number" min="0" max="30" step="1" inputmode="decimal" placeholder="5" value="${escapeAttr(draft[`resistance-${exercise.id}`] || "")}" />
        </label>
      </div>
    `
    : `
      <div class="form-grid two">
        <label>
          重量
          <input name="weight-${exercise.id}" type="text" inputmode="decimal" placeholder="${escapeAttr(load?.inputPlaceholder || "kg/档位")}" value="${escapeAttr(draft[`weight-${exercise.id}`] || "")}" />
        </label>
        <label>
          实际次数
          <input name="reps-${exercise.id}" type="text" inputmode="numeric" placeholder="例如 12/12/10" value="${escapeAttr(draft[`reps-${exercise.id}`] || "")}" />
        </label>
      </div>
    `;

  return `
    <details class="log-item" ${index === 0 ? "open" : ""}>
      <summary class="log-title">
        <img class="thumb" src="${escapeAttr(equipment.imageSrc)}" alt="" aria-hidden="true" />
        <div>
          <strong>${exercise.name}</strong>
          <span>${target.sets} · ${target.reps} · 休息 ${target.rest}</span>
          ${load ? `<span class="load-help">${load.label}</span>` : ""}
        </div>
        <span class="log-step">第 ${index + 1} 项</span>
      </summary>
      <div class="log-body">
        <label class="check-pill">
          <input name="done-${exercise.id}" type="checkbox" ${draft[`done-${exercise.id}`] ? "checked" : ""} />
          完成这个动作
        </label>
        <p>${exercise.cues.join("；")}</p>
        ${load ? `<p class="load-note">${load.detail}${load.caution ? ` ${load.caution}` : ""}</p>` : ""}
        ${metricFields}
        <fieldset class="feeling-field">
          <legend>这个动作感觉如何</legend>
          ${renderFeelingChoices(`feeling-${exercise.id}`, Number(draft[`feeling-${exercise.id}`] || 3))}
        </fieldset>
      </div>
    </details>
  `;
}

function renderNav() {
  const items = [
    ["home", "首页"],
    ["plan", "计划"],
    ["log", "记录"],
    ["equipment", "器械"],
    ["profile", "我的"]
  ];

  return `
    <nav class="bottom-nav" aria-label="主导航">
        ${items.map(([view, label]) => `
        <button class="${isNavItemActive(view) ? "active" : ""}" type="button" data-action="nav" data-view="${view}">
          ${label}
        </button>
      `).join("")}
    </nav>
  `;
}

function isNavItemActive(view) {
  if (activeView === view) return true;
  if (activeView === "plan-edit" && view === "plan") return true;
  if (activeView === "exercise-detail" && selectedExerciseReturnView === view) return true;
  if (view === "profile" && activeView.startsWith("profile-")) return true;
  return false;
}

function getHeaderTitle(user, needsAssessment) {
  if (needsAssessment) return "基础评估";
  if (user.plan?.safetyHold) return "安全提醒";
  const titles = {
    home: "今日训练",
    plan: "训练计划",
    "plan-edit": "编辑计划",
    "exercise-detail": "动作详情",
    log: "训练记录",
    equipment: "器械库",
    profile: "我的",
    "profile-weekly": "周报与趋势",
    "profile-friends": "好友与排行",
    "profile-releases": "更新公告",
    "profile-settings": "设置与反馈"
  };
  return titles[activeView] || "今日训练";
}

function radio(name, value, label, checked = false) {
  return `
    <label class="choice">
      <input type="radio" name="${name}" value="${value}" ${checked ? "checked" : ""} />
      <span>${label}</span>
    </label>
  `;
}

function checkbox(name, value, label, checked = false) {
  return `
    <label class="choice">
      <input type="checkbox" name="${name}" value="${value}" ${checked ? "checked" : ""} />
      <span>${label}</span>
    </label>
  `;
}

function renderFeelingChoices(name, selected = 3) {
  const choices = [
    [1, "😄", "太轻松"],
    [2, "🙂", "轻松"],
    [3, "😐", "刚好"],
    [4, "😓", "有点累"],
    [5, "😣", "很吃力"],
    [6, "😭", "太难"],
    [7, "⚠️", "有不适"]
  ];

  return `
    <div class="feeling-grid">
      ${choices.map(([value, icon, label]) => `
        <label class="feeling-choice">
          <input type="radio" name="${name}" value="${value}" ${value === selected ? "checked" : ""} />
          <span><b>${icon}</b>${label}</span>
        </label>
      `).join("")}
    </div>
  `;
}

function initializePlanEditorDraft(user) {
  user.drafts = user.drafts || {};
  user.drafts.planEditor = createEditablePlanDraft(user.plan);
}

function getPlanEditorDraft(user) {
  user.drafts = user.drafts || {};
  if (!user.drafts.planEditor || user.drafts.planEditor.planId !== user.plan?.id) {
    initializePlanEditorDraft(user);
  }
  return user.drafts.planEditor;
}

function createEditablePlanDraft(plan) {
  const workouts = (plan.workouts || []).map((workout, index) => ({
    id: workout.id || `workout-${index + 1}`,
    title: workout.title || `训练日 ${index + 1}`,
    focus: workout.focus || "围绕当前目标安排训练",
    exercises: normalizeExerciseInstances(workout.exercises || [])
  }));

  return {
    planId: plan.id,
    frequency: {
      sessionsPerWeek: Math.max(2, Math.min(4, Number(plan.frequency?.sessionsPerWeek || workouts.length || 3)))
    },
    workouts
  };
}

function syncPlanEditorDraftFromForm(user, form) {
  const draft = getPlanEditorDraft(user);
  draft.frequency = {
    ...(draft.frequency || {}),
    sessionsPerWeek: Math.max(2, Math.min(4, Number(form.elements.customFrequency?.value || draft.workouts.length || 3)))
  };

  draft.workouts = draft.workouts.map((workout) => {
    const title = String(form.elements[`workoutTitle-${workout.id}`]?.value || workout.title || "").trim() || workout.title;
    const focus = String(form.elements[`workoutFocus-${workout.id}`]?.value || workout.focus || "").trim() || workout.focus;
    const exercises = workout.exercises.map((exercise, index) => {
      const fieldId = `${workout.id}-${index}`;
      const selectedId = form.elements[`exercise-${fieldId}`]?.value || getBaseExerciseId(exercise);
      const baseExercise = createExerciseFromLibrary(selectedId) || { ...exercise };
      const nextExercise = {
        ...baseExercise,
        sourceExerciseId: getBaseExerciseId(baseExercise)
      };

      if (nextExercise.type === "cardio") {
        nextExercise.target = String(form.elements[`target-${fieldId}`]?.value || nextExercise.target || "").trim() || nextExercise.target;
      } else {
        nextExercise.baseSets = Math.max(1, Math.min(6, Number(form.elements[`sets-${fieldId}`]?.value || nextExercise.baseSets || 1)));
        nextExercise.reps = String(form.elements[`reps-${fieldId}`]?.value || nextExercise.reps || "").trim() || nextExercise.reps;
      }

      return nextExercise;
    });

    return {
      ...workout,
      title,
      focus,
      exercises: normalizeExerciseInstances(exercises)
    };
  });

  resizePlanDraftWorkouts(draft, draft.frequency.sessionsPerWeek);
}

function addExerciseToPlanDraft(user, workoutId, form) {
  const draft = getPlanEditorDraft(user);
  const workout = draft.workouts.find((item) => item.id === workoutId);
  if (!workout) return;
  const selectedId = form.elements[`addExercise-${workoutId}`]?.value;
  const exercise = createExerciseFromLibrary(selectedId);
  if (!exercise) {
    notice = "先选择一个要增加的动作。";
    return;
  }
  workout.exercises = normalizeExerciseInstances([...(workout.exercises || []), exercise]);
  notice = "";
}

function removeExerciseFromPlanDraft(user, workoutId, exerciseIndex) {
  const draft = getPlanEditorDraft(user);
  const workout = draft.workouts.find((item) => item.id === workoutId);
  if (!workout || !Number.isInteger(exerciseIndex)) return;
  if ((workout.exercises || []).length <= 1) {
    notice = "每个训练日至少保留一个动作。";
    return;
  }
  workout.exercises = workout.exercises.filter((_, index) => index !== exerciseIndex);
  notice = "";
}

function resizePlanDraftWorkouts(draft, requestedCount) {
  const count = Math.max(2, Math.min(4, Number(requestedCount || 3)));
  draft.frequency = { ...(draft.frequency || {}), sessionsPerWeek: count };
  draft.workouts = draft.workouts || [];

  while (draft.workouts.length < count) {
    const source = draft.workouts[draft.workouts.length % Math.max(1, draft.workouts.length)] || createFallbackWorkoutDraft();
    const nextIndex = draft.workouts.length + 1;
    draft.workouts.push({
      ...cloneData(source),
      id: createId("custom_workout"),
      title: `自定义训练日 ${nextIndex}`,
      focus: "从已有训练日复制而来，请确认主题、动作和恢复安排。"
    });
  }

  if (draft.workouts.length > count) {
    draft.workouts = draft.workouts.slice(0, count);
  }
}

function createFallbackWorkoutDraft() {
  return {
    id: createId("custom_workout"),
    title: "自定义训练日",
    focus: "从动作库添加动作，保存前查看教练建议。",
    exercises: normalizeExerciseInstances([createExerciseFromLibrary("treadmill-warmup-short") || PLAN_EXERCISES[0]])
  };
}

function buildCustomPlanFromDraft(user, draft, previousPlan, originalCoachPlan) {
  const plan = cloneData(user.plan);
  const workouts = draft.workouts.map((workout) => ({
    ...workout,
    exercises: normalizeExerciseInstances(workout.exercises || [])
  }));
  const review = reviewCustomPlanDraft(user, { ...draft, workouts });
  const history = [previousPlan, ...getPlanHistory(user.plan)].filter(Boolean).slice(0, 5);
  const sessionsPerWeek = Math.max(2, Math.min(4, Number(draft.frequency?.sessionsPerWeek || workouts.length || 3)));
  const duration = getCustomPlanDuration(workouts, plan.weeks, user.assessment);

  return {
    ...plan,
    id: createId("plan"),
    createdAt: new Date().toISOString(),
    workouts,
    frequency: {
      ...(plan.frequency || {}),
      sessionsPerWeek,
      pattern: workouts.map((workout) => workout.title).join(" / "),
      restDays: sessionsPerWeek >= 4 ? "连续两天训练后至少安排 1 天轻松或休息" : "两次力量训练之间尽量间隔 1 天"
    },
    duration: {
      ...(plan.duration || {}),
      ...duration
    },
    rationale: `${trimSentence(plan.goal?.priority || "基于当前目标继续训练")}。你已在教练计划基础上做了自定义调整，执行前重点看下方教练建议。`,
    decisionSummary: review.summary,
    customization: {
      mode: "custom",
      updatedAt: new Date().toISOString(),
      label: `自定义计划 · ${formatDate(new Date())}`,
      originalCoachPlan,
      previousPlans: history,
      review
    }
  };
}

async function restoreOriginalCoachPlan() {
  const user = getUser();
  if (!user?.plan) return;
  const original = getOriginalCoachPlan(user.plan);
  if (!original) {
    notice = "当前计划已经是 AI 原始计划。";
    render({ keepScroll: true });
    return;
  }
  if (useCloudMode() && !ensureCloudCanWrite()) return;

  const previousPlan = createPlanHistorySnapshot(user.plan);
  const restoredPlan = {
    ...cloneData(original),
    id: createId("plan"),
    createdAt: new Date().toISOString(),
    customization: {
      mode: "coach-restored",
      updatedAt: new Date().toISOString(),
      label: `恢复 AI 计划 · ${formatDate(new Date())}`,
      originalCoachPlan: cloneData(original),
      previousPlans: [previousPlan, ...getPlanHistory(user.plan)].filter(Boolean).slice(0, 5),
      review: {
        level: "ok",
        summary: "已恢复到 AI 原始计划。建议先按这个版本完成 1-2 次训练，再根据记录微调。",
        warnings: [],
        suggestions: ["如果你要继续自定义，可以再次进入编辑计划。"],
        positives: ["原始计划仍然保留了基础评估里的目标、频次和单次时长。"]
      }
    }
  };

  user.plan = restoredPlan;
  user.drafts = { ...(user.drafts || {}), training: {}, planEditor: null, showPreviousPlan: false };

  if (useCloudMode()) {
    try {
      setSyncState("syncing", "正在恢复 AI 计划...");
      await persistCloudPlan(user);
      setSyncState("synced", "AI 计划已恢复到云端。");
    } catch (error) {
      notice = getFriendlyCloudError(error);
      setSyncState("error", "恢复计划失败。");
      render();
      return;
    }
  }

  saveStore();
  notice = "已恢复 AI 原始计划。";
  activeView = "plan";
  render();
}

async function restorePreviousPlan() {
  const user = getUser();
  if (!user?.plan) return;
  const previous = getPreviousPlan(user.plan);
  if (!previous) {
    notice = "还没有上一版计划。";
    render({ keepScroll: true });
    return;
  }
  if (useCloudMode() && !ensureCloudCanWrite()) return;

  const currentSnapshot = createPlanHistorySnapshot(user.plan);
  const remainingHistory = getPlanHistory(user.plan).slice(1);
  const originalCoachPlan = getOriginalCoachPlan(user.plan) || getOriginalCoachPlan(previous);
  const customization = {
    mode: "previous-restored",
    updatedAt: new Date().toISOString(),
    label: `恢复上一版 · ${formatDate(new Date())}`,
    previousPlans: [currentSnapshot, ...remainingHistory].filter(Boolean).slice(0, 5),
    review: {
      level: "ok",
      summary: "已恢复到上一版计划。建议先按这个版本完成 1 次训练，再决定是否继续微调。",
      warnings: [],
      suggestions: ["恢复前的当前版本已放入历史，可以继续查看或再次恢复。"],
      positives: ["恢复计划不会删除训练记录和身体记录。"]
    }
  };
  if (originalCoachPlan) customization.originalCoachPlan = cloneData(originalCoachPlan);

  user.plan = {
    ...cloneData(previous),
    id: createId("plan"),
    createdAt: new Date().toISOString(),
    customization
  };
  user.drafts = { ...(user.drafts || {}), training: {}, planEditor: null, showPreviousPlan: false };

  if (useCloudMode()) {
    try {
      setSyncState("syncing", "正在恢复上一版计划...");
      await persistCloudPlan(user);
      setSyncState("synced", "上一版计划已恢复到云端。");
    } catch (error) {
      notice = getFriendlyCloudError(error);
      setSyncState("error", "恢复上一版失败。");
      render();
      return;
    }
  }

  saveStore();
  selectedPlanWeek = getCurrentWeek(user.plan, user.logs || []);
  notice = "已恢复到上一版计划。";
  activeView = "plan";
  render();
}

function reviewCustomPlanDraft(user, draft) {
  const warnings = [];
  const suggestions = [];
  const positives = [];
  const budget = Number(user.assessment?.sessionBudget || draft.duration?.budget || 60);
  const maxFrequency = getAssessmentFrequencyCap(user.assessment);
  const workouts = draft.workouts || [];
  const areaSets = {};
  let totalCardio = 0;
  let totalStrength = 0;

  if (workouts.length > maxFrequency) {
    warnings.push(`你评估里选择的每周上限更接近 ${maxFrequency} 次，现在改成 ${workouts.length} 次，注意恢复。`);
  }

  workouts.forEach((workout, index) => {
    const duration = getWorkoutDuration(workout, 2, user.plan?.weeks);
    const strengthExercises = (workout.exercises || []).filter((exercise) => exercise.type !== "cardio");
    const cardioExercises = (workout.exercises || []).filter((exercise) => exercise.type === "cardio");
    totalCardio += cardioExercises.length;
    totalStrength += strengthExercises.length;

    if (duration.max > budget) {
      warnings.push(`${workout.title || `训练日 ${index + 1}`} 预计 ${duration.label}，可能超过你单次 ${budget} 分钟上限。`);
    }
    if (strengthExercises.length > 6) {
      warnings.push(`${workout.title || `训练日 ${index + 1}`} 力量动作偏多，手机记录和实际训练都容易拖长。`);
    }
    if (!cardioExercises.length || workout.exercises?.[0]?.type !== "cardio") {
      suggestions.push(`${workout.title || `训练日 ${index + 1}`} 建议保留 5-8 分钟热身，尤其是下肢或大重量动作前。`);
    }

    const seen = new Set();
    for (const exercise of workout.exercises || []) {
      const baseId = getBaseExerciseId(exercise);
      if (seen.has(baseId)) {
        suggestions.push(`${workout.title || `训练日 ${index + 1}`} 里重复出现了「${exercise.name}」，确认不是误加。`);
      }
      seen.add(baseId);

      if (exercise.type !== "cardio") {
        const area = getExerciseArea(exercise);
        const sets = Number(exercise.baseSets || 1);
        areaSets[area] = (areaSets[area] || 0) + sets;
      }
    }
  });

  for (const [area, sets] of Object.entries(areaSets)) {
    if (sets >= 18) {
      warnings.push(`${area} 每周约 ${sets} 组，已经接近高容量，新手或恢复一般时容易过量。`);
    }
    if (sets <= 2 && workouts.length >= 3 && ["胸", "背", "腿"].includes(area)) {
      suggestions.push(`${area} 训练量偏少，如果这是重点部位，可以加 1 个动作或 1-2 组。`);
    }
  }

  for (let index = 1; index < workouts.length; index += 1) {
    const previousArea = getWorkoutMainArea(workouts[index - 1]);
    const currentArea = getWorkoutMainArea(workouts[index]);
    if (previousArea && previousArea === currentArea && currentArea !== "心肺") {
      suggestions.push(`连续两个训练日都偏向${currentArea}，中间最好至少休息 1 天或换部位。`);
    }
  }

  if (user.assessment?.targetPreference === "gain" && totalCardio > totalStrength) {
    suggestions.push("你的目标偏增肌，但有氧动作比例偏高，建议有氧主要保留热身或短收尾。");
  }

  if (!warnings.length && !suggestions.length) {
    positives.push("训练频次、单次时长和动作数量看起来都比较稳。");
  }
  if (workouts.length === Number(user.plan?.frequency?.sessionsPerWeek || workouts.length)) {
    positives.push("每周频次和当前计划结构一致，执行成本较低。");
  }

  return {
    level: warnings.length ? "warning" : "ok",
    summary: warnings.length
      ? "可以保存，但建议先处理下面的风险点，或训练时降低重量和组数。"
      : "这个自定义计划整体可以执行，先用训练记录观察 1-2 周。",
    warnings,
    suggestions: [...new Set(suggestions)].slice(0, 5),
    positives: positives.slice(0, 3)
  };
}

function getCustomPlanDuration(workouts, weekRules, assessment) {
  const durations = workouts.map((workout) => getWorkoutDuration(workout, 2, weekRules));
  const min = Math.min(...durations.map((duration) => duration.min));
  const max = Math.max(...durations.map((duration) => duration.max));
  const label = `${Math.round(min / 5) * 5}-${Math.round(max / 5) * 5} 分钟`;
  return {
    label,
    budget: Number(assessment?.sessionBudget || 60),
    split: `自定义计划预计每次 ${label}，已计入热身、组间休息和换器械时间。`
  };
}

function getAssessmentFrequencyCap(assessment = {}) {
  const value = assessment.weeklyLimit;
  if (value === "2") return 2;
  if (value === "3") return 3;
  if (value === "4") return 4;
  return 4;
}

function getPlanHistory(plan) {
  return Array.isArray(plan?.customization?.previousPlans) ? plan.customization.previousPlans : [];
}

function getPreviousPlan(plan) {
  return getPlanHistory(plan)[0] || null;
}

function getOriginalCoachPlan(plan) {
  return plan?.customization?.originalCoachPlan ? cloneData(plan.customization.originalCoachPlan) : null;
}

function canRestoreOriginalPlan(plan) {
  return Boolean(getOriginalCoachPlan(plan) && plan.customization?.mode !== "coach-restored");
}

function createPlanHistorySnapshot(plan) {
  const snapshot = cloneData(plan);
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

function normalizeExerciseInstances(exercises = []) {
  const counts = {};
  return exercises.map((exercise) => {
    const sourceExerciseId = getBaseExerciseId(exercise);
    const count = counts[sourceExerciseId] || 0;
    counts[sourceExerciseId] = count + 1;
    return {
      ...exercise,
      sourceExerciseId,
      loadProfileId: sourceExerciseId,
      id: count ? `${sourceExerciseId}-custom-${count + 1}` : sourceExerciseId
    };
  });
}

function createExerciseFromLibrary(exerciseId) {
  const exercise = PLAN_EXERCISES.find((item) => item.id === exerciseId);
  if (!exercise) return null;
  return {
    ...cloneData(exercise),
    sourceExerciseId: exercise.id
  };
}

function getBaseExerciseId(exercise) {
  if (!exercise) return "";
  if (PLAN_EXERCISES.some((item) => item.id === exercise.sourceExerciseId)) return exercise.sourceExerciseId;
  if (PLAN_EXERCISES.some((item) => item.id === exercise.id)) return exercise.id;
  const match = PLAN_EXERCISES.find((item) => item.name === exercise.name && item.equipmentId === exercise.equipmentId);
  return match?.id || exercise.id || "";
}

function getExerciseArea(exercise) {
  const text = `${exercise.name || ""} ${(EQUIPMENT_BY_ID[exercise.equipmentId]?.muscles || []).join(" ")}`;
  if (/胸|推胸/.test(text)) return "胸";
  if (/背|下拉|划船|引体/.test(text)) return "背";
  if (/腿|蹬腿|深蹲|股四头/.test(text)) return "腿";
  if (/臀|髋/.test(text)) return "臀";
  if (/肩|后肩|推举/.test(text)) return "肩";
  if (/二头|三头|手臂/.test(text)) return "手臂";
  if (/核心|卷腹|农夫走/.test(text)) return "核心";
  return "全身";
}

function getWorkoutMainArea(workout) {
  const counts = {};
  for (const exercise of workout.exercises || []) {
    const area = exercise.type === "cardio" ? "心肺" : getExerciseArea(exercise);
    counts[area] = (counts[area] || 0) + Number(exercise.baseSets || 1);
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function trimSentence(value) {
  return String(value || "").trim().replace(/[。；;，,.\s]+$/, "");
}

function readFormDraft(form) {
  const draft = {};
  for (const field of form.elements) {
    if (!field.name || field.disabled) continue;

    if (field.type === "radio") {
      if (field.checked) draft[field.name] = field.value;
      continue;
    }

    if (field.type === "checkbox") {
      draft[field.name] = field.checked;
      continue;
    }

    draft[field.name] = field.value;
  }
  return draft;
}

function setupPwaEvents() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPromptEvent = event;
    if (!installPromptDismissed && appReady) render({ keepScroll: true });
  });

  window.addEventListener("appinstalled", () => {
    installPromptEvent = null;
    installPromptDismissed = true;
    localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
    render({ keepScroll: true });
  });

  window.addEventListener("online", async () => {
    networkOnline = true;
    if (useCloudMode() && getUser()) {
      try {
        setSyncState("syncing", "正在恢复云端同步...");
        await refreshCloudUser();
        setSyncState("synced", "云端数据已同步。");
      } catch {
        setSyncState("error", "恢复同步失败，请稍后重试。");
      }
    } else {
      syncState = createInitialSyncState();
    }
    render({ keepScroll: true });
  });

  window.addEventListener("offline", () => {
    networkOnline = false;
    setSyncState("offline", "离线，可查看已加载数据。");
    render({ keepScroll: true });
  });
}

async function promptInstallApp() {
  if (!installPromptEvent) {
    notice = "当前浏览器没有提供一键安装按钮，可以用浏览器菜单添加到主屏幕。";
    render({ keepScroll: true });
    return;
  }

  installPromptEvent.prompt();
  await installPromptEvent.userChoice;
  installPromptEvent = null;
  installPromptDismissed = true;
  localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
  render({ keepScroll: true });
}

function shouldShowInstallPrompt(user) {
  return Boolean(user && installPromptEvent && !installPromptDismissed && !isStandaloneApp());
}

function isStandaloneApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function getTrainingDraft(user, workout, week) {
  if (!user || !workout) return {};
  const key = getTrainingDraftKey(user, workout, week);
  return user.drafts?.training?.[key] || {};
}

function persistTrainingDraft(user, workout, week, draft) {
  if (!user || !workout) return;
  user.drafts = user.drafts || {};
  user.drafts.training = user.drafts.training || {};
  user.drafts.training[getTrainingDraftKey(user, workout, week)] = draft;

  if (useCloudMode()) {
    store.cloudDrafts = {
      ...(store.cloudDrafts || {}),
      [user.id]: user.drafts
    };
  }

  saveStore();
}

function clearTrainingDraft(user, workout, week) {
  if (!user?.drafts?.training || !workout) return;
  delete user.drafts.training[getTrainingDraftKey(user, workout, week)];
}

function getTrainingDraftKey(user, workout, week) {
  return `${user.plan?.id || "plan"}:${week}:${workout.id}`;
}

function getActiveTrainingIndex(workout, draft = {}) {
  const exercises = workout?.exercises || [];
  if (!exercises.length) return 0;
  const storedIndex = Number(draft.activeExerciseIndex);
  if (Number.isFinite(storedIndex) && storedIndex >= 0 && storedIndex < exercises.length) {
    return Math.floor(storedIndex);
  }
  const firstOpenIndex = exercises.findIndex((exercise) => !isDraftDone(draft, exercise.id));
  return firstOpenIndex >= 0 ? firstOpenIndex : exercises.length - 1;
}

function getNextTrainingIndex(exercises, currentIndex) {
  const nextIndex = Math.min(exercises.length - 1, Math.max(0, currentIndex) + 1);
  return Number.isFinite(nextIndex) ? nextIndex : 0;
}

function isDraftDone(draft = {}, exerciseId) {
  return [true, "true", "on", "1"].includes(draft[`done-${exerciseId}`]);
}

function getDraftCompletedCount(workout, draft = {}) {
  return (workout?.exercises || []).filter((exercise) => isDraftDone(draft, exercise.id)).length;
}

function getDraftSetCount(draft = {}, exercise, targetSetCount = 1) {
  if (isDraftDone(draft, exercise.id)) return targetSetCount;
  const value = Number(draft[`setsDone-${exercise.id}`] || 0);
  return Number.isFinite(value) ? Math.max(0, Math.min(targetSetCount, value)) : 0;
}

function getTargetSetCount(exercise, week, weekRules) {
  if (exercise.type === "cardio") return 1;
  const target = getPrescription(exercise, week, weekRules);
  const parsed = Number(String(target.sets || "").match(/\d+/)?.[0] || exercise.baseSets || 1);
  return Math.max(1, Math.min(6, parsed));
}

function parseRestSeconds(value) {
  if (String(value || "").includes("无")) return 0;
  const seconds = Number(String(value || "").match(/\d+/)?.[0] || 60);
  return Math.max(0, seconds);
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

function getTargetMinuteFallback(exercise) {
  const value = String(exercise?.target || exercise?.reps || "");
  return Number(value.match(/\d+/)?.[0] || 0);
}

function scheduleRestTimerTick(user) {
  if (restTimerTimeout) {
    clearTimeout(restTimerTimeout);
    restTimerTimeout = null;
  }
  if (activeView !== "log" || !user?.plan || user.plan.safetyHold) return;
  const timerNodes = Array.from(app.querySelectorAll("[data-rest-until]"));
  if (!timerNodes.length) return;
  let hasRunningTimer = false;
  for (const node of timerNodes) {
    const remaining = getRestRemainingSeconds(node.dataset.restUntil);
    node.textContent = formatSeconds(remaining);
    if (remaining > 0) hasRunningTimer = true;
  }
  if (hasRunningTimer) {
    restTimerTimeout = setTimeout(() => scheduleRestTimerTick(user), 1000);
  }
}

function getFocusText(plan) {
  return (plan.focusAreas || []).map((item) => item?.label).filter(Boolean).join("、");
}

function getProfileInsights(user) {
  const logs = sortRecords(user.logs || []);
  const bodyLogs = sortRecords(user.bodyLogs || []);
  const latestLog = getLatest(logs);
  const weekTarget = Number(user.plan?.frequency?.sessionsPerWeek || 0);
  const now = new Date();
  const weekStart = getStartOfLocalWeek(now);
  const thisWeekLogs = logs.filter((log) => {
    const createdAt = new Date(log.createdAt);
    return createdAt >= weekStart && createdAt <= now;
  });
  const thisWeekCount = thisWeekLogs.length;
  const thisWeekCompleted = thisWeekLogs.reduce((sum, log) => sum + Number(log.completedCount || 0), 0);
  const weekCompletionRate = weekTarget ? Math.min(100, Math.round((thisWeekCount / weekTarget) * 100)) : 0;
  const weeklyBuckets = getRecentWeekBuckets(logs, weekTarget, now);
  const intensity = getIntensityInsights(logs);
  const bodyTrend = getBodyTrend(bodyLogs);
  const records = getProfileRecords(logs, bodyLogs, weeklyBuckets, now);
  const weekTitle = weekTarget
    ? `本周完成 ${thisWeekCount}/${weekTarget} 次`
    : `本周已记录 ${thisWeekCount} 次`;

  return {
    latestLog,
    weekTarget,
    weekTitle,
    thisWeekCount,
    thisWeekCompleted,
    weekCompletionRate,
    weeklyBuckets,
    intensity,
    bodyTrend,
    records,
    coachMessage: getProfileCoachMessage({ logs, weekTarget, thisWeekCount, intensity, bodyTrend })
  };
}

function getFriendSummary(user) {
  const logs = sortRecords(user?.logs || []);
  const insights = getProfileInsights({ ...(user || {}), logs });
  const latestLog = insights.latestLog;
  return {
    currentWeekCount: insights.thisWeekCount,
    currentWeekCompleted: insights.thisWeekCompleted,
    currentWeekCompletionRate: insights.weekCompletionRate,
    streakWeeks: getCurrentTrainingWeekStreak(logs),
    latestTrainingAt: latestLog?.createdAt || null
  };
}

function getProfileCoachMessage({ logs, weekTarget, thisWeekCount, intensity, bodyTrend }) {
  if (!logs.length) {
    return "先完成 1-2 次训练记录，之后这里会给你判断训练频次、强度和身体变化。";
  }

  if (intensity.tooHard >= 2) {
    return "近几次训练有偏强信号，下一次先保持重量或少做 1 组，优先保证动作稳定。";
  }

  if (intensity.tooEasy >= 2) {
    return "近几次反馈偏轻松，如果动作稳定，可以在计划页重新调整，或下次小幅加重量。";
  }

  if (weekTarget && thisWeekCount < weekTarget) {
    return `本周还差 ${weekTarget - thisWeekCount} 次训练，优先完成计划频次，不急着额外加量。`;
  }

  if (bodyTrend.latest && bodyTrend.previous && Math.abs(bodyTrend.latest.weight - bodyTrend.previous.weight) >= 1.5) {
    return "最近体重波动较大，先连续记录几天，训练计划不要只根据单次体重调整。";
  }

  return "当前节奏比较稳定，继续按计划记录训练和身体状态，下一轮调整会更准确。";
}

function getRecentWeekBuckets(logs, weekTarget, now = new Date()) {
  const currentStart = getStartOfLocalWeek(now);
  const labels = ["3周前", "2周前", "上周", "本周"];

  return labels.map((label, index) => {
    const start = new Date(currentStart);
    start.setDate(currentStart.getDate() - (3 - index) * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const weekLogs = logs.filter((log) => {
      const createdAt = new Date(log.createdAt);
      return createdAt >= start && createdAt < end;
    });
    const completed = weekLogs.reduce((sum, log) => sum + Number(log.completedCount || 0), 0);

    return {
      label,
      count: weekLogs.length,
      completed,
      rate: weekTarget ? Math.min(100, Math.round((weekLogs.length / weekTarget) * 100)) : 0
    };
  });
}

function getIntensityInsights(logs) {
  const recent = logs.slice(-6);
  const feelings = recent
    .flatMap((log) => log.exercises || [])
    .filter((exercise) => exercise.done && Number.isFinite(Number(exercise.feeling)))
    .map((exercise) => Number(exercise.feeling));
  const averageFeeling = feelings.length
    ? feelings.reduce((sum, value) => sum + value, 0) / feelings.length
    : null;

  return {
    recentCount: recent.length,
    tooEasy: recent.filter((log) => log.intensityFeedback === "too-easy").length,
    right: recent.filter((log) => !log.intensityFeedback || log.intensityFeedback === "right").length,
    tooHard: recent.filter((log) => log.intensityFeedback === "too-hard").length,
    feelingLabel: getAverageFeelingLabel(averageFeeling),
    latestFeedbackLabel: getIntensityLabel(getLatest(recent)?.intensityFeedback)
  };
}

function getBodyTrend(bodyLogs) {
  const latest = getLatest(bodyLogs);
  const previous = bodyLogs.length > 1 ? bodyLogs[bodyLogs.length - 2] : null;

  return {
    latest,
    previous,
    weightDelta: getBodyDeltaText(latest, previous, "weight", "kg"),
    bodyFatDelta: getBodyDeltaText(latest, previous, "bodyFat", "%")
  };
}

function getProfileRecords(logs, bodyLogs, weeklyBuckets, now = new Date()) {
  const latestBody = getLatest(bodyLogs);
  const bestWeek = getBestWeeklyLogCount(logs);
  const totalCompleted = logs.reduce((sum, log) => sum + Number(log.completedCount || 0), 0);
  const bestWorkout = Math.max(0, ...logs.map((log) => Number(log.completedCount || 0)));
  const streakWeeks = getCurrentTrainingWeekStreak(logs, now);

  return [
    {
      label: "累计训练",
      value: `${logs.length} 次`,
      note: `${totalCompleted} 个动作被记录`
    },
    {
      label: "最佳训练周",
      value: `${bestWeek || weeklyBuckets.at(-1)?.count || 0} 次`,
      note: "按自然周统计"
    },
    {
      label: "连续训练周",
      value: `${streakWeeks} 周`,
      note: "本周有记录才会延续"
    },
    {
      label: "单次完成最多",
      value: `${bestWorkout} 动作`,
      note: "只作为执行稳定性参考"
    },
    {
      label: "最近体重",
      value: latestBody ? `${formatMetric(latestBody.weight)}kg` : "未记录",
      note: latestBody ? formatDate(latestBody.createdAt) : "去记录页保存体重"
    },
    {
      label: "最近体脂",
      value: latestBody?.bodyFat ? `${formatMetric(latestBody.bodyFat)}%` : "未记录",
      note: "可选记录，不按 0 处理"
    }
  ];
}

function getBestWeeklyLogCount(logs) {
  const counts = new Map();
  for (const log of logs) {
    const key = getWeekKey(log.createdAt);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Math.max(0, ...counts.values());
}

function getCurrentTrainingWeekStreak(logs, now = new Date()) {
  const weekKeys = new Set(logs.map((log) => getWeekKey(log.createdAt)));
  let streak = 0;
  const cursor = getStartOfLocalWeek(now);

  while (weekKeys.has(getWeekKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }

  return streak;
}

function getStartOfLocalWeek(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  return date;
}

function getWeekKey(value) {
  const start = getStartOfLocalWeek(value);
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
}

function sortRecords(records = []) {
  return [...records].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function getAverageFeelingLabel(value) {
  if (!Number.isFinite(value)) return "暂无";
  if (value <= 2.3) return "偏轻松";
  if (value <= 3.6) return "刚好";
  if (value <= 4.8) return "有点累";
  return "偏吃力";
}

function getBodyDeltaText(latest, previous, key, unit) {
  const latestValue = Number(latest?.[key]);
  const previousValue = Number(previous?.[key]);
  if (!Number.isFinite(latestValue)) return "未记录";
  if (!Number.isFinite(previousValue)) return "暂无上次对比";

  const delta = latestValue - previousValue;
  if (Math.abs(delta) < 0.05) return "较上次基本不变";
  return `较上次 ${delta > 0 ? "+" : ""}${formatMetric(delta)}${unit}`;
}

function formatMetric(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return Number.isInteger(number) ? String(number) : number.toFixed(1).replace(/\.0$/, "");
}

function getDefaultNickname(email) {
  return (String(email || "").split("@")[0] || "训练伙伴").slice(0, 12);
}

function getIntensityLabel(value) {
  const labels = {
    "too-easy": "太弱",
    right: "刚好",
    "too-hard": "太强"
  };
  return labels[value] || labels.right;
}

function getVolumeTierLabel(value) {
  const labels = {
    compressed: "压缩训练量",
    base: "基础训练量",
    "moderate-hypertrophy": "中等增肌容量",
    hypertrophy: "增肌容量"
  };
  return labels[value] || "基础训练量";
}

function formatWeeklySetAnchor(anchor) {
  if (!anchor) return "未计算";
  return `每肌群 ${anchor.min}-${anchor.max} 组/周`;
}

function groupEquipmentByCategory(items) {
  const groups = [];
  const indexByCategory = new Map();
  for (const item of items) {
    if (!indexByCategory.has(item.category)) {
      indexByCategory.set(item.category, groups.length);
      groups.push([item.category, []]);
    }
    groups[indexByCategory.get(item.category)][1].push(item);
  }
  return groups;
}

function getInitialView(params) {
  const view = params.get("view");
  return [
    "home",
    "plan",
    "log",
    "exercise-detail",
    "equipment",
    "profile",
    "profile-weekly",
    "profile-friends",
    "profile-releases",
    "profile-settings"
  ].includes(view) ? view : "home";
}

function getInitialWeek(params) {
  const week = Number(params.get("week"));
  return week >= 1 && week <= 4 ? week : null;
}

function applyDemoSeed(params) {
  if (params.get("demo") !== "focus") return;

  const existingDemoUser = store.users.find((user) => user.id === "demo_focus_user");
  const explicitSessionBudget = getDemoSessionBudget(params);

  if (existingDemoUser && !explicitSessionBudget && params.get("resetDemo") !== "1") {
    if (existingDemoUser.assessment && existingDemoUser.plan?.version !== COACH_SPEC_VERSION) {
      existingDemoUser.plan = generateCoachPlan(existingDemoUser.assessment, existingDemoUser.logs || []);
    }
    store.sessionUserId = existingDemoUser.id;
    saveStore();
    return;
  }

  const assessment = {
    gender: "male",
    age: 31,
    height: 170,
    weight: 65,
    bodyFat: 14,
    trainingExperience: "familiar",
    targetPreference: "gain",
    weeklyLimit: "coach",
    sessionBudget: explicitSessionBudget || existingDemoUser?.assessment?.sessionBudget || 60,
    focusAreas: ["chest", "back"],
    injury: "none"
  };
  const demoUser = {
    id: "demo_focus_user",
    email: "demo@healthy-pro.local",
    passwordHash: "demo",
    createdAt: new Date().toISOString(),
    assessment,
    plan: generateCoachPlan(assessment, []),
    logs: [],
    bodyLogs: [],
    drafts: {}
  };

  store.users = store.users.filter((user) => user.id !== demoUser.id);
  store.users.push(demoUser);
  store.sessionUserId = demoUser.id;
  saveStore();
}

function migrateStoredPlans() {
  let changed = false;
  for (const user of store.users || []) {
    if (!user.assessment || !user.plan || user.plan.version === COACH_SPEC_VERSION) continue;
    user.plan = generateCoachPlan(user.assessment, user.logs || []);
    changed = true;
  }
  if (changed) saveStore();
}

function getDemoSessionBudget(params) {
  const value = Number(params.get("sessionBudget") || params.get("budget") || 0);
  return [45, 60, 75].includes(value) ? value : null;
}

function getUser() {
  if (useCloudMode()) return store.cloudUser || null;
  return store.users.find((user) => user.id === store.sessionUserId) || null;
}

function loadStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed?.users) {
      return {
        users: [],
        sessionUserId: null,
        cloudUser: null,
        cloudDrafts: {},
        releaseReads: {},
        ...parsed
      };
    }
  } catch {
    return { users: [], sessionUserId: null, cloudUser: null, cloudDrafts: {}, releaseReads: {} };
  }
  return { users: [], sessionUserId: null, cloudUser: null, cloudDrafts: {}, releaseReads: {} };
}

function saveStore() {
  if (store.cloudUser?.id) {
    store.cloudDrafts = {
      ...(store.cloudDrafts || {}),
      [store.cloudUser.id]: store.cloudUser.drafts || {}
    };
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(`healthy-pro:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function getLatest(list = []) {
  return list.length ? list[list.length - 1] : null;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatReleaseDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

function getFriendlyCloudError(error) {
  const message = String(error?.message || error || "云端请求失败。");
  if (message.includes("Invalid login credentials")) return "邮箱或密码不匹配。";
  if (message.includes("Email not confirmed")) return "这个账号还没有完成邮箱确认。若你想免确认登录，可以在账号服务设置里关闭邮箱确认。";
  if (message.includes("User already registered") || message.includes("already registered")) return "这个邮箱已经注册，直接登录就行。";
  if (message.includes("Failed to fetch") || message.includes("NetworkError")) return "网络连接失败，请确认手机能访问云端保存服务。";
  if (message.includes("JWT") || message.includes("token")) return "登录状态已过期，请重新登录。";
  if (
    message.includes("schema cache") ||
    message.includes("friend_profiles") ||
    message.includes("friendships") ||
    message.includes("feedback") ||
    message.includes("app_releases") ||
    message.includes("user_release_reads")
  ) {
    return "云端表结构还没更新。请先在 Supabase SQL Editor 执行最新 docs/supabase-schema.sql。";
  }
  return message;
}

function isNetworkError(error) {
  const message = String(error?.message || error || "");
  return !networkOnline || message.includes("Failed to fetch") || message.includes("NetworkError");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => registration.update())
      .catch(() => {});
  });
}
