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

function handleDraftChange(event) {
  const form = event.target.closest?.("[data-training-form], [data-body-form]");
  const user = getUser();
  if (!form || !user) return;

  user.drafts = user.drafts || {};

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

  return `
    <section class="section-block">
      <p class="eyebrow">计划逻辑</p>
      <h2>${plan.goal.type}</h2>
      <p class="coach-note">${plan.rationale}</p>
      ${plan.decisionSummary ? `<p class="adjust-explainer">${plan.decisionSummary}</p>` : ""}
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
    </section>

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
  const insights = getProfileInsights(user);

  return `
    <section class="section-block profile-overview">
      <p class="eyebrow">本周状态</p>
      <h2>${insights.weekTitle}</h2>
      <div class="profile-progress" aria-label="本周训练完成率">
        <div class="progress-track">
          <span class="progress-fill" style="width: ${escapeAttr(insights.weekCompletionRate)}%"></span>
        </div>
        <strong>${insights.weekCompletionRate}%</strong>
      </div>
      <div class="metric-grid">
        <div><span>本周训练</span><strong>${insights.thisWeekCount}/${insights.weekTarget || "-"}</strong></div>
        <div><span>完成动作</span><strong>${insights.thisWeekCompleted}</strong></div>
        <div><span>最近感觉</span><strong>${insights.intensity.feelingLabel}</strong></div>
      </div>
      <p class="coach-note">${insights.coachMessage}</p>
    </section>

    <section class="section-block">
      <div class="section-head">
        <div>
          <p class="eyebrow">趋势分析</p>
          <h2>最近 4 周</h2>
        </div>
        <span class="pill">训练 + 身体</span>
      </div>
      ${renderWeeklyTrainingTrend(insights)}
      ${renderBodyTrend(insights.bodyTrend)}
      ${renderIntensityTrend(insights.intensity)}
    </section>

    <section class="section-block">
      <p class="eyebrow">个人记录</p>
      <h2>我的训练档案</h2>
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

    ${renderLeaderboardPreview()}

    <section class="section-block">
      <p class="eyebrow">账号与设置</p>
      <h2 class="account-email">${escapeHtml(user.email)}</h2>
      <div class="fact-list">
        <div><span>数据模式</span><strong>${useCloudMode() ? "云端 Supabase" : "本地浏览器"}</strong></div>
        <div><span>最近训练</span><strong>${insights.latestLog ? formatDate(insights.latestLog.createdAt) : "未记录"}</strong></div>
        <div><span>最近身体记录</span><strong>${insights.bodyTrend.latest ? formatDate(insights.bodyTrend.latest.createdAt) : "未记录"}</strong></div>
      </div>
      <button class="secondary-button" type="button" data-action="reset-assessment">重新评估</button>
    </section>
  `;
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

function renderLeaderboardPreview() {
  const rows = [
    ["本周完成率", "按计划完成，不鼓励盲目加量"],
    ["连续记录", "比稳定性，不比极限重量"],
    ["训练守约", "只展示自己同意公开的数据"]
  ];

  return `
    <section class="section-block">
      <div class="section-head">
        <div>
          <p class="eyebrow">好友排行</p>
          <h2>预留入口</h2>
        </div>
        <span class="pill muted-pill">未开放</span>
      </div>
      <div class="leaderboard-preview">
        ${rows.map(([title, desc], index) => `
          <div class="leaderboard-row">
            <span>${index + 1}</span>
            <div>
              <strong>${title}</strong>
              <p>${desc}</p>
            </div>
          </div>
        `).join("")}
      </div>
      <p class="empty-note">好友功能上线前，会先确认昵称、隐私范围和排行口径。</p>
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
        <button class="${activeView === view ? "active" : ""}" type="button" data-action="nav" data-view="${view}">
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
