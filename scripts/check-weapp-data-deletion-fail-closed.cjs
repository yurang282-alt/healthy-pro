const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
const {
  getDataDeletionLockKey
} = require("../healthy-pro-weapp/utils/data-rights");

const appPath = path.resolve(__dirname, "../healthy-pro-weapp/app.js");
const openid = "o-fail-closed-test";
const legacyKey = "healthyProStore";
const scopedKey = `healthyProStore:user:${openid}`;
const lockKey = getDataDeletionLockKey(openid);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createStore() {
  return {
    user: {
      id: `weapp-${openid}`,
      openid,
      assessment: { age: 30, weight: 65 },
      plan: { id: "plan-test", workouts: [] },
      needsAssessment: false
    },
    logs: [{ id: "log-test" }],
    bodyLogs: [{ id: "body-test", weight: 65 }],
    feedbacks: [{ id: "feedback-test" }],
    releaseReads: {},
    onboarding: {},
    trainingExecution: null,
    social: null,
    profile: {
      nickname: "测试用户",
      mode: "cloud",
      modeLabel: "云端",
      cloudReady: true,
      syncStatus: "synced",
      syncMessage: "云端数据已同步",
      lastSyncedAt: ""
    },
    cloud: {
      envId: "test-env",
      openid,
      userDocId: `user_${openid}`,
      enabled: true,
      lastPulledAt: "",
      lastPushedAt: "",
      localUpdatedAt: "2026-08-05T10:30:00.000Z",
      error: ""
    }
  };
}

function createHarness(options = {}) {
  const storage = options.storage || new Map([
    [legacyKey, clone(createStore())],
    [scopedKey, clone(createStore())],
    [`healthyProTrainingDraft:${openid}:workout:1`, { draft: true }],
    [`healthyProBodyDraft:${openid}`, { draft: true }]
  ]);
  const state = {
    failMode: options.failMode || "",
    deleteResult: options.deleteResult || {
      complete: true,
      partial: false,
      deleted: { users: 1 },
      remaining: { users: 0, plans: 0, trainingLogs: 0, feedbacks: 0, friendships: 0 },
      errors: []
    }
  };
  const calls = {
    deleteCloudUserData: 0,
    readCloudStore: 0,
    writeCloudStore: 0,
    writeCloudLog: 0,
    writeCloudFeedback: 0,
    sendCloudFriendRequest: 0,
    respondCloudFriendship: 0,
    deleteCloudFriendship: 0
  };

  const cloudMock = {
    APP_ID: "test-app",
    CLOUD_ENV_ID: "test-env",
    deleteCloudUserData: async () => {
      calls.deleteCloudUserData += 1;
      return clone(state.deleteResult);
    },
    deleteCloudFriendship: async () => { calls.deleteCloudFriendship += 1; },
    getCloudIdentity: async () => ({ openid }),
    initCloud: () => true,
    previewCloudDataDeletion: async () => ({}),
    readCloudSocial: async () => ({}),
    readCloudStore: async () => {
      calls.readCloudStore += 1;
      return null;
    },
    respondCloudFriendship: async () => { calls.respondCloudFriendship += 1; },
    sendCloudFriendRequest: async () => { calls.sendCloudFriendRequest += 1; },
    userDocId: (value) => `user_${value}`,
    writeCloudFeedback: async () => { calls.writeCloudFeedback += 1; },
    writeCloudLog: async () => { calls.writeCloudLog += 1; },
    writeCloudStore: async () => {
      calls.writeCloudStore += 1;
      return { userDocId: `user_${openid}`, updatedAt: new Date().toISOString() };
    }
  };

  const wxMock = {
    getStorageInfoSync: () => ({ keys: Array.from(storage.keys()) }),
    getStorageSync: (key) => storage.get(key),
    removeStorageSync: (key) => {
      if (state.failMode === "removeStorage" && key === legacyKey) {
        throw new Error("simulated removeStorageSync failure");
      }
      storage.delete(key);
    },
    setStorageSync: (key, value) => {
      const isFreshEmptyStore = key === scopedKey && value && value.user && value.user.assessment === null;
      if (state.failMode === "setStore" && isFreshEmptyStore && storage.has(lockKey)) {
        throw new Error("simulated setStore failure");
      }
      storage.set(key, clone(value));
    }
  };

  const originalLoad = Module._load;
  const originalApp = global.App;
  const originalWx = global.wx;
  let appConfig = null;

  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === "./utils/cloud" && parent && parent.filename === appPath) return cloudMock;
    return originalLoad.call(this, request, parent, isMain);
  };
  global.App = (config) => { appConfig = config; };
  global.wx = wxMock;
  delete require.cache[appPath];
  try {
    require(appPath);
  } finally {
    Module._load = originalLoad;
    global.App = originalApp;
    global.wx = originalWx;
  }

  global.wx = wxMock;
  appConfig.whenCloudReady = async () => appConfig.getStore();

  return {
    app: appConfig,
    calls,
    state,
    storage,
    restoreGlobals() {
      global.wx = originalWx;
    }
  };
}

async function assertCloudWritesStayBlocked(harness) {
  const { app, calls } = harness;
  app.scheduleCloudSync();
  await app.pushCloudStore({ mirrorLogs: true });
  await app.syncTrainingLog({ id: "new-log" });
  await app.syncFeedback({ id: "new-feedback" });
  await assert.rejects(() => app.syncCloudNow(), /数据删除尚未完成/);
  await assert.rejects(() => app.addCloudFriendByCode("HPTEST"), /数据删除尚未完成/);
  await assert.rejects(() => app.respondCloudFriendship("friendship-1", "accepted"), /数据删除尚未完成/);
  await assert.rejects(() => app.removeCloudFriendship("friendship-1"), /数据删除尚未完成/);

  assert.equal(calls.writeCloudStore, 0);
  assert.equal(calls.writeCloudLog, 0);
  assert.equal(calls.writeCloudFeedback, 0);
  assert.equal(calls.sendCloudFriendRequest, 0);
  assert.equal(calls.respondCloudFriendship, 0);
  assert.equal(calls.deleteCloudFriendship, 0);
}

async function checkPartialCloudDeletion() {
  const harness = createHarness({
    deleteResult: {
      complete: false,
      partial: true,
      deleted: { trainingLogs: 1, plans: 0 },
      remaining: { users: 1, plans: 1, trainingLogs: 0, feedbacks: 0, friendships: 0 },
      errors: [{ key: "plans", message: "temporary failure" }]
    }
  });
  const before = clone(harness.storage.get(scopedKey));

  await assert.rejects(
    () => harness.app.deleteCurrentUserData(),
    (error) => error && error.code === "CLOUD_DELETE_PARTIAL"
  );
  assert.deepEqual(harness.storage.get(scopedKey), before, "partial cloud deletion must not clear local user data");
  assert.ok(harness.storage.has(lockKey), "partial cloud deletion must retain the persistent lock");
  assert.equal(harness.app.cloudSyncBlocked, true);
  await assertCloudWritesStayBlocked(harness);
  harness.restoreGlobals();
}

async function checkLocalFailure(failMode) {
  const harness = createHarness({ failMode });
  await assert.rejects(
    () => harness.app.deleteCurrentUserData(),
    (error) => error && error.code === "LOCAL_DELETE_PENDING"
  );
  assert.ok(harness.storage.has(lockKey), `${failMode} must retain the persistent lock`);
  assert.equal(harness.app.cloudSyncBlocked, true);
  await assertCloudWritesStayBlocked(harness);

  harness.state.failMode = "";
  harness.restoreGlobals();
  const restarted = createHarness({ storage: harness.storage });
  await restarted.app.bootstrapCloud();
  assert.equal(restarted.app.cloudSyncBlocked, true, "bootstrap must restore the deletion lock after restart");
  assert.equal(restarted.calls.readCloudStore, 0, "bootstrap must not pull potentially stale cloud data while deletion is locked");
  assert.equal(restarted.calls.writeCloudStore, 0, "bootstrap must not repopulate cloud data while deletion is locked");
  restarted.restoreGlobals();
}

async function main() {
  await checkPartialCloudDeletion();
  await checkLocalFailure("setStore");
  await checkLocalFailure("removeStorage");
  console.log("Healthy Pro WeApp data deletion fail-closed check passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
