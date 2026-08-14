# Project Context

## 2026-08-14 controlled A/B production release

- GitHub `main` and the task branch are aligned at `b502134edd51054769e29b9eb7c27a245c4baf76`.
- Healthy Web is live at `https://rocky4ai.com/apps/healthy/` through `rockyFormalWeb` immutable v17 (`v17=100%`, `$LATEST=0`); v16 is the immediate rollback point.
- `HEALTHY_WEB_ENABLED`, `HEALTHY_WEB_BINDING_READ_ENABLED`, and `HEALTHY_ROCKY_BINDING_ENABLED` are enabled only for the existing controlled A/B identity/grant cohort. Public registration and health-data writes remain out of scope.
- `rockyBinding` is Active/Available and rejects requests without genuine Healthy WeChat context. No real binding or Healthy business-data read/write was created during release.
- The official WeChat Developer Tools CLI uploaded development build `0.5.9`; it is not an experience version, not submitted for review, and not formally published.
- LifeMap production now links the `train` landmark to `/apps/healthy/`; the separate Healthy WeChat entry remains unchanged.
- Canonical evidence: `/Users/bytedance/Documents/Codex/release-audits/healthy-lifemap-final-cutover-20260814.json`.
- Remaining acceptance gate: one genuine WeChat-to-Rocky binding followed by scoped isolation, replay and revocation verification. This does not require multiple human testers.

## One-Liner

Healthy Pro is a gym training assistant with a WeChat Mini Program for assessment and workout execution plus a Rocky LifeMap Web companion for read-only plan and progress review, both using the same CloudBase training record.

## User And Problem

- Target user: The user first; later a small number of friends who need practical gym training guidance.
- Real problem: Turn scattered fitness goals, body data, available time, and gym equipment into a clear plan and repeatable training log.
- Current workaround: Manual planning, notes, generic templates, or asking an AI without persistent workout context.
- Success signal: The user can open the app on a phone, generate a sensible 4-week plan, complete today's workout, log feedback, and use those records to adjust future training.

## Product Shape

- Core flow: Open app -> assess body and constraints -> generate plan -> view today's workout -> log sets/cardio/feeling -> review body/training records -> adjust plan based on feedback.
- Must-have: Basic assessment, plan generation, today's workout, workout/body logs, equipment library, openid-scoped CloudBase sync, and a read-only Rocky Web view of the same plan and history.
- Explicit non-goals: Medical diagnosis, injury treatment, guaranteed body transformation claims, full social ranking, payment/commercial coaching, or AI-generated plans without human-readable safety boundaries.
- Important states: Mini Program cloud connecting/synced/error states, openid-scoped local storage, Rocky unauthenticated/unauthorized/unbound states, missing Healthy data, and fail-closed Web API errors.

## Current Status

- Stage: The WeChat Mini Program remains the validated training product. A new Healthy Web companion is locally complete under `/apps/healthy/` for plan/history review, has passed automated, 320 px browser and Design Director checks, and is not deployed yet.
- Working version: Mini Program supports assessment, plan generation/edit/history/recovery, one-off workout override, training/body logs, equipment, friends, feedback, announcements, openid-scoped local storage and CloudBase sync. Healthy Web locally supports Rocky identity gates, secure one-time binding UI/runtime candidates, a read-only CloudBase BFF candidate, overview, plan, history and data/privacy views, plus a real `/apps/lifemap/` return route.
- Local state: `npm run dev` builds and serves `http://127.0.0.1:5173/apps/healthy/`; append `?fixture=1` for data UI or `?fixture=unbound` for the cross-device binding handoff.
- GitHub state: task branch `codex/weapp-next-workout-override` is based at `7232cd9`; Healthy Web companion changes are local and uncommitted.
- Deployment state: No Healthy Web static path or BFF is deployed. The Mini Program release state is independent and unchanged by this Web work.
- Legacy state: Supabase and Vercel resources remain frozen for history only. They are excluded from the official Web build and receive no new writes, migrations, deployments or feature-alignment work.
- User validation evidence: The user confirmed on 2026-07-13 that changing an exercise's set count from 1 to 5 in the plan editor persists as 5 after reopening. On 2026-07-17, the user confirmed that the v0.5.7 experience-version validation, including the one-off workout override flow, was complete. The controlled known-friend trial can continue; this is not evidence of formal public release approval.

## Architecture

- Client/platform: Native WeChat Mini Program in `healthy-pro-weapp/` plus a static responsive Web companion in `src/web/`.
- Backend/data: CloudBase is the only active business-data backend. The Mini Program writes its existing openid-owned store; the Web BFF reads that same store after server-side identity and binding checks.
- Auth/identity: Mini Program obtains OpenID from a CloudBase `login` function. Web uses the Rocky same-origin session and a server-owned one-to-one Rocky-to-WeChat binding; the browser never supplies identity ownership fields.
- Storage: Mini Program retains openid-scoped local recovery plus CloudBase collections. Web keeps no health payload in local storage and its service worker excludes API responses.
- External services: Rocky identity, CloudBase, WeChat DevTools, and `app-factory` routing. Supabase and Vercel are frozen historical resources only.
- Key constraints: No browser-side secrets, OpenID, binding codes, health payload caching, medical claims, root-directory deploys, or automatic legacy-data migration.

## Decisions

- Chosen path: Keep the Mini Program as the training execution cockpit and add a read-only Healthy Web plan/review desk inside LifeMap, sharing the Mini Program's CloudBase data.
- Rejected paths: No second Healthy data store, no Supabase synchronization, no client-submitted OpenID, and no full Mini Program clone on the Web.
- Why: A single data source removes synchronization drift; separating gym execution from desktop/mobile review gives each surface a clear job.
- Revisit trigger: Only after real usage proves Web editing or training execution is necessary; any write capability requires a separate authorization and conflict model.
- Thread ownership: code edits, CloudBase changes, release actions, and Git publishing should happen only in the Healthy Pro main project thread. Other threads may do read-only assessment, architecture review, or product planning, then hand execution back here.

## Risks

- Product risk: Plans may feel plausible but not become a repeated training habit unless real workouts validate them.
- Technical risk: Rocky `healthy` grants, `rockyBinding`, the Web BFF route and four server-only binding collections are implemented only as local candidates, not connected in production. All three feature flags must remain disabled until deployment and A/B plus negative tests pass.
- Data/privacy risk: Health and body records need private-by-default handling, CloudBase permission rules, clear ownership, export/backup expectations, and no accidental friend visibility.
- Same-origin risk: `/apps/healthy/` shares the `rocky4ai.com` browser origin with sibling apps. Path routing does not isolate high-sensitivity health data from a sibling-app XSS. Wider activation requires a full-origin security audit with explicit CTO acceptance, or an independent origin/app-specific session boundary; controlled A/B remains the maximum before that gate.
- Release risk: Local fixture, deployed static files, deployed BFF, enabled feature flags, LifeMap navigation, Mini Program experience version and formal releases are separate states and must not be mixed.

## Next Actions

- Now: Local candidate is complete; automated checks, 320 px responsive/browser QA and Design Director review pass with no design blocker.
- Later: Hand `release/healthy-web-app-factory-manifest.json` and `docs/healthy-lifemap-handoff.md` to the CTO-managed release sequence; LifeMap must update `train`, not the separate `healthy` entry. The first real canary must prove Rocky login -> code creation -> Mini Program code consumption -> Web re-read.
- Blocked: Healthy Web production activation is blocked on central `healthy` scopes and the secure one-time Rocky-to-WeChat binding runtime. The Mini Program is not blocked by this work.

## Useful Commands Or Links

- Local run: `npm run dev`
- LAN preview: `npm run dev:lan`
- Test/build: `npm run check`; `npm run build`
- Healthy Web local URL: `http://127.0.0.1:5173/apps/healthy/?fixture=1`
- Healthy Web binding preview: `http://127.0.0.1:5173/apps/healthy/?fixture=unbound`
- Planned production URL: `https://rocky4ai.com/apps/healthy/` (not deployed yet)
- Mini Program path: `/Users/bytedance/healthy-pro/healthy-pro-weapp`

## Rocky4AI 正式入口与发布边界

- Rocky4AI 正式主域已完成备案、HTTPS 证书和 CloudBase 绑定，正式主入口是 `https://rocky4ai.com/`。
- CloudBase 环境 ID 是 `cloud1-d3g79qnvd808824c9`。
- CloudBase 根目录 `/` 的唯一 owner 是 `app-factory`，当前根入口进入 LifeMap；Healthy Pro 等普通 App 绝不能发布到根目录。
- Healthy Pro / Exercise 当前用户可见产品入口仍是微信小程序 `Healthy Pro / AI4RockyHP`。
- Healthy Web 已在本地实现为 `/apps/healthy/` 候选，但尚未部署、注册到 LifeMap 或成为正式入口；上线仍必须通过 CTO / `app-factory` 发布闸门。
- CloudBase 默认域名、测试域名和 `localhost` 仅用于开发、检查或留存证据，不得作为交给用户的正式入口。
- Web 项目内部跳转优先使用同源相对路径 `/apps/<app-name>/`；不得硬编码 CloudBase 测试域名，也不得自行创建 DNS 子域名。
- 域名统一不代表账号、数据库或用户数据已经统一；不得据此自行接入统一身份、共享数据或跨 App 同步。
- DNS、证书、域名绑定和根目录发布由 CTO / `app-factory` 管理，本项目不得自行修改。
- 后续发布必须区分本地工作区、Git 提交、远端 `main`、部署状态和用户可见版本，并验证精确的 `rocky4ai.com` 入口；小程序发布则验证对应的微信体验版或正式版入口。

## CloudBase Resource Ownership

- Updated: 2026-07-01.
- CloudBase environment: `cloud1-d3g79qnvd808824c9`.
- Current role: WeChat Mini Program cloud backend plus the target backend for a read-only Healthy Web companion.
- Static hosting status: `/apps/healthy/` has a local build candidate only; no production static files or route have been deployed there.
- Cloud functions: `login` and `social` belong to Healthy Pro.
- Database collections observed by read-only metadata/count checks: `users` = 2, `plans` = 2, `training_logs` = 12, `feedback` / `feedbacks` / `friendships` = 0 at check time.
- Privacy rule: treat these as private health/body/training records; do not inspect record contents casually.
- Future H5 path, if needed: `/apps/healthy/`; see `Rocky4AI 正式入口与发布边界` for the CTO release gate and root-directory prohibition.
- Source of truth before any CloudBase work: `/Users/bytedance/Documents/Codex/cloudbase-deployment-registry.md`.

## Design Agent Governance

Source of truth: /Users/bytedance/Documents/Codex/app-design-agent-routing-rule.md and /Users/bytedance/Documents/Codex/agent-briefs/design-director-agent.md.

Healthy Pro / Rocky should use the Product Design Director Agent whenever a new user-facing surface, UI change, prototype, redesign, or friend/team-facing release is discussed.

Design Agent intervention check:

```text
设计 Agent 介入判断：
- 是否有用户界面：
- 是否面向真实用户 / 朋友 / 团队：
- 是否需要和其他 App 形成明显差异：
- 是否有强场景气质：
- 是否会影响核心流程或首次体验：
- 是否已有截图/原型/页面可审：
- 介入级别：L0 / L1 / L2 / L3 / L4
- 本次产出：
```

Intervention levels:

- L0: no design agent for pure backend, scripts, data processing, or tiny non-UI fixes.
- L1: design DNA for a new user-facing app or early product idea.
- L2: design audit for an existing UI, screenshot, URL, or runnable demo.
- L3: redesign direction for core pages, onboarding, navigation, or first-use experience.
- L4: portfolio design system when multiple apps need shared components but distinct visual identities.


This project's design DNA:

- Product identity: Personal training assistant for gym planning and workout logging.
- Desired feeling: Professional, calm, precise, coach-like.
- Design direction: Training plan hierarchy, progress visibility, strong metrics, restrained colors, action confidence.
- Avoid: Cute check-in app, generic wellness cards, noisy decoration.
- First design focus: Home and training record flow should feel like a serious training cockpit.

Boundaries:

- The design agent defines design DNA, audits UI/UX fit, and produces design recommendations.
- The main product partner + CTO agent still decides priority, product scope, architecture, release, and whether implementation should start.
- The design agent does not publish, merge, deploy, change databases, or change permissions by default.
