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
  VISIBLE_EQUIPMENT_IDS
} from "./coach.js";

const STORAGE_KEY = "healthy-pro-store-v3";
const app = document.querySelector("#app");
const urlParams = new URLSearchParams(window.location.search);

let store = loadStore();
applyDemoSeed(urlParams);
let activeView = getInitialView(urlParams);
let authMode = "login";
let notice = "";
let selectedPlanWeek = getInitialWeek(urlParams);

render();
registerServiceWorker();

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
    store.sessionUserId = null;
    saveStore();
    activeView = "home";
    render();
  }

  if (action === "start-training") {
    activeView = "log";
    render();
  }

  if (action === "reset-assessment") {
    const user = getUser();
    if (!user) return;
    user.assessment = null;
    user.plan = null;
    user.drafts = {};
    saveStore();
    activeView = "home";
    render();
  }

  if (action === "adjust-plan") {
    const user = getUser();
    if (!user?.assessment) return;
    user.plan = generateCoachPlan(user.assessment, user.logs || []);
    user.drafts = { ...(user.drafts || {}), training: {} };
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
    handleAssessment(form);
  }

  if (form.matches("[data-training-form]")) {
    handleTrainingLog(form);
  }

  if (form.matches("[data-body-form]")) {
    handleBodyLog(form);
  }
});

app.addEventListener("input", handleDraftChange);
app.addEventListener("change", handleDraftChange);

async function handleAuth(form) {
  const formData = new FormData(form);
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email.includes("@") || password.length < 6) {
    notice = "请输入有效邮箱，密码至少 6 位。";
    render();
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

function handleAssessment(form) {
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

  if (!assessment.age || !assessment.height || !assessment.weight) {
    notice = "年龄、身高、体重必须填写。";
    render();
    return;
  }

  const user = getUser();
  user.assessment = assessment;
  user.plan = generateCoachPlan(assessment, user.logs || []);
  saveStore();
  notice = "";
  activeView = "home";
  render();
}

function handleTrainingLog(form) {
  const user = getUser();
  if (!user?.plan || user.plan.safetyHold) return;

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
  user.logs.push({
    id: createId("log"),
    createdAt: new Date().toISOString(),
    workoutId: workout.id,
    workoutTitle: workout.title,
    week,
    completedCount,
    exercises,
    intensityFeedback: String(formData.get("intensityFeedback") || "right"),
    note: String(formData.get("note") || "").trim()
  });

  clearTrainingDraft(user, workout, week);

  saveStore();
  notice = "训练已记录。";
  activeView = "home";
  render();
}

function handleBodyLog(form) {
  const user = getUser();
  if (!user) return;
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
  user.bodyLogs.push(record);
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

  saveStore();
}

function render(options = {}) {
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
      <main class="screen">
        ${needsAssessment ? renderAssessment(user) : renderActiveView(user)}
      </main>
      ${needsAssessment ? "" : renderNav()}
    </div>
  `;
  if (!options.keepScroll) resetScroll();
}

function resetScroll() {
  requestAnimationFrame(() => window.scrollTo(0, 0));
}

function renderAuth() {
  return `
    <main class="auth-screen">
      <section class="auth-panel">
        <p class="eyebrow">Healthy Pro</p>
        <h1>你的第一位健身房私教</h1>
        <p class="auth-copy">输入基础信息后，系统会按你的身体数据、训练经验和目标给出训练安排。</p>
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
  const workoutDuration = getWorkoutDuration(workout, week);
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
  const defaultSessionBudget = getDemoSessionBudget(urlParams) || user.assessment?.sessionBudget || 60;
  return `
    <section class="section-block first-run">
      <p class="eyebrow">${email}</p>
      <h2>先做一次基础评估</h2>
      <p class="muted">只填事实和限制，目标、频次、动作和器械由教练判断。</p>
      <form class="stack" data-assessment-form>
        <div class="form-grid two">
          <label>
            年龄
            <input name="age" type="number" min="14" max="80" inputmode="numeric" required />
          </label>
          <label>
            性别
            <select name="gender" required>
              <option value="male">男</option>
              <option value="female">女</option>
              <option value="other">其他</option>
            </select>
          </label>
        </div>
        <div class="form-grid two">
          <label>
            身高 cm
            <input name="height" type="number" min="120" max="230" inputmode="decimal" required />
          </label>
          <label>
            体重 kg
            <input name="weight" type="number" min="30" max="250" step="0.1" inputmode="decimal" required />
          </label>
        </div>
        <label>
          体脂率 %
          <input name="bodyFat" type="number" min="3" max="60" step="0.1" inputmode="decimal" placeholder="不知道可不填" />
        </label>

        <fieldset>
          <legend>你对健身的了解程度</legend>
          <div class="choice-grid">
            ${EXPERIENCE_LEVELS.map((item, index) => radio("trainingExperience", item.id, item.label, index === 0)).join("")}
          </div>
        </fieldset>

        <fieldset>
          <legend>目标偏好</legend>
          <div class="choice-grid">
            ${radio("targetPreference", "auto", "让教练判断", true)}
            ${radio("targetPreference", "fat-loss", "更想减脂")}
            ${radio("targetPreference", "gain", "更想增肌")}
            ${radio("targetPreference", "shape", "更想塑形")}
          </div>
        </fieldset>

        <fieldset>
          <legend>想重点加强哪里</legend>
          <p class="field-help">可不选；最多选 3 个。教练会在全身基础上多加一点对应动作。</p>
          <div class="choice-grid">
            ${FOCUS_AREAS.map((item) => checkbox("focusAreas", item.id, item.label)).join("")}
          </div>
        </fieldset>

        <fieldset>
          <legend>每周时间上限</legend>
          <div class="choice-grid">
            ${radio("weeklyLimit", "coach", "教练安排", true)}
            ${radio("weeklyLimit", "2", "最多 2 次")}
            ${radio("weeklyLimit", "3", "约 3 次")}
            ${radio("weeklyLimit", "4", "4 次以上")}
          </div>
        </fieldset>

        <fieldset>
          <legend>单次可接受时长</legend>
          <div class="choice-grid three">
            ${radio("sessionBudget", "45", "45 分钟", defaultSessionBudget === 45)}
            ${radio("sessionBudget", "60", "60 分钟", defaultSessionBudget === 60)}
            ${radio("sessionBudget", "75", "75 分钟", defaultSessionBudget === 75)}
          </div>
        </fieldset>

        <fieldset>
          <legend>伤病或医生限制</legend>
          <div class="choice-grid">
            ${radio("injury", "none", "无明显伤病", true)}
            ${radio("injury", "knee", "膝盖疼痛")}
            ${radio("injury", "back", "腰背疼痛")}
            ${radio("injury", "shoulder", "肩颈疼痛")}
            ${radio("injury", "heart", "心血管限制")}
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
      <div class="fact-list">
        <div><span>训练结构</span><strong>${plan.frequency.pattern}</strong></div>
        <div><span>训练经验</span><strong>${plan.experience?.label || "未填写"}</strong></div>
        <div><span>重点部位</span><strong>${focusText || "全身均衡"}</strong></div>
        <div><span>单次上限</span><strong>来自评估：${plan.duration.budget || user.assessment?.sessionBudget || 60} 分钟</strong></div>
        <div><span>容量判断</span><strong>${getVolumeTierLabel(plan.trainingProfile?.volumeTier)}</strong></div>
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
  const duration = getWorkoutDuration(workout, week);
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
                  <div class="equipment-visual ${item.imageClass}" role="img" aria-label="${item.name}示意图"></div>
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
        <div><span>数据模式</span><strong>本地 MVP</strong></div>
        <div><span>AI 约束版本</span><strong>${COACH_SPEC_VERSION}</strong></div>
        <div><span>最近训练</span><strong>${latestLog ? formatDate(latestLog.createdAt) : "未记录"}</strong></div>
        <div><span>最近身体记录</span><strong>${latestBody ? formatDate(latestBody.createdAt) : "未记录"}</strong></div>
      </div>
      <button class="secondary-button" type="button" data-action="reset-assessment">重新评估</button>
    </section>
  `;
}

function renderExerciseSummary(exercise, week, user) {
  const equipment = EQUIPMENT_BY_ID[exercise.equipmentId];
  const target = getPrescription(exercise, week);
  const load = getLoadRecommendation(exercise, user?.assessment, user?.logs || [], week);
  const tag = exercise.focusTag ? ` · ${exercise.focusTag}` : "";
  return `
    <article class="exercise-row">
      <div class="thumb ${equipment.imageClass}" aria-hidden="true"></div>
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
  const target = getPrescription(exercise, week);
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
        <div class="thumb ${equipment.imageClass}" aria-hidden="true"></div>
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

function checkbox(name, value, label) {
  return `
    <label class="choice">
      <input type="checkbox" name="${name}" value="${value}" />
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

function getDemoSessionBudget(params) {
  const value = Number(params.get("sessionBudget") || params.get("budget") || 0);
  return [45, 60, 75].includes(value) ? value : null;
}

function getUser() {
  return store.users.find((user) => user.id === store.sessionUserId) || null;
}

function loadStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed?.users) return parsed;
  } catch {
    return { users: [], sessionUserId: null };
  }
  return { users: [], sessionUserId: null };
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
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
