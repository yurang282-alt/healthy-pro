# Healthy Pro Design Decisions

## 2026-08-12 LifeMap Healthy Web Companion

### Decision 1: One Product, Two Deliberate Surfaces

The Mini Program remains the gym execution cockpit. Healthy Web is a read-only plan and review desk. It does not duplicate assessment, plan editing, live exercise input, friends or feedback in its first release.

### Decision 2: Lead With Training State

The Web overview starts with the next workout and weekly rhythm, then moves into plan structure and history. It avoids a generic grid of equal-weight health KPI cards.

### Decision 3: Identity Failure Replaces Content

Unauthenticated, unauthorized, unbound, empty and backend-error states are explicit full-page gates. The interface never falls back to cached health data or another user's record.

### Decision 4: Share Data, Not UI Complexity

The Web reads the same CloudBase training record as the Mini Program through a server-side Rocky binding. Supabase parity and a second Web data model are intentionally retired.

### Decision 5: Make Account Linking A Short Handoff

When no binding exists, the Web owns the first step: generate one five-minute code. The Mini Program owns identity proof and confirmation under `我的 -> 设置与反馈`. The Web then performs an explicit reread; no background polling, silent matching, or automatic data merging occurs.

The gate uses one dominant action, a visible code, three short steps, and clear privacy language. It remains a full-page state so no fixture, stale record, or another account's content appears underneath.

## 2026-07-13 Friends And Ranking Hierarchy

Trigger: real-device feedback showed that the friends page exposed identity settings, sharing controls, adding friends, ranking, activity, and friend management with equal visual weight.

### Decision 1: Social Is A Training Companion Surface

The default view answers two questions: how to add a friend, and how the group is training this week. Friend code and add action belong in the primary dark panel; weekly ranking follows immediately.

### Decision 2: Settings Are Not The Main Task

Nickname, sharing scope, friend removal, and detailed privacy copy remain available but are folded under `隐私与好友管理`. Incoming requests remain visible because they require action.

### Decision 3: Keep Ranking Restrained

The ranking emphasizes weekly completion and consistency, not competition decoration. It does not expose weight, body fat, training loads, notes, or complete plans.

## 2026-07-12 Progressive Disclosure Simplification

Scope: WeChat Mini Program only. This pass keeps training prescriptions, safety boundaries, plan recovery, CloudBase identity, and saved records intact while reducing what appears by default.

### Decision 1: One Screen, One Immediate Question

Home answers what to train today; Plan explains the current structure; Log focuses on the current exercise; Plan Editor exposes one editable exercise at a time; Equipment defaults to today's machines; Profile summarizes the current week.

### Decision 2: Preserve Prescription Data In Compact Summaries

Collapsed exercise rows must still show sets, reps or duration, rest, equipment, and suggested load. Simplification may hide editing controls and explanations, but not the prescription required to execute safely.

### Decision 3: Use Progressive Disclosure For Secondary Work

Full equipment libraries, coach rationale, plan recovery, history, body records, and advanced plan settings stay available behind explicit controls. Primary actions remain directly visible and use stable phone-sized touch targets.

### Decision 4: Split Assessment By User Decision

Assessment is organized into body status, training direction, and time or limitations, followed by a compact confirmation. Reassessment continues to hydrate the last saved values.

## 2026-07-07 Design Follow-Up Backlog

Source: CTO design follow-up. Scope is planning and acceptance only; no product code, CloudBase, login, database, cloud function, or Mini Program upload changes.

### Decision 1: Keep the Training Tool Direction

Healthy Pro's design target is professional, restrained, and training-tool-like. The product should help users decide what to train, execute the current workout, and save useful records. It should not drift toward a generic health card app, cute check-in app, or broad wellness dashboard.

### Decision 2: Accept the Current Cockpit Direction, But Keep It Under Review

The current Mini Program cockpit direction is directionally correct for friend trial because Home, Plan, and Log now emphasize current task, progress, training metrics, and coach-like feedback. The remaining design work should be small-scope tightening, not a full redesign.

### Top Remaining Design Issues

1. Secondary surfaces such as Assessment, Equipment, and Profile still feel lighter and more card-like than the core cockpit pages.
2. Real-device screenshot acceptance is still manual; spacing, overflow, safe-area behavior, and contrast need periodic phone checks before wider release.
3. Cockpit styles are still partly page-local, so repeated UI fixes can diverge unless shared tokens/components are consolidated later.

### Implementation Recommendation

Design is good enough for experience-version and friend trial. Enter implementation only for targeted fixes that improve clarity, hierarchy, or recovery in the current flow. Do not start another broad redesign until friend feedback shows a repeated comprehension or task-completion failure.

## 2026-07-02 Mini Program Cockpit V2

Scope: WeChat Mini Program only. PWA, CloudBase, user isolation, `login`, and `social` cloud functions were not changed for this design pass.

### Decision 1: Make the Current Task Dark and Primary

The active training state now uses a dark cockpit panel on Home, Plan, and Log. This creates a consistent product language: the darkest surface is where the user's next action lives.

### Decision 2: Turn Log Into a Training Execution Cockpit

The Log page now prioritizes the current exercise, session progress, input fields, feedback, and save action. History and body records are secondary sections below the current training task.

### Decision 3: Replace Cute Feedback With Training Feedback

Action-level and session-level feedback now uses restrained training language: 偏轻, 正好, 偏重, 动作不稳. This better supports later plan adjustment than emoji-style emotional states.

### Decision 4: Turn Plan Into a Control Console

The Plan page now starts with current week, phase, next training day, weekly frequency, duration, and focus. Plan management is available but visually secondary.

### Remaining Design Debt

- Equipment, assessment, and profile still use lighter card language and need a later token pass.
- There is no automated screenshot pipeline for WeChat pages yet; visual acceptance still depends on WeChat DevTools or real-device screenshots.
- Some global styles remain page-local and should be consolidated after the user validates the direction.

## 2026-07-02 Interaction Density Pass

Trigger: User and design review both found that Cockpit V2 still exposed too much text by default.

### Decision 1: Default Screens Should Show State, Not Explanation

Home, Plan, and Log now favor short status labels and training metrics over long coach sentences. This keeps the app useful during gym use, where users are acting rather than reading.

### Decision 2: Keep Coach Value, But Fold It

Coach explanations, safety details, plan recovery, history, and body records remain available, but no longer occupy the default first path.

### Decision 3: Log Page Is the Highest-Pressure Surface

The Log page now defaults to current action, one key cue, status tags, input fields, and the completion button. Action queue, extra cues, notes, history, and body records are secondary drawers.

### Acceptance Criteria

- A user opening Log should understand the current exercise and primary action within 3 seconds.
- Plan should open on week structure and next workout, not management controls.
- Home exercise previews should be scannable without reading full coaching sentences.

## 2026-08-12 Healthy Web LifeMap Handoff

### Decision 1: Make The Parent Product Visible

Every Healthy Web state includes a real, keyboard-accessible `LifeMap` return link to `/apps/lifemap/`, while `Healthy Pro` remains the product signal. The app no longer links its brand to the CloudBase root directory.

### Decision 2: Map The Existing Training Node

LifeMap should change the existing `train` / `身体训练` registry item to `/apps/healthy/`. The separate `healthy` / `健康体检站` item is not this product and must not be overwritten.

### Decision 3: Keep Review And Execution Separate

The Web companion remains a calm, read-only plan and review desk. Assessment, plan editing, workout execution and record creation stay in the Mini Program. This avoids a second writer and keeps the Web first screen focused.

## 2026-08-13 Cross-Platform Cockpit Contract

### Decision 1: Share A Component Language, Not Write Capabilities

The Mini Program and Healthy Web use the same six visual contracts: `CockpitPanel`, `MetricCell`, `StatusChip`, `PrimaryAction`, `WorkoutRow`, and `CoachNote`. Both surfaces use the same ink, green, mint, amber, border and radius tokens. The Mini Program remains the execution and write surface; Web remains read-only.

### Decision 2: Give Every Core Web Page A Clear Operational Role

- Overview: `训练驾驶舱`, with the next workout, three metrics, readiness and one plan action.
- Plan: `计划控制台`, with the current week, next workout, cycle and training-day hierarchy.
- History: `训练复盘台`, with the latest session summary and a chronological record timeline.
- Data: `我的训练档案`, with source, ownership, sync state and folded privacy detail.

### Decision 3: Preserve Prescription Detail

Shared workout rows must expose equipment, sets, reps or duration, rest and suggested load. The Web may fold a workout or record, but it must not remove the prescription details needed to understand the plan.

### Decision 4: Keep Secondary Explanations Folded

Coach rationale and implementation-level privacy detail remain available in drawers. They must not compete with the current workout, current plan stage or recent training result in the first viewport.
