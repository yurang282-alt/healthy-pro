# Healthy Pro Design Decisions

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
