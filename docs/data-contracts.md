# Healthy Pro Cross-Client Data Contracts

This document defines the canonical data shape shared by the PWA, WeChat mini program, and future cloud stores.

## Principles

- PWA `src/coach.js` is the source of truth for the coach model.
- The mini program may use local mock storage, but mock data must use the same field names as future cloud data.
- Backends are platform-specific adapters: Supabase for PWA, WeChat CloudBase for mini program.
- Do not persist temporary UI field names such as `target`, `experience`, `frequency`, or `feeling` into cloud data.
- Plan JSON can stay document-shaped for MVP, but every plan must carry a version.

## Versioning

Current canonical coach spec:

```text
mvp-2026-06-05-model-v2
```

Mini program preview plans may be generated locally, but they should still use this version and canonical field names. If local logic is simplified, mark that in implementation docs, not in persisted data structure.

## Assessment

```js
{
  gender: "male" | "female" | "other",
  age: number,
  height: number,
  weight: number,
  bodyFat: number | "",
  trainingExperience: "beginner" | "familiar" | "years" | "coach",
  targetPreference: "auto" | "fat-loss" | "gain" | "shape",
  focusAreas: string[],
  weeklyLimit: "coach" | "2" | "3" | "4",
  sessionBudget: 45 | 60 | 75,
  injury: "none" | "knee" | "back" | "shoulder" | "heart"
}
```

Supabase mapping is in `docs/supabase-schema.sql`:

- `height` -> `height_cm`
- `weight` -> `weight_kg`
- `bodyFat` -> `body_fat_percent`
- `trainingExperience` -> `training_experience`
- `targetPreference` -> `target_preference`
- `weeklyLimit` -> `weekly_limit`
- `sessionBudget` -> `session_budget_minutes`

CloudBase should store the canonical client object unless a cloud-function adapter explicitly maps fields.

## Plan

```js
{
  id: string,
  createdAt: string,
  version: "mvp-2026-06-05-model-v2",
  safetyHold: boolean,
  validation?: object,
  metrics?: object,
  risk?: object,
  goal: object,
  experience?: object,
  trainingProfile?: object,
  focusAreas: Array<{ id: string, label: string }>,
  frequency: {
    sessionsPerWeek: number,
    pattern: string,
    limitLabel?: string,
    restDays?: string
  },
  duration: {
    label: string,
    budget: number,
    split?: string
  },
  review?: object,
  arbitration?: object,
  decisionSummary?: string,
  workouts: Workout[],
  weeks: WeekRule[],
  rationale?: string,
  adjustmentGuide?: string,
  progressionRules?: string[],
  customization?: PlanCustomization
}
```

### Workout

```js
{
  id: string,
  title: string,
  focus: string,
  exercises: Exercise[]
}
```

### Exercise

```js
{
  id: string,
  name: string,
  equipmentId: string,
  equipmentName?: string,
  type: "strength" | "cardio",
  baseSets?: number,
  sets?: string,
  reps?: string,
  target?: string,
  rest?: string,
  effort?: string,
  load?: string,
  cue?: string,
  image?: string
}
```

`baseSets`, `target`, and `rest` are preferred for generated plans. `sets` and `reps` may be retained for mini program display/editing during the transition.

## TrainingLog

```js
{
  id: string,
  createdAt: string,
  workoutId: string,
  workoutTitle: string,
  week: number,
  completedCount: number,
  exercises: TrainingExerciseLog[],
  intensityFeedback: "too-easy" | "right" | "too-hard",
  note: string,
  schedule?: {
    mode: "planned" | "one-off-override",
    scheduledWorkoutId: string,
    actualWorkoutId: string,
    resumeWorkoutId: string
  }
}
```

## TrainingExecution

Mini Program store persists the next-session cursor separately from the plan and logs. A temporary override changes only the active session; it does not rewrite the long-term plan or consume the scheduled workout.

```js
{
  planId: string,
  nextWorkoutId: string,
  overrideWorkoutId: string,
  overrideCreatedAt: string,
  mode: "planned" | "one-off"
}
```

When `overrideWorkoutId` differs from `nextWorkoutId`, the app executes the override once. After that log is saved, the override is cleared and `nextWorkoutId` remains pending. When a scheduled workout is saved, `nextWorkoutId` advances to the following workout.

### TrainingExerciseLog

```js
{
  id: string,
  name: string,
  equipmentId: string,
  type: "strength" | "cardio",
  done: boolean,
  feeling?: number,
  setsDone?: number,
  weight?: number | null,
  reps?: number[] | null,
  duration?: number | null,
  speed?: number | null,
  incline?: number | null,
  resistance?: number | null
}
```

Mini program MVP can record simplified exercise entries, but it should still save an `exercises` array and `intensityFeedback`.

## BodyLog

```js
{
  id: string,
  createdAt: string,
  weight: number,
  bodyFat: number | null,
  sleep: number | null,
  note: string
}
```

## FriendSummary

```js
{
  nickname: string,
  friendCode: string,
  shareLeaderboard: boolean,
  shareWeeklySummary: boolean,
  currentWeekCount: number,
  currentWeekCompleted: number,
  currentWeekCompletionRate: number,
  streakWeeks: number,
  latestTrainingAt: string | null
}
```

Friend/ranking data must be private by default. CloudBase rules should not expose all friend profiles to all logged-in users.

## Next Adapter Targets

- PWA adapter: keep Supabase REST and current RLS.
- Mini program adapter: add CloudBase repository functions after the mini program mock uses this contract.
- No PWA/mini-program account linking until the mini program experience version is validated.
