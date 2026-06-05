import { existsSync } from "node:fs";
import {
  EQUIPMENT,
  FOCUS_AREAS,
  VISIBLE_EQUIPMENT_IDS,
  generateCoachPlan,
  getLoadRecommendation,
  getNextWorkout,
  getPrescription,
  getWorkoutDuration
} from "../src/coach.js";

const requiredFiles = [
  "index.html",
  "src/app.js",
  "src/coach.js",
  "src/styles.css",
  "public/manifest.webmanifest",
  "public/assets/equipment-contact-sheet.png",
  "public/assets/smith-machine.png",
  "docs/ai-coach-spec.md",
  "docs/supabase-schema.sql"
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

if (EQUIPMENT.length < VISIBLE_EQUIPMENT_IDS.length || VISIBLE_EQUIPMENT_IDS.length !== 17) {
  throw new Error("Visible equipment library should include 17 image-backed items.");
}

const visibleEquipment = new Set(VISIBLE_EQUIPMENT_IDS);

function assertPlanUsesVisibleEquipment(plan, label) {
  const unsupported = plan.workouts
    .flatMap((workout) => workout.exercises.map((exercise) => ({
      workout: workout.title,
      exercise: exercise.name,
      equipmentId: exercise.equipmentId
    })))
    .filter((item) => !visibleEquipment.has(item.equipmentId));

  if (unsupported.length) {
    throw new Error(`${label} references equipment without a visible image: ${JSON.stringify(unsupported)}`);
  }
}

const focusAssessment = {
  gender: "male",
  age: 28,
  height: 170,
  weight: 65,
  bodyFat: 14,
  trainingExperience: "familiar",
  targetPreference: "gain",
  weeklyLimit: "coach",
  sessionBudget: 60,
  injury: "none",
  focusAreas: ["chest", "back"]
};

const plan = generateCoachPlan(focusAssessment);

if (plan.safetyHold || !plan.workouts?.length) {
  throw new Error("Expected a usable training plan.");
}

assertPlanUsesVisibleEquipment(plan, "Focus demo plan");

if (plan.goal.type !== "精益增肌期") {
  throw new Error(`Expected lean gain goal, got ${plan.goal.type}.`);
}

if (plan.duration.split.includes("放松心肺 10-15")) {
  throw new Error("Lean gain plan should not prescribe long default cardio.");
}

if (!plan.focusAreas?.length || !plan.frequency.pattern.includes("胸部强化") || !plan.frequency.pattern.includes("背部强化")) {
  throw new Error("Expected focus area selections to create a split training plan.");
}

const workout = getNextWorkout(plan, []);
const prescription = getPrescription(workout.exercises[1], 1);
const firstStrengthExercise = workout.exercises.find((exercise) => exercise.type === "strength");
const starterLoad = getLoadRecommendation(firstStrengthExercise, focusAssessment, [], 1);
const workoutDuration = getWorkoutDuration(workout, 1);

if (!prescription.sets || !prescription.reps || !prescription.effortText) {
  throw new Error("Expected exercise prescription to include beginner-readable effort guidance.");
}

if (!starterLoad?.label?.includes("建议") || !starterLoad.label.includes("kg")) {
  throw new Error(`Expected strength exercise to include a kg-based starting load recommendation, got ${starterLoad?.label}.`);
}

const historicalLoad = getLoadRecommendation(firstStrengthExercise, focusAssessment, [{
  id: "log_load_check",
  workoutId: workout.id,
  intensityFeedback: "too-easy",
  exercises: [{
    exerciseId: firstStrengthExercise.id,
    name: firstStrengthExercise.name,
    type: "strength",
    done: true,
    weight: "20",
    reps: "12/12/12",
    feeling: 2
  }]
}], 2);

if (historicalLoad?.source !== "history" || !historicalLoad.detail.includes("上次")) {
  throw new Error("Expected load recommendation to use historical training records when available.");
}

if (workoutDuration.max < 50 || workoutDuration.min < 25) {
  throw new Error(`Expected a real lean-gain training dose for a 60-minute cap, got ${workoutDuration.label}.`);
}

if (!workout.exercises.some((exercise) => exercise.equipmentId === "smith-machine")) {
  throw new Error("Expected Smith machine to be considered in the chest training plan.");
}

const blocked = generateCoachPlan({
  gender: "female",
  age: 35,
  height: 165,
  weight: 62,
  targetPreference: "auto",
  weeklyLimit: "coach",
  sessionBudget: 60,
  injury: "back"
});

if (!blocked.safetyHold) {
  throw new Error("Injury boundary should block plan generation in MVP.");
}

const legsChestPlan = generateCoachPlan({
  gender: "male",
  age: 30,
  height: 178,
  weight: 72,
  bodyFat: 16,
  trainingExperience: "familiar",
  targetPreference: "gain",
  weeklyLimit: "coach",
  sessionBudget: 60,
  injury: "none",
  focusAreas: ["chest", "legs"]
});

if (!legsChestPlan.frequency.pattern.startsWith("腿部强化 / 胸部强化")) {
  throw new Error(`Expected legs then chest split, got ${legsChestPlan.frequency.pattern}.`);
}

assertPlanUsesVisibleEquipment(legsChestPlan, "Legs and chest plan");

const tightBudgetPlan = generateCoachPlan({
  gender: "male",
  age: 31,
  height: 170,
  weight: 65,
  bodyFat: 14,
  trainingExperience: "years",
  targetPreference: "gain",
  weeklyLimit: "coach",
  sessionBudget: 45,
  injury: "none",
  focusAreas: ["chest", "back"]
});

if (tightBudgetPlan.duration.budget !== 45 || !tightBudgetPlan.duration.split.includes("单次 45 分钟上限")) {
  throw new Error("45-minute selection should be carried into plan.duration.");
}

for (const tightWorkout of tightBudgetPlan.workouts) {
  const weekThreeDuration = getWorkoutDuration(tightWorkout, 3);
  if (weekThreeDuration.max > 45) {
    throw new Error(`45-minute cap should constrain week 3 ${tightWorkout.title}, got ${weekThreeDuration.label}.`);
  }
}

const roomyBudgetPlan = generateCoachPlan({
  gender: "male",
  age: 31,
  height: 170,
  weight: 65,
  bodyFat: 14,
  trainingExperience: "years",
  targetPreference: "gain",
  weeklyLimit: "coach",
  sessionBudget: 75,
  injury: "none",
  focusAreas: ["chest", "back"]
});

if (roomyBudgetPlan.duration.budget !== 75 || !roomyBudgetPlan.duration.split.includes("单次 75 分钟上限")) {
  throw new Error("75-minute selection should be carried into plan.duration.");
}

if (roomyBudgetPlan.trainingProfile.volumeTier !== "hypertrophy") {
  throw new Error(`Lean gain with a 75-minute cap should enter hypertrophy volume, got ${roomyBudgetPlan.trainingProfile.volumeTier}.`);
}

const tightWeekThreeMax = Math.max(...tightBudgetPlan.workouts.map((item) => getWorkoutDuration(item, 3).max));
const roomyWeekThreeMax = Math.max(...roomyBudgetPlan.workouts.map((item) => getWorkoutDuration(item, 3).max));

if (roomyWeekThreeMax <= tightWeekThreeMax) {
  throw new Error(`Session budget should change plan capacity, got 45=${tightWeekThreeMax}, 75=${roomyWeekThreeMax}.`);
}

const twiceWeeklyPlan = generateCoachPlan({
  gender: "male",
  age: 31,
  height: 170,
  weight: 65,
  bodyFat: 14,
  trainingExperience: "familiar",
  targetPreference: "gain",
  weeklyLimit: "2",
  sessionBudget: 75,
  injury: "none",
  focusAreas: ["chest", "back"]
});

if (twiceWeeklyPlan.frequency.sessionsPerWeek !== 2 || twiceWeeklyPlan.workouts.length !== 2) {
  throw new Error(`Weekly limit 2 should generate exactly 2 training days, got ${twiceWeeklyPlan.frequency.sessionsPerWeek} sessions and ${twiceWeeklyPlan.workouts.length} workouts.`);
}

const fourWeeklyPlan = generateCoachPlan({
  gender: "male",
  age: 31,
  height: 170,
  weight: 65,
  bodyFat: 14,
  trainingExperience: "years",
  targetPreference: "gain",
  weeklyLimit: "4",
  sessionBudget: 75,
  injury: "none",
  focusAreas: ["chest", "back"]
});

const uniqueFourDayTitles = new Set(fourWeeklyPlan.workouts.map((item) => item.title));
if (fourWeeklyPlan.frequency.sessionsPerWeek !== 4 || fourWeeklyPlan.workouts.length !== 4 || uniqueFourDayTitles.size !== 4) {
  throw new Error(`Weekly limit 4 should generate 4 distinct training days, got ${fourWeeklyPlan.frequency.sessionsPerWeek} sessions and ${fourWeeklyPlan.workouts.map((item) => item.title).join("/")}.`);
}

const fourDayFatLossPlan = generateCoachPlan({
  gender: "male",
  age: 31,
  height: 170,
  weight: 75,
  bodyFat: 24,
  trainingExperience: "familiar",
  targetPreference: "fat-loss",
  weeklyLimit: "4",
  sessionBudget: 60,
  injury: "none",
  focusAreas: []
});

if (fourDayFatLossPlan.frequency.sessionsPerWeek !== 4 || fourDayFatLossPlan.workouts.length !== 4) {
  throw new Error(`Weekly limit 4 should apply beyond gain plans, got ${fourDayFatLossPlan.frequency.sessionsPerWeek} sessions and ${fourDayFatLossPlan.workouts.length} workouts.`);
}

const targetPreferences = ["auto", "fat-loss", "gain", "shape"];
const focusCases = [[], ...FOCUS_AREAS.map((area) => [area.id])];

for (const targetPreference of targetPreferences) {
  for (const focusAreas of focusCases) {
    const generatedPlan = generateCoachPlan({
      gender: "male",
      age: 30,
      height: 170,
      weight: 65,
      bodyFat: 14,
      trainingExperience: "familiar",
      targetPreference,
      weeklyLimit: "coach",
      sessionBudget: 60,
      injury: "none",
      focusAreas
    });

    assertPlanUsesVisibleEquipment(generatedPlan, `${targetPreference} ${focusAreas.join(",") || "balanced"} plan`);
  }
}

console.log("Healthy Pro MVP check passed.");
