# Healthy Pro Cross-Client Data Contracts

This document defines the canonical data shape shared by the WeChat Mini Program, its CloudBase store, and the read-only Healthy Web companion.

## Principles

- Mini Program `healthy-pro-weapp/utils/coach.js` is the source of truth for the active coach model.
- The Mini Program local recovery store and CloudBase document use the same canonical field names.
- CloudBase is the only active business-data backend. Healthy Web is a server-side, read-only adapter over the same Mini Program record.
- Supabase mappings and files are historical only; they are not part of the official build, runtime or synchronization path.
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

Historical Supabase field mapping, retained only to interpret frozen legacy data, was:

- `height` -> `height_cm`
- `weight` -> `weight_kg`
- `bodyFat` -> `body_fat_percent`
- `trainingExperience` -> `training_experience`
- `targetPreference` -> `target_preference`
- `weeklyLimit` -> `weekly_limit`
- `sessionBudget` -> `session_budget_minutes`

CloudBase stores the canonical client object unless a cloud-function adapter explicitly maps fields. No new Supabase write or migration should be added.

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

## Healthy Web Read Contract

The browser receives a sanitized envelope from `/apps/healthy/api/bootstrap`:

```js
{
  schemaVersion: 1,
  source: {
    kind: "healthy-weapp-cloudbase",
    syncedAt: string
  },
  profile: { nickname: string },
  assessment: Assessment | null,
  plan: Plan | null,
  trainingExecution: TrainingExecution | null,
  logs: TrainingLog[],
  bodyLogs: BodyLog[]
}
```

The Web response must omit `_id`, `_openid`, `openid`, `rockyUserId`, `ownerId`, `friendCode`, friendships, leaderboard, feedback and internal cloud state. API responses use `Cache-Control: no-store`; the service worker must never intercept or cache `/apps/healthy/api/*`.

The server accepts identity only from the Rocky same-origin session, resolves exactly one active `rockyUserId -> openid` binding, then reads `users/user_<openid>`. Browser parameters must never select an owner or OpenID.

### Rocky to WeChat binding contract

- Raw binding code: eight unambiguous characters, shown once to the logged-in Rocky user, expires in five minutes, never stored.
- Stored code record: `appId`, `rockyUserId`, `codeHash`, `status`, `createdAt`, `expiresAt`, `consumedAt`.
- Current-code pointer: one deterministic document per Rocky user. Its hash must match the submitted code, so generating a new code invalidates all earlier active records.
- Owner index: one deterministic document per Rocky user containing one active OpenID mapping.
- WeChat index: one deterministic document per OpenID containing one active Rocky user mapping.
- Consumer identity: Mini cloud function accepts only the code; AppID and OpenID come from `cloud.getWXContext()`.
- Transaction gate: current Rocky account, allowlist and `healthy` grant must all be active; the allowlist must still approve `healthy`, and the grant must include `session:read` plus `healthy:data:read` at consumption time.
- Status gate: an existing binding is shown as active only while the same Rocky account, allowlist and grant remain active.

The four binding collections are server/admin-only. LifeMap and browser clients never read these documents directly, and binding does not grant any other App access to Healthy data.

## Adapter Targets

- Mini Program adapter: existing openid-scoped CloudBase writer remains authoritative.
- Healthy Web adapter: read-only BFF plus Rocky session and secure one-time WeChat binding.
- Legacy Supabase adapter: frozen; no new writes, migrations, deployments or parity work.
- Any future Web write capability requires a new versioned contract, authorization rules and conflict handling. It is not implied by account binding.
