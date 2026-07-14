const assert = require("node:assert/strict");
const {
  advanceTrainingExecution,
  createTrainingOverride,
  getNextWorkout,
  getWorkoutRecoveryStatus,
  getTrainingExecutionInfo,
  normalizeTrainingExecution
} = require("../healthy-pro-weapp/utils/coach");

const workouts = [
  { id: "legs", title: "腿部强化", exercises: [] },
  { id: "chest", title: "胸部强化", exercises: [] },
  { id: "back", title: "背部强化", exercises: [] }
];
const plan = { id: "plan-a", workouts };
const logs = [{ workoutId: "legs", workoutTitle: "腿部强化", createdAt: "2026-07-12T10:00:00+08:00" }];

const initial = normalizeTrainingExecution(plan, logs, null);
assert.equal(initial.nextWorkoutId, "chest", "one completed log should schedule chest next");
assert.equal(getNextWorkout(plan, logs, initial).id, "chest");

const overridden = createTrainingOverride(plan, logs, initial, "legs");
const overrideInfo = getTrainingExecutionInfo(plan, logs, overridden);
assert.equal(overrideInfo.workout.id, "legs", "one-off override should become the active workout");
assert.equal(overrideInfo.scheduledWorkout.id, "chest", "the original schedule should remain pending");
assert.equal(overrideInfo.isOverride, true);

const restoredFromStorage = JSON.parse(JSON.stringify(overridden));
const afterReentry = getTrainingExecutionInfo(plan, logs, restoredFromStorage);
assert.equal(afterReentry.workout.id, "legs", "the override should survive storage and page re-entry");
assert.equal(afterReentry.scheduledWorkout.id, "chest");

const withUnrelatedLog = normalizeTrainingExecution(
  plan,
  logs.concat({ workoutId: "back", createdAt: "2026-07-13T10:00:00+08:00" }),
  restoredFromStorage
);
assert.equal(withUnrelatedLog.nextWorkoutId, "chest", "an explicit schedule should not drift with log count");
assert.equal(withUnrelatedLog.overrideWorkoutId, "legs");

const afterTemporaryLegs = advanceTrainingExecution(plan, logs, overridden, "legs");
assert.equal(afterTemporaryLegs.nextWorkoutId, "chest", "completing a temporary workout should resume chest");
assert.equal(afterTemporaryLegs.overrideWorkoutId, "");

const afterChest = advanceTrainingExecution(plan, logs.concat({ workoutId: "legs" }), afterTemporaryLegs, "chest");
assert.equal(afterChest.nextWorkoutId, "back", "completing the scheduled workout should advance normally");

const restored = createTrainingOverride(plan, logs, overridden, "chest");
assert.equal(restored.overrideWorkoutId, "", "choosing the scheduled workout should clear the override");

const changedPlan = { id: "plan-b", workouts };
const resetForNewPlan = normalizeTrainingExecution(changedPlan, logs, overridden);
assert.equal(resetForNewPlan.planId, "plan-b");
assert.equal(resetForNewPlan.overrideWorkoutId, "", "a new plan version should not inherit a stale override");

const invalidOverride = normalizeTrainingExecution(plan, logs, {
  ...initial,
  overrideWorkoutId: "missing-workout"
});
assert.equal(invalidOverride.overrideWorkoutId, "", "a removed workout should clear a stale override");

const recovery = getWorkoutRecoveryStatus(workouts[0], [
  { workoutId: "legs", createdAt: "2026-07-10T10:00:00+08:00" },
  { workoutId: "legs", createdAt: "2026-07-14T01:00:00+08:00" },
  { workoutId: "chest", createdAt: "2026-07-14T09:00:00+08:00" }
], new Date("2026-07-14T10:00:00+08:00"));
assert.equal(recovery.level, "warning", "recovery should use the latest matching log even when logs are unsorted");
assert.equal(recovery.hoursSince, 9);

console.log("Healthy Pro WeApp training execution check passed.");
