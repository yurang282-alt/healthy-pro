import { createHealthyFixture } from "./fixture.js?v=__HEALTHY_PRO_BUILD_VERSION__";
import { HealthyApiError, createHealthyApiClient } from "./healthy-api.js?v=__HEALTHY_PRO_BUILD_VERSION__";
import { RockyPlatformError, createRockyPlatformClient } from "./rocky-platform-client.js?v=__HEALTHY_PRO_BUILD_VERSION__";
import { buildHealthyViewModel, getEquipmentImage } from "./view-model.js?v=__HEALTHY_PRO_BUILD_VERSION__";

const APP_BASE = "/apps/healthy/";
const APP_ID = "healthy";
const LIFEMAP_PATH = "/apps/lifemap/";
const NAV_ITEMS = Object.freeze([
  { id: "overview", label: "首页" },
  { id: "plan", label: "计划" },
  { id: "history", label: "记录" },
  { id: "data", label: "我的" }
]);
const appElement = document.querySelector("#app");
const identityClient = createRockyPlatformClient();
const healthyApi = createHealthyApiClient();
let currentModel = null;
let currentMode = "loading";
let activeView = getActiveView();
let bindingState = { status: "idle", code: "", expiresAt: "", message: "" };

window.addEventListener("hashchange", () => {
  activeView = getActiveView();
  render();
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    document.getElementById("main")?.focus({ preventScroll: true });
  });
});

appElement.addEventListener("click", (event) => {
  const retryButton = event.target.closest("[data-action='retry']");
  if (retryButton) bootstrap();
  const bindingButton = event.target.closest("[data-action='create-binding-code']");
  if (bindingButton) createBindingCode();
  const bindingCheckButton = event.target.closest("[data-action='check-binding']");
  if (bindingCheckButton) bootstrap();
  const copyButton = event.target.closest("[data-action='copy-binding-code']");
  if (copyButton) copyBindingCode();
  const scrollButton = event.target.closest("[data-scroll-target]");
  if (scrollButton) {
    const target = document.getElementById(scrollButton.dataset.scrollTarget);
    target?.scrollIntoView({ block: "start" });
  }
});

render();
bootstrap();
registerServiceWorker();

async function bootstrap() {
  currentMode = "loading";
  currentModel = null;
  render();

  if (getLocalFixtureMode() === "data") {
    currentMode = "ready";
    currentModel = buildHealthyViewModel(createHealthyFixture());
    render();
    return;
  }
  if (getLocalFixtureMode() === "unbound") {
    currentMode = "unbound";
    render();
    return;
  }

  try {
    const session = await identityClient.session(APP_ID);
    if (!session.scopes.includes("healthy:data:read")) {
      currentMode = "access-pending";
      render();
      return;
    }
    const payload = await healthyApi.bootstrap();
    currentModel = buildHealthyViewModel(payload);
    currentMode = currentModel.hasPlan ? "ready" : "empty";
  } catch (error) {
    currentMode = getFailureMode(error);
  }
  render();
}

async function createBindingCode() {
  if (bindingState.status === "creating") return;
  bindingState = { status: "creating", code: "", expiresAt: "", message: "" };
  render();
  try {
    if (getLocalFixtureMode() === "unbound") {
      bindingState = {
        status: "ready",
        code: "R7K4M2QP",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        message: "这是本地预览码，不会写入云端。"
      };
    } else {
      const payload = await healthyApi.createBindingCode();
      bindingState = {
        status: "ready",
        code: String(payload?.data?.code || ""),
        expiresAt: String(payload?.data?.expiresAt || ""),
        message: ""
      };
    }
  } catch (error) {
    bindingState = {
      status: "error",
      code: "",
      expiresAt: "",
      message: bindingErrorMessage(error)
    };
  }
  render();
}

async function copyBindingCode() {
  if (!bindingState.code) return;
  try {
    await navigator.clipboard.writeText(bindingState.code);
    bindingState = { ...bindingState, message: "绑定码已复制。" };
  } catch {
    bindingState = { ...bindingState, message: "请长按选择绑定码并复制。" };
  }
  render();
}

function render() {
  if (currentMode === "loading") {
    appElement.innerHTML = renderLoading();
    return;
  }
  if (currentMode !== "ready") {
    appElement.innerHTML = renderGate(currentMode);
    return;
  }
  appElement.innerHTML = renderShell(currentModel);
}

function renderLoading() {
  return `
    <div class="state-shell">
      ${renderProductRoute("state-route")}
      <main class="loading-panel" aria-busy="true" aria-label="正在读取训练数据">
        <span class="loading-line loading-line--short"></span>
        <span class="loading-line loading-line--title"></span>
        <span class="loading-line"></span>
        <span class="loading-line"></span>
      </main>
    </div>
  `;
}

function renderGate(mode) {
  const states = {
    unauthenticated: {
      eyebrow: "Rocky 账号",
      title: "登录后查看训练数据",
      body: "Web 端只读取与你本人绑定的小程序计划和记录，不会创建另一套账号或数据。",
      action: `<a class="primary-button" href="/account/?returnTo=${encodeURIComponent(APP_BASE)}">登录 Rocky 账号</a>`
    },
    "access-pending": {
      eyebrow: "访问准备中",
      title: "Healthy Web 尚未对账号开放",
      body: "当前 Rocky 账号还没有 Healthy 只读权限。小程序数据和训练功能不受影响。",
      action: `<div class="state-action-row"><a class="primary-button" href="/account/">查看账号权限</a><button class="secondary-button" type="button" data-action="retry">重新检查</button></div>`
    },
    unbound: {
      eyebrow: "账号绑定",
      title: "还没有关联微信训练档案",
      body: "Rocky 账号已登录，但尚未与微信小程序中的本人档案完成安全绑定。绑定不会自动迁移或合并其他账号的数据。",
      action: renderBindingAction()
    },
    empty: {
      eyebrow: "训练档案",
      title: "还没有可查看的训练计划",
      body: "请先在 Healthy Pro 微信小程序完成基础评估并生成计划，随后这里会显示同一份数据。",
      action: `<button class="secondary-button" type="button" data-action="retry">重新读取</button>`
    },
    unavailable: {
      eyebrow: "暂时不可用",
      title: "没有读取到训练数据",
      body: "系统没有使用本地旧数据兜底，避免把过期或他人的训练档案显示给你。可以稍后重试。",
      action: `<button class="primary-button" type="button" data-action="retry">重试</button>`
    }
  };
  const state = states[mode] || states.unavailable;
  return `
    <div class="state-shell">
      ${renderProductRoute("state-route")}
      <main class="identity-gate" id="main">
        <p class="eyebrow">${state.eyebrow}</p>
        <h1>${state.title}</h1>
        <p>${state.body}</p>
        <div class="state-actions">${state.action}</div>
        <p class="privacy-note">训练、身体和负重数据默认仅本人可见。</p>
      </main>
    </div>
  `;
}

function renderBindingAction() {
  if (bindingState.status === "ready") {
    return `
      <section class="binding-panel" aria-labelledby="binding-code-title">
        <div>
          <p class="binding-label" id="binding-code-title">5 分钟一次性绑定码</p>
          <output class="binding-code" aria-live="polite">${escapeHtml(bindingState.code)}</output>
          <p class="binding-expiry">${escapeHtml(bindingState.message || `有效至 ${formatTime(bindingState.expiresAt)}`)}</p>
        </div>
        <button class="secondary-button" type="button" data-action="copy-binding-code">复制</button>
      </section>
      <ol class="binding-steps">
        <li>打开 Healthy Pro 微信小程序</li>
        <li>进入“我的 → 设置与反馈 → 关联 Web”</li>
        <li>输入上面的绑定码并确认</li>
      </ol>
      <div class="state-action-row">
        <button class="primary-button" type="button" data-action="check-binding">已确认，重新读取</button>
        <button class="secondary-button" type="button" data-action="create-binding-code">换一个码</button>
      </div>
    `;
  }
  if (bindingState.status === "creating") {
    return `<button class="primary-button" type="button" disabled aria-busy="true">正在生成绑定码…</button>`;
  }
  return `
    <button class="primary-button" type="button" data-action="create-binding-code">生成绑定码</button>
    ${bindingState.message ? `<p class="binding-error" role="alert">${escapeHtml(bindingState.message)}</p>` : ""}
  `;
}

function bindingErrorMessage(error) {
  if (error?.status === 403) return "当前账号尚未获得 Healthy 只读权限。";
  if (error?.status === 503) return "绑定服务尚未开放，请稍后再试。";
  return "绑定码生成失败，请稍后重试。";
}

function renderShell(model) {
  return `
    <div class="app-shell">
      <header class="app-header">
        ${renderProductRoute()}
        <div class="account-state">
          <span class="status-dot" aria-hidden="true"></span>
          <span>${escapeHtml(model.nickname)}</span>
        </div>
      </header>
      <div class="workspace">
        ${renderNavigation("side-nav")}
        <main class="main-content" id="main" tabindex="-1">
          ${renderActiveView(model)}
        </main>
      </div>
      ${renderNavigation("bottom-nav")}
    </div>
  `;
}

function renderProductRoute(className = "") {
  return `
    <div class="product-route ${className}">
      <a class="lifemap-link" href="${LIFEMAP_PATH}" aria-label="返回 LifeMap">
        <span aria-hidden="true">←</span>
        <span>LifeMap</span>
      </a>
      <span class="route-divider" aria-hidden="true">/</span>
      <strong>Healthy Pro</strong>
    </div>
  `;
}

function renderNavigation(className) {
  return `
    <nav class="${className}" aria-label="Healthy Pro 导航">
      ${NAV_ITEMS.map((item) => `
        <a href="#${item.id}" ${activeView === item.id ? "aria-current=\"page\"" : ""}>
          <span>${item.label}</span>
        </a>
      `).join("")}
    </nav>
  `;
}

function renderActiveView(model) {
  if (activeView === "plan") return renderPlan(model);
  if (activeView === "history") return renderHistory(model);
  if (activeView === "data") return renderData(model);
  return renderOverview(model);
}

function renderOverview(model) {
  const workout = model.nextWorkout;
  const readiness = model.weekly.remaining
    ? `本周还差 ${model.weekly.remaining} 次，先按计划完成，不急着额外加量。`
    : "本周计划频次已完成，下一次训练先看恢复状态。";
  return `
    <section class="page-heading">
      <p class="eyebrow">Healthy Pro</p>
      <h1>训练驾驶舱</h1>
    </section>

    <section class="cockpit-panel" aria-labelledby="next-workout-title">
      <div class="cockpit-status-row">
        <div>
          <p class="panel-kicker">下一次训练</p>
          <h2 id="next-workout-title">${escapeHtml(workout?.title || "等待计划")}</h2>
        </div>
        <span class="stage-pill">第 ${model.currentWeek} 周</span>
      </div>
      <p class="cockpit-focus">${escapeHtml(workout?.focus || model.weekRule)}</p>
      <div class="cockpit-metrics" aria-label="训练处方摘要">
        <span><small>预计</small><strong>${escapeHtml(model.duration)}</strong></span>
        <span><small>动作</small><strong>${workout?.exercises.length || 0} 个</strong></span>
        <span><small>进度</small><strong>${model.weekly.completed}/${model.weekly.target}</strong></span>
      </div>
      <div class="readiness-strip"><span>今日建议</span><strong>${escapeHtml(readiness)}</strong></div>
      <a class="cockpit-primary-action" href="#plan">查看本周计划</a>
    </section>

    ${renderWorkoutPreview(workout)}

    <section class="surface-panel week-rhythm" aria-labelledby="week-rhythm-title">
      <div class="section-title-row">
        <div>
          <p class="eyebrow">本周节奏</p>
          <h2 id="week-rhythm-title">完成 ${model.weekly.completed}/${model.weekly.target} 次</h2>
        </div>
        <strong class="progress-number">${model.weekly.percent}%</strong>
      </div>
      <div class="progress-track" aria-label="本周训练完成 ${model.weekly.percent}%">
        <span style="width:${model.weekly.percent}%"></span>
      </div>
      <div class="week-days">
        ${model.weekly.days.map((day) => `
          <span class="week-day ${day.completed ? "is-complete" : ""} ${day.isToday ? "is-today" : ""}">
            <small>${day.label}</small><strong>${day.day}</strong>
          </span>
        `).join("")}
      </div>
      <p class="coach-line">${escapeHtml(model.weekRule || model.goalReason || model.pattern)}</p>
    </section>

    ${renderRecentHistory(model.logs.slice(0, 2), "最近训练", "compact")}
  `;
}

function renderWorkoutPreview(workout) {
  const exercises = workout?.exercises || [];
  const preview = exercises.slice(0, 3);
  const remaining = Math.max(0, exercises.length - preview.length);
  return `
    <section class="surface-panel workout-preview" aria-labelledby="workout-preview-title">
      <div class="section-title-row">
        <div>
          <p class="eyebrow">训练顺序</p>
          <h2 id="workout-preview-title">先看前 ${preview.length} 项</h2>
        </div>
        <span class="plan-chip">${exercises.length} 个动作</span>
      </div>
      <div class="preview-list">
        ${preview.map((exercise, index) => `
          <article class="preview-exercise">
            <span class="preview-index">${String(index + 1).padStart(2, "0")}</span>
            ${renderExerciseImage(exercise)}
            <div>
              <h3>${escapeHtml(exercise.name)}</h3>
              <p>${escapeHtml([exercise.equipmentName, exercise.sets, exercise.reps].filter(Boolean).join(" · "))}</p>
            </div>
          </article>
        `).join("") || `<p class="empty-inline">等待训练动作。</p>`}
      </div>
      ${remaining ? `<p class="panel-footnote">后面还有 ${remaining} 个动作，完整处方在计划页。</p>` : ""}
    </section>
  `;
}

function renderPlan(model) {
  const workout = model.nextWorkout;
  return `
    <section class="page-heading">
      <p class="eyebrow">Healthy Pro</p>
      <h1>计划控制台</h1>
    </section>

    <section class="cockpit-panel plan-console" aria-labelledby="plan-console-title">
      <div class="cockpit-status-row">
        <div>
          <p class="panel-kicker">本周阶段</p>
          <h2 id="plan-console-title">第 ${model.currentWeek} 周 · ${escapeHtml(model.weekLabel)}</h2>
        </div>
        <span class="stage-pill">${escapeHtml(model.goal)}</span>
      </div>
      <p class="cockpit-focus">${escapeHtml(model.weekRule || model.pattern)}</p>
      <div class="next-command"><span>下一次训练</span><strong>${escapeHtml(workout?.title || "等待计划")}</strong></div>
      <div class="cockpit-metrics" aria-label="训练计划摘要">
        <span><small>频次</small><strong>${model.sessionsPerWeek} 次/周</strong></span>
        <span><small>单次时长</small><strong>${escapeHtml(model.duration)}</strong></span>
        <span><small>重点</small><strong>${escapeHtml(workout?.title || model.goal)}</strong></span>
      </div>
      <div class="cockpit-progress"><span style="width:${model.weekly.percent}%"></span></div>
      <button class="cockpit-primary-action" type="button" data-scroll-target="plan-days">查看动作安排</button>
    </section>

    <section class="surface-panel cycle-panel" aria-labelledby="cycle-title">
      <div class="section-title-row">
        <div>
          <p class="eyebrow">周期选择</p>
          <h2 id="cycle-title">4 周训练节奏</h2>
        </div>
        <span class="plan-chip">当前第 ${model.currentWeek} 周</span>
      </div>
      <div class="week-cycle">
        ${model.weeks.map((week) => `
          <span class="week-cycle-item ${week.week === model.currentWeek ? "is-current" : ""}">
            <small>第 ${week.week} 周${week.week === model.currentWeek ? " · 当前" : ""}</small>
            <strong>${escapeHtml(week.label)}</strong>
          </span>
        `).join("")}
      </div>
    </section>

    <section class="surface-panel plan-outline" id="plan-days" aria-labelledby="plan-outline-title">
      <div class="section-title-row">
        <div>
          <p class="eyebrow">动作安排</p>
          <h2 id="plan-outline-title">这一周怎么练</h2>
        </div>
        <span class="plan-chip">${model.workouts.length} 个训练日</span>
      </div>
      <div class="workout-list">
        ${model.workouts.map((item, index) => renderWorkout(item, index, item.id === workout?.id)).join("")}
      </div>
    </section>

    <details class="coach-drawer">
      <summary><span><small>教练说明</small><strong>为什么这样安排</strong></span><em>查看原因</em></summary>
      <div><strong>${escapeHtml(model.pattern)}</strong><p>${escapeHtml(model.goalReason || "按照目标、训练经验与恢复能力安排训练量。")}</p></div>
    </details>
  `;
}

function renderWorkout(workout, index, isNext) {
  return `
    <details class="workout-block ${isNext ? "is-next" : ""}" ${isNext ? "open" : ""}>
      <summary>
        <span class="workout-index">${String(index + 1).padStart(2, "0")}</span>
        <span class="workout-copy"><strong>${escapeHtml(workout.title)}</strong><small>${escapeHtml(workout.focus)}</small></span>
        <em>${isNext ? "下一次" : `${workout.exercises.length} 个动作`}</em>
      </summary>
      <div class="exercise-list">
        ${workout.exercises.map((exercise) => `
          <article class="exercise-row">
            ${renderExerciseImage(exercise)}
            <div>
              <h3>${escapeHtml(exercise.name)}</h3>
              <p>${escapeHtml([exercise.equipmentName, exercise.sets, exercise.reps, exercise.rest ? `休息 ${exercise.rest}` : ""].filter(Boolean).join(" · "))}</p>
              ${exercise.loadLabel ? `<small>${escapeHtml(exercise.loadLabel)}</small>` : ""}
            </div>
          </article>
        `).join("")}
      </div>
    </details>
  `;
}

function renderExerciseImage(exercise) {
  const image = getEquipmentImage(exercise.equipmentId);
  if (!image) {
    return `<span class="equipment-placeholder" role="img" aria-label="器械图片待补">暂无图</span>`;
  }
  return `<img src="${assetUrl(image)}" alt="${escapeHtml(exercise.equipmentName || exercise.name)}" />`;
}

function renderHistory(model) {
  const latest = model.logs[0];
  return `
    <section class="page-heading">
      <p class="eyebrow">Healthy Pro</p>
      <h1>训练复盘台</h1>
    </section>

    <section class="cockpit-panel history-cockpit" aria-labelledby="history-cockpit-title">
      <div class="cockpit-status-row">
        <div>
          <p class="panel-kicker">最近一次训练</p>
          <h2 id="history-cockpit-title">${escapeHtml(latest?.title || "还没有训练记录")}</h2>
        </div>
        <span class="stage-pill">${escapeHtml(latest?.feedback || "待开始")}</span>
      </div>
      <p class="cockpit-focus">${latest ? `${escapeHtml(latest.dateLabel)} · 第 ${latest.week} 周` : "完成一次训练后，这里会显示复盘摘要。"}</p>
      <div class="cockpit-metrics" aria-label="训练记录摘要">
        <span><small>累计训练</small><strong>${model.totalSessions} 次</strong></span>
        <span><small>本周完成</small><strong>${model.weekly.completed} 次</strong></span>
        <span><small>完成动作</small><strong>${latest?.completedCount || 0} 个</strong></span>
      </div>
      <button class="cockpit-primary-action" type="button" data-scroll-target="history-list">查看完整记录</button>
    </section>

    ${renderRecentHistory(model.logs, "全部记录", "full")}
  `;
}

function renderRecentHistory(logs, title, mode = "full") {
  return `
    <section class="surface-panel history-section history-section--${mode}" id="history-list" aria-labelledby="history-title">
      <div class="section-title-row">
        <div>
          <p class="eyebrow">训练时间线</p>
          <h2 id="history-title">${title}</h2>
        </div>
        <span class="plan-chip">${logs.length} 条</span>
      </div>
      <div class="timeline">
        ${logs.length ? logs.map((log, index) => `
          <article class="timeline-item">
            <div class="timeline-rail"><span>${String(index + 1).padStart(2, "0")}</span><i></i></div>
            <div class="timeline-content">
              <time datetime="${escapeHtml(log.createdAt)}">${escapeHtml(log.dateLabel)}</time>
              <div class="timeline-title"><h3>${escapeHtml(log.title)}</h3><span>${escapeHtml(log.feedback)}</span></div>
              <p>完成 ${log.completedCount} 个动作 · 第 ${log.week} 周</p>
              <details class="record-details">
                <summary><span class="details-open-label">查看动作记录</span><span class="details-close-label">收起动作记录</span></summary>
                <ul>
                  ${log.exercises.map((exercise) => `<li><span>${escapeHtml(exercise.name)}</span><strong>${escapeHtml(exercise.summary)}</strong></li>`).join("")}
                </ul>
              </details>
            </div>
          </article>
        `).join("") : `<p class="empty-inline">还没有训练记录。</p>`}
      </div>
    </section>
  `;
}

function renderData(model) {
  const syncedAt = model.source.syncedAt ? formatDateTime(model.source.syncedAt) : "尚未同步";
  return `
    <section class="page-heading">
      <p class="eyebrow">Healthy Pro</p>
      <h1>我的训练档案</h1>
    </section>

    <section class="cockpit-panel data-cockpit" aria-labelledby="data-cockpit-title">
      <div class="cockpit-status-row">
        <div>
          <p class="panel-kicker">数据状态</p>
          <h2 id="data-cockpit-title">同一份训练档案</h2>
        </div>
        <span class="stage-pill">只读</span>
      </div>
      <p class="cockpit-focus">微信小程序负责训练执行，Web 端负责计划查看与复盘。</p>
      <div class="cockpit-metrics" aria-label="数据状态摘要">
        <span><small>来源</small><strong>CloudBase</strong></span>
        <span><small>训练记录</small><strong>${model.totalSessions} 条</strong></span>
        <span><small>访问范围</small><strong>仅本人</strong></span>
      </div>
      <div class="readiness-strip"><span>最近同步</span><strong>${escapeHtml(syncedAt)}</strong></div>
    </section>

    <section class="surface-panel data-panel" aria-labelledby="data-panel-title">
      <div class="section-title-row">
        <div><p class="eyebrow">档案详情</p><h2 id="data-panel-title">当前连接</h2></div>
        <span class="plan-chip">已关联</span>
      </div>
      <div class="data-ledger">
        <div class="ledger-row"><span>数据来源</span><strong>Healthy 小程序 CloudBase</strong></div>
        <div class="ledger-row"><span>最近同步</span><strong>${escapeHtml(syncedAt)}</strong></div>
        <div class="ledger-row"><span>训练记录</span><strong>${model.totalSessions} 条</strong></div>
        <div class="ledger-row"><span>网页权限</span><strong>只读</strong></div>
      </div>
    </section>

    <details class="privacy-drawer">
      <summary><span><small>隐私边界</small><strong>默认只给本人看</strong></span><em>查看说明</em></summary>
      <div><p>浏览器不保存训练档案到本地缓存；服务端从 Rocky 登录会话确认本人身份后，读取已绑定的微信训练档案。</p><p>Web 端不接收浏览器提交的 OpenID 或用户 ID，也不回退读取旧版数据源。</p></div>
    </details>
  `;
}

function getFailureMode(error) {
  if (error instanceof RockyPlatformError) {
    if (error.status === 401) return "unauthenticated";
    if (error.status === 403) return "access-pending";
    return "unavailable";
  }
  if (error instanceof HealthyApiError) {
    if (error.status === 401) return "unauthenticated";
    if (error.status === 428 || error.code === "WECHAT_BINDING_REQUIRED") return "unbound";
    if (error.status === 404 || error.code === "HEALTHY_PROFILE_NOT_FOUND") return "empty";
  }
  return "unavailable";
}

function getActiveView() {
  const requested = window.location.hash.replace(/^#/, "");
  return NAV_ITEMS.some((item) => item.id === requested) ? requested : "overview";
}

function getLocalFixtureMode() {
  const host = window.location.hostname;
  const local = host === "127.0.0.1" || host === "localhost";
  if (!local) return "";
  const fixture = new URLSearchParams(window.location.search).get("fixture");
  if (fixture === "1") return "data";
  if (fixture === "unbound") return "unbound";
  return "";
}

function assetUrl(path) {
  return new URL(`${APP_BASE}${String(path || "").replace(/^\//, "")}`, window.location.origin).href;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "尚未同步";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "5 分钟内";
  return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${APP_BASE}sw.js`, { scope: APP_BASE }).catch(() => {});
  });
}
