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
  clearCloudSession,
  getActiveCloudSession,
  getCloudConfigStatus,
  isCloudConfigured,
  loadCloudUser,
  saveCloudAssessment,
  saveCloudBodyLog,
  saveCloudPlan,
  saveCloudTrainingLog,
  signInCloud,
  signOutCloud,
  signUpCloud
} from "./cloud.js?v=__HEALTHY_PRO_BUILD_VERSION__";

const STORAGE_KEY = "healthy-pro-store-v3";
const INSTALL_DISMISSED_KEY = "healthy-pro-install-dismissed-v1";
const app = document.querySelector("#app");
const urlParams = new URLSearchParams(window.location.search);
const isDemoMode = urlParams.get("demo") === "focus";

let store = loadStore();
let activeView = getInitialView(urlParams);
let authMode = "login";
let notice = "";
let selectedPlanWeek = getInitialWeek(urlParams);
let appReady = false;
let networkOnline = navigator.onLine;
let installPromptEvent = null;
let installPromptDismissed = localStorage.getItem(INSTALL_DISMISSED_KEY) === "1";
let syncState = createInitialSyncState();

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

  saveStore();
  return cloudUser;
}

async function persistCloudPlan(user) {
  const planRow = await saveCloudPlan(user.assessmentRowId, user.plan);
  user.planRowId = planRow.id;
  return planRow;
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

function handleDraftChange(event) {
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

function render(options = {}) {
  if (!appReady) {
    app.innerHTML = renderLoading();
    return;
  }

  const user = getUser();
  if (!user) {
    app.innerHTML = renderAuth();
    if (!options.keepScroll) resetScroll();
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
        <button class="ghost-button" type="button" data-action="logout">退出</button>
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
  const configStatus = getCloudConfigStatus();
  const dataMode = useCloudMode() ? configStatus.label : "本地模式";
  const statusClass = !networkOnline ? "offline" : syncState.status;
  const statusText = !networkOnline ? "当前离线，可以查看已加载数据；保存需要联网。" : syncState.message;

  items.push(`
    <div class="sync-banner ${statusClass}">
      <strong>${dataMode}</strong>
      <span>${statusText}</span>
    </div>
  `);

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

  return `<div class="status-stack">${items.join("")}</div>`;
}

function renderActiveView(user) {
  if (user.plan?.safetyHold) return renderSafetyHold(user);

  if (activeView === "plan") return renderPlan(user);
  if (activeView === "plan-edit") return renderPlanEditor(user);
  if (activeView === "log") return renderLog(user);
  if (activeView === "equipment") return renderEquipment();
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

  return `
    <section class="coach-hero">
      <div>
        <p class="eyebrow">教练判断</p>
        <h2>${plan.goal.type}</h2>
        <p>${plan.goal.priority}${focusText ? ` 当前重点：${focusText}。` : ""}</p>
      </div>
      <div class="metric-grid">
        <div><span>BMI</span><strong>${plan.metrics.bmi}</strong></div>
        <div><span>频次</span><strong>${plan.frequency.sessionsPerWeek} 次/周</strong></div>
        <div><span>时长</span><strong>${workoutDuration.label}</strong></div>
      </div>
    </section>

    <section class="section-block">
      <div class="section-head">
        <div>
          <p class="eyebrow">今天</p>
          <h2>${workout.title}</h2>
        </div>
        <span class="pill">第 ${week} 周</span>
      </div>
      <p class="muted">${workout.focus}</p>
      <p class="duration-note">本次预计 ${workoutDuration.label}，${workoutDuration.note}</p>
      <div class="exercise-list compact">
        ${workout.exercises.map((exercise) => renderExerciseSummary(exercise, week, user)).join("")}
      </div>
      <button class="primary-button" type="button" data-action="start-training">开始记录本次训练</button>
    </section>

    <section class="section-block">
      <div class="section-head">
        <div>
          <p class="eyebrow">复盘</p>
          <h2>最近状态</h2>
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
    <section class="section-block">
      <p class="eyebrow">计划逻辑</p>
      <h2>${plan.goal.type}</h2>
      <p class="coach-note">${plan.rationale}</p>
      ${plan.decisionSummary && !plan.customization?.review ? `<p class="adjust-explainer">${plan.decisionSummary}</p>` : ""}
      ${renderPlanReview(plan)}
      <div class="fact-list">
        <div><span>训练结构</span><strong>${plan.frequency.pattern}</strong></div>
        <div><span>每周频次</span><strong>${plan.frequency.sessionsPerWeek} 次/周</strong></div>
        <div><span>时间上限</span><strong>${plan.frequency.limitLabel || "教练安排"}</strong></div>
        <div><span>训练经验</span><strong>${plan.experience?.label || "未填写"}</strong></div>
        <div><span>重点部位</span><strong>${focusText || "全身均衡"}</strong></div>
        <div><span>单次上限</span><strong>来自评估：${plan.duration.budget || user.assessment?.sessionBudget || 60} 分钟</strong></div>
        <div><span>容量判断</span><strong>${getVolumeTierLabel(plan.trainingProfile?.volumeTier)}</strong></div>
        <div><span>有效组数</span><strong>${formatWeeklySetAnchor(plan.trainingProfile?.weeklySetAnchor)}</strong></div>
        <div><span>恢复安排</span><strong>${plan.frequency.restDays}</strong></div>
        <div><span>时间分配</span><strong>${plan.duration.split}</strong></div>
      </div>
      <div class="button-row">
        <button class="secondary-button" type="button" data-action="edit-plan">编辑计划</button>
        ${canRestoreOriginalPlan(plan) ? `<button class="small-button" type="button" data-action="restore-original-plan">恢复 AI 计划</button>` : ""}
        ${previousPlan ? `<button class="small-button" type="button" data-action="toggle-previous-plan">${user.drafts?.showPreviousPlan ? "收起上一版" : "查看上一版"}</button>` : ""}
      </div>
    </section>

    ${user.drafts?.showPreviousPlan && previousPlan ? renderPreviousPlan(previousPlan) : ""}

    <section class="section-block">
      <div class="section-head">
        <div>
          <p class="eyebrow">4 周渐进</p>
          <h2>预览第 ${week} 周</h2>
        </div>
        <button class="small-button" type="button" data-action="adjust-plan">重新调整</button>
      </div>
      <p class="adjust-explainer">${plan.adjustmentGuide}</p>
      <div class="week-list">
        ${plan.weeks.map((item) => `
          <button class="week-item ${item.week === week ? "active" : ""}" type="button" data-action="select-week" data-week="${item.week}">
            <span>第 ${item.week} 周${item.week === currentWeek ? " · 当前" : ""}</span>
            <strong>${item.label}</strong>
            <p>${item.load}。${item.rule}</p>
          </button>
        `).join("")}
      </div>
    </section>

    <section class="section-block">
      <p class="eyebrow">动作安排</p>
      <h2>第 ${week} 周训练安排</h2>
      <div class="workout-stack">
        ${plan.workouts.map((workout) => renderWorkoutCard(workout, week, user)).join("")}
      </div>
    </section>
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
  const bodyDraft = user.drafts?.body || {};

  return `
    <section class="section-block">
      <p class="eyebrow">训练记录</p>
      <h2>${workout.title}</h2>
      <p class="muted">${workout.focus}</p>
      <form class="stack" data-training-form>
        <div class="log-list">
          ${workout.exercises.map((exercise) => renderExerciseLog(exercise, week, trainingDraft, user)).join("")}
        </div>
        <fieldset>
          <legend>这次整体强度</legend>
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
        <button class="primary-button" type="submit">保存训练</button>
      </form>
    </section>

    ${renderTrainingHistory(logs)}

    <section class="section-block">
      <p class="eyebrow">身体状态</p>
      <h2>今天的身体数据</h2>
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
    </section>
  `;
}

function renderWorkoutCard(workout, week, user) {
  const duration = getWorkoutDuration(workout, week, user?.plan?.weeks);
  return `
    <article class="workout-card">
      <div class="workout-card-head">
        <div>
          <h3>${workout.title}</h3>
          <p>${workout.focus}</p>
        </div>
        <span class="pill">预计 ${duration.label}</span>
      </div>
      <div class="exercise-list">
        ${workout.exercises.map((exercise) => renderExerciseSummary(exercise, week, user)).join("")}
      </div>
    </article>
  `;
}

function renderTrainingHistory(logs = []) {
  const recentLogs = [...logs].reverse().slice(0, 12);

  return `
    <section class="section-block">
      <div class="section-head">
        <div>
          <p class="eyebrow">历史记录</p>
          <h2>过去的训练</h2>
        </div>
        <span class="pill">${logs.length} 次</span>
      </div>
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
    </section>
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

function renderEquipment() {
  const visibleEquipment = EQUIPMENT.filter((item) => VISIBLE_EQUIPMENT_IDS.includes(item.id));
  const groups = groupEquipmentByCategory(visibleEquipment);
  return `
    <section class="section-block">
      <p class="eyebrow">器械库</p>
      <h2>按健身房分区找设备</h2>
      <p class="muted">先认设备类型，具体型号可能不同；找不到时用同类器械替代。</p>
      <div class="equipment-zones">
        ${groups.map(([category, items]) => `
          <section class="equipment-zone">
            <div class="equipment-group-title">
              <h3>${category}</h3>
              <span>${items.length} 类设备</span>
            </div>
            <div class="equipment-grid">
              ${items.map((item) => `
                <article class="equipment-card">
                  <img class="equipment-visual" src="${escapeAttr(item.imageSrc)}" alt="${escapeAttr(item.name)}示意图" />
                  <div class="equipment-body">
                    <h3>${item.name}</h3>
                    <p>${item.muscles.join(" / ")}</p>
                    <div class="mini-list">
                      <strong>怎么调</strong>
                      ${item.setup.map((text) => `<span>${text}</span>`).join("")}
                    </div>
                    <div class="mini-list warning">
                      <strong>别这样</strong>
                      ${item.mistakes.map((text) => `<span>${text}</span>`).join("")}
                    </div>
                  </div>
                </article>
              `).join("")}
            </div>
          </section>
        `).join("")}
      </div>
    </section>
  `;
}

function renderProfile(user) {
  const latestLog = getLatest(user.logs);
  const latestBody = getLatest(user.bodyLogs);

  return `
    <section class="section-block">
      <p class="eyebrow">账号</p>
      <h2>${user.email}</h2>
      <div class="fact-list">
        <div><span>最近训练</span><strong>${latestLog ? formatDate(latestLog.createdAt) : "未记录"}</strong></div>
        <div><span>最近身体记录</span><strong>${latestBody ? formatDate(latestBody.createdAt) : "未记录"}</strong></div>
      </div>
      <button class="secondary-button" type="button" data-action="reset-assessment">重新评估</button>
    </section>
  `;
}

function renderExerciseSummary(exercise, week, user) {
  const equipment = EQUIPMENT_BY_ID[exercise.equipmentId];
  const target = getPrescription(exercise, week, user?.plan?.weeks);
  const load = getLoadRecommendation(exercise, user?.assessment, user?.logs || [], week);
  const tag = exercise.focusTag ? ` · ${exercise.focusTag}` : "";
  return `
    <article class="exercise-row">
      <img class="thumb" src="${escapeAttr(equipment.imageSrc)}" alt="" aria-hidden="true" />
      <div>
        <strong>${exercise.name}</strong>
        <span>${equipment.name}${tag} · ${target.sets} · ${target.reps}</span>
        ${load ? `<span class="load-help">${load.label}</span>` : ""}
        <span class="effort-help">用力感 ${target.effort}：${target.effortText}</span>
      </div>
    </article>
  `;
}

function renderExerciseLog(exercise, week, draft = {}, user) {
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
    <article class="log-item">
      <div class="log-title">
        <img class="thumb" src="${escapeAttr(equipment.imageSrc)}" alt="" aria-hidden="true" />
        <div>
          <strong>${exercise.name}</strong>
          <span>${target.sets} · ${target.reps} · 休息 ${target.rest}</span>
          ${load ? `<span class="load-help">${load.label}</span>` : ""}
        </div>
        <label class="check-pill">
          <input name="done-${exercise.id}" type="checkbox" ${draft[`done-${exercise.id}`] ? "checked" : ""} />
          完成
        </label>
      </div>
      <p>${exercise.cues.join("；")}</p>
      ${load ? `<p class="load-note">${load.detail}${load.caution ? ` ${load.caution}` : ""}</p>` : ""}
      ${metricFields}
      <fieldset class="feeling-field">
        <legend>这个动作感觉如何</legend>
        ${renderFeelingChoices(`feeling-${exercise.id}`, Number(draft[`feeling-${exercise.id}`] || 3))}
      </fieldset>
    </article>
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
        <button class="${activeView === view || (activeView === "plan-edit" && view === "plan") ? "active" : ""}" type="button" data-action="nav" data-view="${view}">
          ${label}
        </button>
      `).join("")}
    </nav>
  `;
}

function getHeaderTitle(user, needsAssessment) {
  if (needsAssessment) return "基础评估";
  if (user.plan?.safetyHold) return "安全提醒";
  const titles = {
    home: "今日训练",
    plan: "训练计划",
    "plan-edit": "编辑计划",
    log: "训练记录",
    equipment: "器械图示",
    profile: "我的数据"
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

function clearTrainingDraft(user, workout, week) {
  if (!user?.drafts?.training || !workout) return;
  delete user.drafts.training[getTrainingDraftKey(user, workout, week)];
}

function getTrainingDraftKey(user, workout, week) {
  return `${user.plan?.id || "plan"}:${week}:${workout.id}`;
}

function getFocusText(plan) {
  return (plan.focusAreas || []).map((item) => item?.label).filter(Boolean).join("、");
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
  return ["home", "plan", "log", "equipment", "profile"].includes(view) ? view : "home";
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
        ...parsed
      };
    }
  } catch {
    return { users: [], sessionUserId: null, cloudUser: null, cloudDrafts: {} };
  }
  return { users: [], sessionUserId: null, cloudUser: null, cloudDrafts: {} };
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

function getFriendlyCloudError(error) {
  const message = String(error?.message || error || "云端请求失败。");
  if (message.includes("Invalid login credentials")) return "邮箱或密码不匹配。";
  if (message.includes("Email not confirmed")) return "这个账号还没有完成邮箱确认。若你想免确认登录，可以在账号服务设置里关闭邮箱确认。";
  if (message.includes("User already registered") || message.includes("already registered")) return "这个邮箱已经注册，直接登录就行。";
  if (message.includes("Failed to fetch") || message.includes("NetworkError")) return "网络连接失败，请确认手机能访问云端保存服务。";
  if (message.includes("JWT") || message.includes("token")) return "登录状态已过期，请重新登录。";
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
