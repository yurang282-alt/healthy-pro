const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  DATA_EXPORT_SCHEMA,
  buildPortableDataExport,
  formatDeletionFailure,
  formatDeletionPreview,
  getDataDeletionLockKey,
  isDeletionComplete
} = require("../healthy-pro-weapp/utils/data-rights");
const {
  countUniqueAcrossPages,
  executeDeletion
} = require("../healthy-pro-weapp/cloudfunctions/dataRights/deletion-core");

const privateOpenid = "o-private-user-123";
const friendOpenid = "o-private-friend-456";
const exported = buildPortableDataExport({
  user: {
    id: `weapp-${privateOpenid}`,
    openid: privateOpenid,
    assessment: { age: 28, weight: 65, bodyFat: 14 },
    plan: { id: "plan-1", workouts: [{ id: "legs", title: "腿部" }] }
  },
  cloud: { openid: privateOpenid, envId: "private-env" },
  profile: { nickname: "测试用户", mode: "cloud" },
  trainingExecution: { nextWorkoutId: "legs" },
  logs: [{ id: "log-1", workoutTitle: "腿部", note: "动作稳定" }],
  bodyLogs: [{ id: "body-1", weight: 65 }],
  feedbacks: [{ id: "feedback-1", content: "测试反馈" }],
  social: {
    friendProfile: { nickname: "测试用户", friendCode: "HPTEST01" },
    friendships: [{
      id: `friendship_${privateOpenid}_${friendOpenid}`,
      openid: friendOpenid,
      nickname: "训练伙伴",
      status: "accepted",
      direction: "incoming",
      currentWeekCount: 2
    }]
  }
}, "2026-08-05T10:30:00+08:00");

assert.equal(exported.schema, DATA_EXPORT_SCHEMA);
assert.equal(exported.trainingLogs.length, 1);
assert.equal(exported.bodyLogs.length, 1);
assert.equal(exported.feedbacks.length, 1);
assert.equal(exported.friendships[0].nickname, "训练伙伴");
assert.equal(exported.friendships[0].id, undefined);
assert.equal(exported.friendships[0].openid, undefined);

const serialized = JSON.stringify(exported);
assert.equal(serialized.includes(privateOpenid), false, "export should not expose the raw account openid");
assert.equal(serialized.includes(friendOpenid), false, "export should not expose a friend's raw openid");
assert.equal(serialized.includes("private-env"), false, "export should not expose internal cloud configuration");
assert.match(formatDeletionPreview({ plans: 1, trainingLogs: 12, feedbacks: 2, friendships: 1 }), /训练记录 12 条/);
assert.match(formatDeletionFailure({ remaining: { trainingLogs: 2 }, errors: [] }), /训练记录 2 条/);
assert.equal(getDataDeletionLockKey(privateOpenid), `healthyProDataDeletionLock:${privateOpenid}`);
assert.equal(isDeletionComplete({ complete: true, remaining: { users: 0, plans: 0 } }), true);
assert.equal(isDeletionComplete({ complete: true, remaining: null }), false);

const root = path.resolve(__dirname, "..");
const appJson = JSON.parse(fs.readFileSync(path.join(root, "healthy-pro-weapp/app.json"), "utf8"));
const profileSource = fs.readFileSync(path.join(root, "healthy-pro-weapp/pages/profile/profile.wxml"), "utf8");
const assessmentSource = fs.readFileSync(path.join(root, "healthy-pro-weapp/pages/assessment/assessment.wxml"), "utf8");
const cloudSource = fs.readFileSync(path.join(root, "healthy-pro-weapp/cloudfunctions/dataRights/index.js"), "utf8");
const appSource = fs.readFileSync(path.join(root, "healthy-pro-weapp/app.js"), "utf8");
const dataRightsPageSource = fs.readFileSync(path.join(root, "healthy-pro-weapp/pages/data-rights/data-rights.js"), "utf8");

assert.ok(appJson.pages.includes("pages/data-rights/data-rights"));
assert.match(profileSource, /数据与隐私/);
assert.match(assessmentSource, /不作为医疗诊断/);
assert.match(cloudSource, /cloud\.getWXContext\(\)/);
assert.match(cloudSource, /event\.action === "previewDeletion"/);
assert.match(cloudSource, /event\.action === "deleteOwnData"/);
assert.doesNotMatch(cloudSource, /event\.openid/);
[
  "users",
  "plans",
  "training_logs",
  "feedbacks",
  "feedback",
  "friendships"
].forEach((collection) => assert.ok(cloudSource.includes(`\"${collection}\"`), `missing deletion coverage for ${collection}`));

const lockWriteIndex = appSource.indexOf("wx.setStorageSync(lockKey");
const cloudDeleteIndex = appSource.indexOf("await deleteCloudUserData()");
const emptyStoreIndex = appSource.indexOf("this.setStore(nextStore, { sync: false, touch: false })", cloudDeleteIndex);
const lockRemovalIndex = appSource.indexOf("wx.removeStorageSync(lockKey)", cloudDeleteIndex);
assert.ok(lockWriteIndex >= 0 && lockWriteIndex < cloudDeleteIndex, "persistent deletion lock must be written before cloud deletion");
assert.ok(emptyStoreIndex > cloudDeleteIndex && emptyStoreIndex < lockRemovalIndex, "empty local profile must be stored before deletion lock is removed");
assert.match(appSource, /this\.cloudSyncBlocked = Boolean\(deletionLock\)/);
assert.match(appSource, /if \(deletionLock\) return this\.getStore\(\)/);
assert.doesNotMatch(dataRightsPageSource, /原本机数据仍保留/);

async function checkRetryableDeletion() {
  const state = { trainingLogs: 1, plans: 1 };
  let failPlans = true;
  const operations = [
    {
      key: "trainingLogs",
      run: async () => {
        const removed = state.trainingLogs;
        state.trainingLogs = 0;
        return removed;
      }
    },
    {
      key: "plans",
      run: async () => {
        if (failPlans) throw new Error("temporary failure");
        const removed = state.plans;
        state.plans = 0;
        return removed;
      }
    }
  ];
  const readRemaining = async () => ({ ...state });

  const firstAttempt = await executeDeletion(operations, readRemaining);
  assert.equal(firstAttempt.complete, false);
  assert.equal(firstAttempt.partial, true);
  assert.equal(firstAttempt.deleted.trainingLogs, 1);
  assert.equal(firstAttempt.remaining.plans, 1);
  assert.equal(firstAttempt.errors[0].key, "plans");

  failPlans = false;
  const retry = await executeDeletion(operations, readRemaining);
  assert.equal(retry.complete, true);
  assert.deepEqual(retry.remaining, { trainingLogs: 0, plans: 0 });
  assert.equal(retry.deleted.trainingLogs, 0, "retries must tolerate data already removed by a partial attempt");
  assert.equal(retry.deleted.plans, 1);

  const repeatedSuccess = await executeDeletion(operations, readRemaining);
  assert.equal(repeatedSuccess.complete, true, "a completed deletion must remain safe to retry");
  assert.deepEqual(repeatedSuccess.deleted, { trainingLogs: 0, plans: 0 });
}

async function checkPreviewPagination() {
  const records = Array.from({ length: 235 }, (_, index) => ({ _id: `record-${index + 1}` }));
  const count = await countUniqueAcrossPages([
    async (offset, limit) => records.slice(offset, offset + limit)
  ], 100);
  assert.equal(count, 235, "privacy preview must count every record beyond the first 100");

  const sent = records.slice(0, 135);
  const received = records.slice(120);
  const uniqueFriendships = await countUniqueAcrossPages([
    async (offset, limit) => sent.slice(offset, offset + limit),
    async (offset, limit) => received.slice(offset, offset + limit)
  ], 100);
  assert.equal(uniqueFriendships, 235, "friendship preview must count both directions without double counting overlap");
}

Promise.all([checkRetryableDeletion(), checkPreviewPagination()])
  .then(() => console.log("Healthy Pro WeApp data rights check passed."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
