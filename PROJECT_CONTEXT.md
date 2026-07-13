# Project Context

## One-Liner

Healthy Pro is a mobile-first gym training assistant for the user and future friend-facing use, currently covering body assessment, coach-style workout planning, workout logging, equipment reference, PWA use, and a WeChat Mini Program MVP with CloudBase/openid sync code.

## User And Problem

- Target user: The user first; later a small number of friends who need practical gym training guidance.
- Real problem: Turn scattered fitness goals, body data, available time, and gym equipment into a clear plan and repeatable training log.
- Current workaround: Manual planning, notes, generic templates, or asking an AI without persistent workout context.
- Success signal: The user can open the app on a phone, generate a sensible 4-week plan, complete today's workout, log feedback, and use those records to adjust future training.

## Product Shape

- Core flow: Open app -> assess body and constraints -> generate plan -> view today's workout -> log sets/cardio/feeling -> review body/training records -> adjust plan based on feedback.
- Must-have: Basic assessment, plan generation, today's workout, workout log, body log, equipment library, local/demo fallback, PWA install state, WeChat Mini Program flow with local fallback and cloud sync.
- Explicit non-goals: Medical diagnosis, injury treatment, guaranteed body transformation claims, full social ranking, payment/commercial coaching, or AI-generated plans without human-readable safety boundaries.
- Important states: Demo mode, local-only mode, Supabase cloud sync when configured, offline/PWA status, WeChat cloud connecting/synced/error states, openid-scoped local storage, missing CloudBase environment, and failed cloud sync with local fallback.

## Current Status

- Stage: PWA is in maintenance mode. The WeChat Mini Program v0.5.5 has been uploaded for a controlled trial with known friends. Its P0 gate is closed; two-user isolation and same-account cloud restore have passed by user report. Formal public release is a separate gate and is not yet claimed.
- Working version: PWA supports assessment, coach plan, today's training, workout/body records, equipment library, Supabase auth/sync when configured, friends, feedback, and update announcements. Mini Program supports home, assessment, plan, log, equipment, profile, openid-scoped local storage, CloudBase user store sync, training log/feedback mirroring, plan editing, plan history, plan recovery, friends, feedback, and local update announcements. Friend lookup/ranking is designed to go through the `social` cloud function so the client does not read other users' full `users` documents.
- Local state: `npm run dev` serves the PWA at `http://127.0.0.1:5173`. `npm run dev:lan` supports same-Wi-Fi phone preview.
- GitHub state: `main` contained the v0.5.4 Mini Program UI simplification at `d1ee763` before this closeout change; use Git as the exact source of truth after subsequent commits.
- Deployment state: Mini Program v0.5.5 was uploaded through WeChat DevTools on 2026-07-13 for AppID `wx9f1d623ecc4ce4ae`; the reported package size was 459.8 KB. It remains an experience/development build, not a formally reviewed public release.
- In-app/release state: The v0.5.5 Mini Program announcement covers the friends-page redesign. PWA announcements remain maintenance-only unless a PWA change is released.
- User validation evidence: The user confirmed on 2026-07-13 that changing an exercise's set count from 1 to 5 in the plan editor persists as 5 after reopening. The underlying fix is commit `0022572`, already contained in current `main` and the uploaded v0.5.5 Mini Program build. CTO subsequently authorized a dedicated v0.5.6 experience-build closeout with a matching in-app announcement; this does not change the fix logic or expand the friend trial.

## Architecture

- Client/platform: Static mobile-first PWA plus native WeChat Mini Program in `healthy-pro-weapp/`.
- Backend/data: PWA uses Supabase when `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are configured; otherwise falls back to local/demo mode. Mini Program uses WeChat CloudBase when available and falls back to local storage when cloud init/login/sync fails.
- Auth/identity: PWA supports email/password through Supabase. Mini Program calls a CloudBase `login` cloud function and binds data to WeChat `openid`. PWA and Mini Program accounts are not linked.
- Storage: PWA local/demo fallback plus optional Supabase persistence. Mini Program uses openid-scoped local storage plus CloudBase collections for user store, plans, training logs, feedback, and friendships.
- External services: Supabase optional; Vercel static deployment optional; WeChat CloudBase configured in code; WeChat DevTools and real-device/experience-version validation still required.
- Key constraints: Do not put service-role keys, WeChat AppSecret, passwords, or verification codes in client code. Fitness guidance must avoid medical claims.

## Decisions

- Chosen path: Treat the WeChat Mini Program as the priority product entry for friend-facing use, while keeping the PWA as a usable validation/maintenance surface and old-data reference.
- Rejected paths: Do not unify PWA/Supabase data with Mini Program/CloudBase data until cross-device continuity is proven to matter. Do not keep adding training features before cloud permissions, recovery, and release verification are closed.
- Why: The Mini Program is the shorter path for WeChat friend distribution and domestic access; the PWA remains useful but should not drive new product surface decisions unless needed.
- Revisit trigger: Before formal Mini Program review/release, PWA account linking, or any migration of user data between Supabase and CloudBase.
- Thread ownership: code edits, CloudBase changes, release actions, and Git publishing should happen only in the Healthy Pro main project thread. Other threads may do read-only assessment, architecture review, or product planning, then hand execution back here.

## Risks

- Product risk: Plans may feel plausible but not become a repeated training habit unless real workouts validate them.
- Technical risk: PWA and Mini Program now have parallel data adapters; shared domain logic and data contracts must stay clear enough to avoid divergent behavior.
- Data/privacy risk: Health and body records need private-by-default handling, CloudBase permission rules, clear ownership, export/backup expectations, and no accidental friend visibility.
- Release risk: Local PWA, Vercel deployment, WeChat DevTools preview, Mini Program real-device preview, and Mini Program experience version are different release states and must not be mixed.

## Next Actions

- Now: Run a short v0.5.4 real-device spot-check and collect issues from the controlled known-friend trial. Core CloudBase collections were confirmed private in the P0 evidence pass; two-user isolation and same-account restore passed by user report.
- Later: Before formal public release, complete the privacy-policy wording, choose a user export/deletion path, and repeat the P0 smoke test on the exact release candidate.
- Blocked: Small known-friend trial is not blocked. Formal public release remains blocked until its policy, data-rights, and exact-release evidence are complete.

## Useful Commands Or Links

- Local run: `npm run dev`
- LAN preview: `npm run dev:lan`
- Test/build: `npm run check`; `npm run build`
- PWA local URL: `http://127.0.0.1:5173`
- Demo URL: `http://127.0.0.1:5173?demo=focus`
- Mini Program path: `/Users/bytedance/healthy-pro/healthy-pro-weapp`

## Rocky4AI 正式入口与发布边界

- Rocky4AI 正式主域已完成备案、HTTPS 证书和 CloudBase 绑定，正式主入口是 `https://rocky4ai.com/`。
- CloudBase 环境 ID 是 `cloud1-d3g79qnvd808824c9`。
- CloudBase 根目录 `/` 的唯一 owner 是 `app-factory`，当前根入口进入 LifeMap；Healthy Pro 等普通 App 绝不能发布到根目录。
- Healthy Pro / Exercise 当前正式产品入口是微信小程序 `Healthy Pro / AI4RockyHP`，不是 CloudBase H5 网站。
- 本项目目前没有正式 H5 入口。未来如确需 H5，候选路径是 `/apps/healthy/`，且必须先通过 CTO 发布闸门。
- CloudBase 默认域名、测试域名和 `localhost` 仅用于开发、检查或留存证据，不得作为交给用户的正式入口。
- Web 项目内部跳转优先使用同源相对路径 `/apps/<app-name>/`；不得硬编码 CloudBase 测试域名，也不得自行创建 DNS 子域名。
- 域名统一不代表账号、数据库或用户数据已经统一；不得据此自行接入统一身份、共享数据或跨 App 同步。
- DNS、证书、域名绑定和根目录发布由 CTO / `app-factory` 管理，本项目不得自行修改。
- 后续发布必须区分本地工作区、Git 提交、远端 `main`、部署状态和用户可见版本，并验证精确的 `rocky4ai.com` 入口；小程序发布则验证对应的微信体验版或正式版入口。

## CloudBase Resource Ownership

- Updated: 2026-07-01.
- CloudBase environment: `cloud1-d3g79qnvd808824c9`.
- Current role: WeChat Mini Program cloud backend, not CloudBase static H5 hosting.
- Static hosting status: no files found under `/healthy/`, `/apps/healthy/`, `/rocky/`, or `/apps/rocky/`.
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
