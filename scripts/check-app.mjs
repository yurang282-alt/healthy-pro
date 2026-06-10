import { existsSync, readFileSync } from "node:fs";
import {
  EQUIPMENT,
  EQUIPMENT_BY_ID,
  FOCUS_AREAS,
  PLAN_EXERCISES,
  VISIBLE_EQUIPMENT_IDS,
  generateCoachPlan,
  getLoadRecommendation,
  getNextWorkout,
  getPrescription,
  getWorkoutDuration,
  validateAssessment
} from "../src/coach.js";

const requiredFiles = [
  "index.html",
  "src/app.js",
  "src/cloud.js",
  "src/coach.js",
  "src/runtime-config.js",
  "src/styles.css",
  "public/manifest.webmanifest",
  "public/assets/equipment-contact-sheet.png",
  "public/assets/smith-machine.png",
  "docs/ai-coach-spec.md",
  "docs/supabase-schema.sql",
  "docs/roadmap.md"
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

const styles = readFileSync("src/styles.css", "utf8");
const indexSource = readFileSync("index.html", "utf8");
const manifestSource = readFileSync("public/manifest.webmanifest", "utf8");
const serviceWorker = readFileSync("sw.js", "utf8");
const appSource = readFileSync("src/app.js", "utf8");
const cloudSource = readFileSync("src/cloud.js", "utf8");
const schemaSource = readFileSync("docs/supabase-schema.sql", "utf8");
const agentsSource = readFileSync("AGENTS.md", "utf8");
const buildSource = readFileSync("scripts/build-static.mjs", "utf8");
const buildVersionPlaceholder = "__HEALTHY_PRO_BUILD_VERSION__";

if (!styles.includes("grid-template-columns: 64px 1fr") || !styles.includes("width: 64px") || !styles.includes("height: 64px")) {
  throw new Error("Exercise thumbnails should stay square so 4x4 equipment sprites are not cropped or squeezed.");
}

if (!styles.includes("grid-template-columns: repeat(3, minmax(0, 1fr))") || !styles.includes("width: 1px")) {
  throw new Error("Mobile choice grids should not let hidden inputs create horizontal overflow.");
}

if (!buildSource.includes("createBuildVersion") || !buildSource.includes("replaceBuildVersion")) {
  throw new Error("Static build should automatically generate and inject a build version.");
}

if (!serviceWorker.includes(`healthy-pro-mvp-${buildVersionPlaceholder}`) || serviceWorker.includes("ignoreSearch: true")) {
  throw new Error("Service worker should use the automatic cache version and handle cache-busted app assets.");
}

if (
  !indexSource.includes(`/src/styles.css?v=${buildVersionPlaceholder}`) ||
  !indexSource.includes(`/src/app.js?v=${buildVersionPlaceholder}`) ||
  !indexSource.includes(`/public/icon.svg?v=${buildVersionPlaceholder}`)
) {
  throw new Error("Index should load app shell assets with the automatic build version.");
}

if (!manifestSource.includes(`/public/icon.svg?v=${buildVersionPlaceholder}`)) {
  throw new Error("Web app manifest should reference the icon with the automatic build version.");
}

if (
  !serviceWorker.includes(`/src/styles.css?v=${buildVersionPlaceholder}`) ||
  !serviceWorker.includes(`/src/app.js?v=${buildVersionPlaceholder}`) ||
  !serviceWorker.includes(`/src/cloud.js?v=${buildVersionPlaceholder}`) ||
  !serviceWorker.includes(`/src/coach.js?v=${buildVersionPlaceholder}`) ||
  !serviceWorker.includes(`/src/runtime-config.js?v=${buildVersionPlaceholder}`) ||
  !serviceWorker.includes(`/public/icon.svg?v=${buildVersionPlaceholder}`)
) {
  throw new Error("Service worker should cache versioned app shell assets by full URL.");
}

if (!appSource.includes(`./coach.js?v=${buildVersionPlaceholder}`) || !appSource.includes(`./cloud.js?v=${buildVersionPlaceholder}`)) {
  throw new Error("App imports should use the automatic build version.");
}

if (!cloudSource.includes(`./runtime-config.js?v=${buildVersionPlaceholder}`)) {
  throw new Error("Cloud config import should use the automatic build version.");
}

if (!appSource.includes("signInCloud") || !appSource.includes("renderStatusBanners") || !appSource.includes("beforeinstallprompt")) {
  throw new Error("App should include Supabase auth hooks, sync status, and PWA install handling.");
}

if (!appSource.includes("data-plan-editor-form") || !appSource.includes("restore-original-plan") || !appSource.includes("restore-previous-plan") || !appSource.includes("previousPlans")) {
  throw new Error("App should support custom plan editing, AI plan restore, previous plan restore, and previous plan history.");
}

if (!appSource.includes("renderWeeklyTrainingTrend") || !appSource.includes("renderFriendsSection") || !appSource.includes("getProfileInsights")) {
  throw new Error("Profile page should show record insights, trends, and friend leaderboard surface.");
}

if (!appSource.includes("data-feedback-form") || !cloudSource.includes("saveCloudFeedback") || !cloudSource.includes("addCloudFriend")) {
  throw new Error("App should include feedback submission and friend management hooks.");
}

if (!appSource.includes("renderReleaseSection") || !appSource.includes("mark-release-read") || !cloudSource.includes("loadCloudReleases") || !cloudSource.includes("markCloudReleaseRead")) {
  throw new Error("App should include release announcement display and read-state hooks.");
}

if (!appSource.includes("v0.6.0") || !schemaSource.includes("v0.6.0") || !appSource.includes("mergeReleaseStates")) {
  throw new Error("Latest release announcement should be available in built-in app releases, Supabase seed, and cloud/local merge logic.");
}

if (!agentsSource.includes("每次发布上线都必须同步整理并发布更新公告")) {
  throw new Error("Project operating rules should require release announcements for every production release.");
}

if (!appSource.includes("renderExerciseDetail") || !appSource.includes("view-exercise") || !appSource.includes("getRelatedExercises")) {
  throw new Error("App should include tappable exercise details with related exercise fallback guidance.");
}

if (!appSource.includes("renderTrainingCoachPanel") || !appSource.includes("training-complete-set") || !appSource.includes("scheduleRestTimerTick")) {
  throw new Error("Training log should behave like an in-session coach with set completion and rest timing.");
}

if (!schemaSource.includes("create table if not exists public.friend_profiles") ||
  !schemaSource.includes("create table if not exists public.friendships") ||
  !schemaSource.includes("create table if not exists public.feedback") ||
  !schemaSource.includes("Users can read friend public summaries")) {
  throw new Error("Supabase schema should include friend profiles, friendships, feedback, and RLS policies.");
}

if (!schemaSource.includes("create table if not exists public.app_releases") ||
  !schemaSource.includes("create table if not exists public.user_release_reads") ||
  !schemaSource.includes("Users can read published releases") ||
  !schemaSource.includes("Users can insert own release reads")) {
  throw new Error("Supabase schema should include app releases, release read state, and RLS policies.");
}

if (!cloudSource.includes("/auth/v1") || !cloudSource.includes("/token?grant_type=password") || !cloudSource.includes("/rest/v1")) {
  throw new Error("Cloud data layer should use Supabase Auth and REST APIs.");
}

if (!buildSource.includes("SUPABASE_URL") || !buildSource.includes("runtime-config.js")) {
  throw new Error("Static build should generate runtime Supabase config from environment variables.");
}

if (EQUIPMENT.length < VISIBLE_EQUIPMENT_IDS.length || VISIBLE_EQUIPMENT_IDS.length !== 17) {
  throw new Error("Visible equipment library should include 17 image-backed items.");
}

const visibleEquipment = new Set(VISIBLE_EQUIPMENT_IDS);

if (!PLAN_EXERCISES.length) {
  throw new Error("Custom plan editor should expose a non-empty action library.");
}

const unsupportedPlanExercises = PLAN_EXERCISES
  .filter((exercise) => !visibleEquipment.has(exercise.equipmentId))
  .map((exercise) => `${exercise.name}:${exercise.equipmentId}`);

if (unsupportedPlanExercises.length) {
  throw new Error(`Custom plan editor should only offer image-backed equipment actions: ${unsupportedPlanExercises.join(", ")}`);
}

for (const equipmentId of visibleEquipment) {
  const equipment = EQUIPMENT_BY_ID[equipmentId];
  if (!equipment?.imageSrc || !existsSync(equipment.imageSrc.replace(/^\//, ""))) {
    throw new Error(`${equipmentId} should have a real image file, got ${equipment?.imageSrc || "none"}.`);
  }
  if (!serviceWorker.includes(equipment.imageSrc)) {
    throw new Error(`${equipmentId} image should be included in the service worker cache.`);
  }
}

function assertEquipmentImageMapping() {
  const equipmentById = Object.fromEntries(EQUIPMENT.map((item) => [item.id, item]));
  const requiredMappings = {
    "smith-machine": "visual--smith-machine",
    "leg-extension-curl": "visual--leg-extension-curl",
    "hip-thrust": "visual--hip-thrust",
    "leg-press": "visual--leg-press",
    "cable-station": "visual--cable-station",
    "dumbbell-rack": "visual--dumbbell-rack"
  };

  for (const [equipmentId, expectedClass] of Object.entries(requiredMappings)) {
    if (equipmentById[equipmentId]?.imageClass !== expectedClass) {
      throw new Error(`${equipmentId} should use ${expectedClass}, got ${equipmentById[equipmentId]?.imageClass}.`);
    }
  }
}

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

  const mismatchedStrengthImages = plan.workouts
    .flatMap((workout) => workout.exercises.map((exercise) => ({
      workout: workout.title,
      exercise: exercise.name,
      equipmentId: exercise.equipmentId,
      type: exercise.type,
      imageClass: EQUIPMENT_BY_ID[exercise.equipmentId]?.imageClass,
      imageSrc: EQUIPMENT_BY_ID[exercise.equipmentId]?.imageSrc
    })))
    .filter((item) => item.type === "strength" && item.imageClass === "visual--treadmill");

  if (mismatchedStrengthImages.length) {
    throw new Error(`${label} maps strength exercises to treadmill imagery: ${JSON.stringify(mismatchedStrengthImages)}`);
  }

  const missingImages = plan.workouts
    .flatMap((workout) => workout.exercises.map((exercise) => ({
      workout: workout.title,
      exercise: exercise.name,
      equipmentId: exercise.equipmentId,
      imageSrc: EQUIPMENT_BY_ID[exercise.equipmentId]?.imageSrc
    })))
    .filter((item) => !item.imageSrc || !existsSync(item.imageSrc.replace(/^\//, "")));

  if (missingImages.length) {
    throw new Error(`${label} references equipment without a real image file: ${JSON.stringify(missingImages)}`);
  }
}

assertEquipmentImageMapping();

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

const historicalLoadValue = Number(String(historicalLoad.shortLabel).match(/\d+(?:\.\d+)?/)?.[0] || 0);
if (historicalLoadValue > 22) {
  throw new Error(`Historical load increase should stay within 10%, got ${historicalLoad.shortLabel} from 20kg.`);
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

const invalidAssessment = validateAssessment({
  ...focusAssessment,
  bodyFat: 2
});

if (invalidAssessment.valid) {
  throw new Error("Body fat below the safe input range should be rejected.");
}

const invalidPlan = generateCoachPlan({
  ...focusAssessment,
  weight: 20
});

if (!invalidPlan.validationHold || !invalidPlan.safetyHold) {
  throw new Error("Invalid assessment input should not generate a usable plan.");
}

const muscularLeanPlan = generateCoachPlan({
  gender: "male",
  age: 32,
  height: 170,
  weight: 85,
  bodyFat: 14,
  trainingExperience: "years",
  targetPreference: "gain",
  weeklyLimit: "coach",
  sessionBudget: 75,
  injury: "none",
  focusAreas: ["chest", "back"]
});

if (muscularLeanPlan.goal.type !== "精益增肌期" || muscularLeanPlan.metrics.bodyStatusSource !== "bodyFat") {
  throw new Error(`Valid low body fat should drive gain judgement before BMI, got ${muscularLeanPlan.goal.type}/${muscularLeanPlan.metrics.bodyStatusSource}.`);
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
  const weekThreeDuration = getWorkoutDuration(tightWorkout, 3, tightBudgetPlan.weeks);
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

if (roomyBudgetPlan.duration.progressionLabel !== "55-75 分钟") {
  throw new Error(`75-minute hypertrophy plan should use the available session budget, got ${roomyBudgetPlan.duration.progressionLabel}.`);
}

if (roomyBudgetPlan.weeks[3]?.label !== "减载复盘周") {
  throw new Error("Experienced lifters should receive a week 4 deload rule.");
}

const roomyWeekThreeMax = Math.max(...roomyBudgetPlan.workouts.map((item) => getWorkoutDuration(item, 3, roomyBudgetPlan.weeks).max));
const roomyWeekFourMax = Math.max(...roomyBudgetPlan.workouts.map((item) => getWorkoutDuration(item, 4, roomyBudgetPlan.weeks).max));

if (roomyWeekFourMax >= roomyWeekThreeMax) {
  throw new Error(`Week 4 deload should reduce duration/volume, got week3=${roomyWeekThreeMax} week4=${roomyWeekFourMax}.`);
}

const tightWeekThreeMax = Math.max(...tightBudgetPlan.workouts.map((item) => getWorkoutDuration(item, 3, tightBudgetPlan.weeks).max));

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

const hardTrendPlan = generateCoachPlan({
  ...twiceWeeklyPlan.validation.normalized,
  weeklyLimit: "2"
}, [
  { intensityFeedback: "too-hard", completedCount: 3, exercises: [{ feeling: 6, done: true }] },
  { intensityFeedback: "too-hard", completedCount: 3, exercises: [{ feeling: 7, done: true }] }
]);

if (hardTrendPlan.frequency.sessionsPerWeek !== 2 || hardTrendPlan.review.status !== "overloaded") {
  throw new Error("Rolling overload trend should lower capacity without breaking the weekly limit of 2.");
}

const singleHardPlan = generateCoachPlan(focusAssessment, [
  { intensityFeedback: "too-hard", completedCount: 3, exercises: [{ feeling: 7, done: true }] }
]);

if (singleHardPlan.review.status === "overloaded") {
  throw new Error("A single hard workout should not trigger plan-wide overload adjustment.");
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
