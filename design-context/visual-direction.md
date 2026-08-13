# Healthy Pro Mini Program Visual Direction

## Product Identity

Healthy Pro is a personal training assistant for gym planning and workout logging. The Mini Program should feel like a coach's training cockpit: calm, precise, and task-focused.

## Target Feeling

- Professional, not cute.
- Calm, not motivational-noisy.
- Precise, not generic wellness.
- Coach-like, not admin-dashboard.
- Training-tool first: the interface should feel like a serious gym training tool, not a generic health card app.

## Visual System

- Use a dark training core panel for the active task: today's workout, current training action, and current plan week.
- Use restrained green as a functional state color: ready, active, complete, safe progression.
- Use warm amber only for coach caution or adjustment explanations.
- Keep white cards for secondary records and reference content, not for every primary section.
- Metrics should be compact and readable: frequency, duration, completion, current week, and next action.

## Core Page Roles

- Home: training cockpit and today's command.
- Plan: plan control console, week rhythm, training-day hierarchy.
- Log: execution cockpit, current action, progress, training feedback, save path.

## Healthy Web Companion

- Role: plan and review desk inside Rocky LifeMap, not a browser clone of the gym execution flow.
- First screen: next workout, weekly rhythm and one clear action to inspect the plan.
- Desktop: persistent compact navigation with plan and history hierarchy; mobile: four-item bottom navigation.
- Keep the same professional training language while allowing calmer review density than the Mini Program.
- Authentication, unbound, empty and unavailable states must replace the full product surface and fail closed.
- The unbound state should feel like a compact account handoff, not a setup wizard: one code, three steps, one confirmation action, and no health content behind the gate.
- Cross-platform visual contract: core pages begin with a functional title and a dark status surface, followed by compact secondary panels. Shared components use the same ink, green, mint, amber, borders, radii and state meanings as the Mini Program.
- Web actions remain read-only verbs such as `查看`, `展开` and `返回`; never copy Mini Program write verbs such as `开始`, `完成`, `保存` or `调整` into the Web companion.

## Avoid

- Emoji-heavy feedback as the primary training language.
- Every section as the same white rounded card.
- Decorative gradients without task meaning.
- SaaS dashboard density.
- Wellness-app softness where the user needs clear exercise execution.
