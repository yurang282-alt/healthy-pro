# Healthy Pro Design Acceptance Checklist

Purpose: keep Healthy Pro / Rocky aligned with its product identity: professional, restrained, and like a training tool. This checklist is for design review before friend trial, experience-version upload, or any user-facing UI change.

## Review Principle

The interface must help a user answer three questions quickly:

1. What should I train now?
2. How far through the workout am I?
3. What should I do or save next?

If a screen mainly looks like a generic health card feed, cute check-in app, or admin dashboard, it fails the design direction even if it is functional.

## Home First Screen

- Pass: the first screen shows today's workout, current stage/week, progress, and the primary action.
- Pass: the strongest visual area is the training cockpit, not a general status card.
- Pass: metrics are concise and useful during gym use: duration, action count, progress, readiness, next action.
- Fail: the user has to read long coach paragraphs before knowing what to do.
- Fail: update notices, sync state, or secondary content compete with today's workout.

## Training Plan

- Pass: the first screen shows current week, phase target, weekly frequency, single-session duration, focus, and next training entry.
- Pass: hierarchy is clear: cycle/week -> training day -> exercise.
- Pass: plan management is available but visually secondary to understanding the plan.
- Pass: coach explanation is folded or compact; it explains why and when to adjust, not every detail upfront.
- Fail: the page feels like backend settings, a static schedule table, or a long undifferentiated list.

## Training Record

- Pass: the first screen behaves like an execution console: current exercise, progress, input fields, completion action, and save path are obvious.
- Pass: each exercise has clear completion status and can be revised before final save.
- Pass: session feedback uses training language such as 偏轻, 正好, 偏重, 动作不稳.
- Pass: after all actions are complete, saving the session is visible without forcing the user to search at the bottom.
- Fail: history, body records, notes, or detailed explanations take priority over the current exercise.
- Fail: feedback relies on cute emoji or vague mood labels as the primary training data.

## Buttons And Controls

- Pass: primary action labels use concrete verbs such as 开始训练, 完成动作, 保存本次训练, 重新评估.
- Pass: destructive or plan-changing actions are visually secondary and explain consequence when needed.
- Pass: controls have stable size, enough tap area, and do not move unexpectedly when data changes.
- Fail: multiple equally strong buttons appear in the same area without a clear next step.
- Fail: important actions depend on scrolling to an unpredictable location.

## Status Feedback

- Pass: sync, save, draft, completion, and adjustment states are visible when they affect the user's next action.
- Pass: status copy is short and operational, not technical.
- Pass: local fallback or cloud error does not block training unless data safety requires it.
- Fail: the app exposes implementation details such as raw storage mode or backend names on primary screens.

## Errors And Recovery

- Pass: failed sync/save gives a clear recovery path: retry, local fallback, or keep draft.
- Pass: plan recovery and previous version actions are discoverable but not visually dominant.
- Pass: assessment errors identify the invalid field and explain the safe next step.
- Fail: data loss is possible without warning when navigating away, closing the app, or switching tabs.
- Fail: the user cannot recover from a mistaken plan edit or incomplete training save.

## Difference From Other Apps

- Pass: Healthy Pro feels like a personal training assistant for gym planning and logging.
- Pass: visual language favors training hierarchy, cockpit panels, progress, and precise metrics.
- Pass: friend/social surfaces remain private-by-default and do not turn the product into a public ranking app.
- Fail: the app could be mistaken for a generic habit tracker, generic wellness dashboard, or generic form app after changing only the logo and copy.

## Release Gate

Before broader friend testing, confirm:

- Home, Plan, and Log pass the checklist on a real phone or WeChat DevTools preview.
- No UI change weakens CloudBase/openid data isolation, login flow, training records, or experience-version behavior.
- Update announcement is prepared when a user-visible release is uploaded.
- Any unresolved issue is documented as P0, P1, or P2 before publishing.
