const {
  createDemoUser,
  decoratePlanForWeapp,
  generatePlan,
  getCurrentWeek,
  getNextWorkout,
  normalizeAssessment,
  shouldRegeneratePlan
} = require("./utils/coach");
const {
  APP_ID,
  CLOUD_ENV_ID,
  getCloudIdentity,
  initCloud,
  readCloudStore,
  userDocId,
  writeCloudLog,
  writeCloudStore
} = require("./utils/cloud");

const STORAGE_KEY = "healthyProStore";

App({
  globalData: {
    appName: "Healthy Pro",
    appId: APP_ID,
    cloudEnvId: CLOUD_ENV_ID
  },

  onLaunch() {
    this.ensureStore();
  },

  cloudReadyPromise: null,
  cloudSyncTimer: null,
  cloudSyncing: false,
  cloudIdentity: null,

  createDefaultStore() {
    return {
      user: createDemoUser(),
      logs: [],
      bodyLogs: [],
      feedbacks: [],
      profile: {
        nickname: "微信用户",
        mode: "local",
        modeLabel: "本地",
        cloudReady: false,
        syncStatus: "local",
        syncMessage: "本地数据运行中",
        lastSyncedAt: ""
      },
      cloud: {
        envId: CLOUD_ENV_ID,
        openid: "",
        userDocId: "",
        enabled: false,
        lastPulledAt: "",
        lastPushedAt: "",
        localUpdatedAt: new Date().toISOString(),
        error: ""
      }
    };
  },

  isUsableStore(store) {
    return Boolean(
      store &&
      store.user &&
      store.user.plan &&
      Array.isArray(store.user.plan.workouts) &&
      store.user.plan.workouts.length &&
      Array.isArray(store.logs)
    );
  },

  migrateStore(store) {
    if (!this.isUsableStore(store)) return store;
    const assessment = normalizeAssessment(store.user.assessment || {});
    store.user.assessment = assessment;
    store.logs = (store.logs || []).map((log) => ({
      ...log,
      intensityFeedback: log.intensityFeedback || (log.feeling === "easy" ? "too-easy" : log.feeling === "hard" ? "too-hard" : "right"),
      exercises: Array.isArray(log.exercises) ? log.exercises : []
    }));
    store.feedbacks = Array.isArray(store.feedbacks) ? store.feedbacks : [];
    if (shouldRegeneratePlan(store.user.plan)) {
      store.user.plan = generatePlan(assessment, store.logs);
    } else {
      store.user.plan = decoratePlanForWeapp(store.user.plan, {
        assessment,
        logs: store.logs,
        week: getCurrentWeek(store.user.plan, store.logs)
      });
    }
    store.bodyLogs = Array.isArray(store.bodyLogs) ? store.bodyLogs : [];
    store.profile = {
      nickname: "微信用户",
      mode: "local",
      modeLabel: "本地",
      cloudReady: false,
      syncStatus: "local",
      syncMessage: "本地数据运行中",
      lastSyncedAt: "",
      ...(store.profile || {})
    };
    store.cloud = {
      envId: CLOUD_ENV_ID,
      openid: "",
      userDocId: "",
      enabled: false,
      lastPulledAt: "",
      lastPushedAt: "",
      localUpdatedAt: new Date().toISOString(),
      error: "",
      ...(store.cloud || {})
    };
    return store;
  },

  ensureStore() {
    const store = wx.getStorageSync(STORAGE_KEY);
    if (this.isUsableStore(store)) {
      const migratedStore = this.migrateStore(store);
      wx.setStorageSync(STORAGE_KEY, migratedStore);
      return migratedStore;
    }

    const nextStore = this.createDefaultStore();
    wx.setStorageSync(STORAGE_KEY, nextStore);
    return nextStore;
  },

  getStore() {
    return this.ensureStore();
  },

  setStore(nextStore, options = {}) {
    const store = this.migrateStore(nextStore);
    if (options.touch !== false) {
      store.cloud.localUpdatedAt = new Date().toISOString();
    }
    wx.setStorageSync(STORAGE_KEY, store);
    if (options.sync !== false) {
      this.scheduleCloudSync();
    }
  },

  updateUser(partial) {
    const store = this.getStore();
    store.user = {
      ...store.user,
      ...partial
    };
    this.setStore(store);
    return store.user;
  },

  resetDemo() {
    const current = this.getStore();
    const nextStore = this.createDefaultStore();
    nextStore.cloud = {
      ...(nextStore.cloud || {}),
      openid: current.cloud && current.cloud.openid,
      userDocId: current.cloud && current.cloud.userDocId,
      enabled: Boolean(current.cloud && current.cloud.enabled),
      envId: CLOUD_ENV_ID
    };
    nextStore.profile = {
      ...(nextStore.profile || {}),
      mode: nextStore.cloud.enabled ? "cloud" : "local",
      modeLabel: nextStore.cloud.enabled ? "云端" : "本地",
      cloudReady: Boolean(nextStore.cloud.enabled),
      syncStatus: nextStore.cloud.enabled ? "syncing" : "local",
      syncMessage: nextStore.cloud.enabled ? "正在同步重置后的数据" : "本地数据已重置"
    };
    this.setStore(nextStore);
  },

  getTrainingContext() {
    const store = this.getStore();
    const week = getCurrentWeek(store.user.plan, store.logs);
    const plan = decoratePlanForWeapp(store.user.plan, {
      assessment: store.user.assessment,
      logs: store.logs,
      week
    });
    return {
      ...store,
      user: {
        ...store.user,
        plan
      },
      week,
      workout: getNextWorkout(plan, store.logs)
    };
  },

  markCloudStatus(patch) {
    const store = this.getStore();
    store.profile = {
      ...(store.profile || {}),
      ...patch
    };
    this.setStore(store, { sync: false, touch: false });
  },

  shouldUseCloudStore(localStore, cloudRecord) {
    if (!cloudRecord || !cloudRecord.store) return false;
    if (!localStore.cloud || !localStore.cloud.userDocId) return true;
    const cloudUpdatedAt = Date.parse(cloudRecord.updatedAt || "");
    const localUpdatedAt = Date.parse(localStore.cloud.localUpdatedAt || "");
    if (!localUpdatedAt) return true;
    if (!cloudUpdatedAt) return false;
    return cloudUpdatedAt >= localUpdatedAt;
  },

  async bootstrapCloud() {
    if (!initCloud()) {
      this.markCloudStatus({
        mode: "local",
        modeLabel: "本地",
        cloudReady: false,
        syncStatus: "unavailable",
        syncMessage: "当前环境暂不支持云开发"
      });
      return this.getStore();
    }

    try {
      this.markCloudStatus({
        mode: "cloud",
        modeLabel: "云端",
        cloudReady: false,
        syncStatus: "connecting",
        syncMessage: "正在连接微信云"
      });

      const identity = await getCloudIdentity();
      this.cloudIdentity = identity;
      const currentStore = this.getStore();
      const hadCloudBinding = Boolean(currentStore.cloud && currentStore.cloud.userDocId);
      currentStore.cloud = {
        ...(currentStore.cloud || {}),
        envId: CLOUD_ENV_ID,
        openid: identity.openid,
        userDocId: userDocId(identity.openid),
        enabled: true,
        error: ""
      };
      currentStore.user = {
        ...(currentStore.user || {}),
        openid: identity.openid
      };
      currentStore.profile = {
        ...(currentStore.profile || {}),
        mode: "cloud",
        modeLabel: "云端",
        cloudReady: true,
        syncStatus: "connecting",
        syncMessage: "正在读取云端数据"
      };
      this.setStore(currentStore, { sync: false, touch: false });

      const cloudRecord = await readCloudStore(identity.openid);
      const localStore = this.getStore();
      if (cloudRecord && (!hadCloudBinding || this.shouldUseCloudStore(localStore, cloudRecord))) {
        const nextStore = this.migrateStore(cloudRecord.store);
        nextStore.cloud = {
          ...(nextStore.cloud || {}),
          envId: CLOUD_ENV_ID,
          openid: identity.openid,
          userDocId: userDocId(identity.openid),
          enabled: true,
          lastPulledAt: new Date().toISOString(),
          localUpdatedAt: cloudRecord.updatedAt || new Date().toISOString(),
          error: ""
        };
        nextStore.user = {
          ...(nextStore.user || {}),
          openid: identity.openid
        };
        nextStore.profile = {
          ...(nextStore.profile || {}),
          mode: "cloud",
          modeLabel: "云端",
          cloudReady: true,
          syncStatus: "synced",
          syncMessage: "云端数据已同步",
          lastSyncedAt: cloudRecord.updatedAt || new Date().toISOString()
        };
        this.setStore(nextStore, { sync: false, touch: false });
      } else {
        await this.pushCloudStore({ mirrorLogs: false });
      }
    } catch (error) {
      this.markCloudStatus({
        mode: "local",
        modeLabel: "本地",
        cloudReady: false,
        syncStatus: "error",
        syncMessage: "云端连接失败，本地数据仍可使用",
        error: error && (error.errMsg || error.message) || "unknown error"
      });
    }
    return this.getStore();
  },

  whenCloudReady() {
    if (!this.cloudReadyPromise) {
      this.cloudReadyPromise = this.bootstrapCloud();
    }
    return this.cloudReadyPromise.catch(() => this.getStore());
  },

  scheduleCloudSync() {
    const store = this.getStore();
    if (!store.cloud || !store.cloud.enabled || !store.cloud.openid) return;
    clearTimeout(this.cloudSyncTimer);
    this.cloudSyncTimer = setTimeout(() => {
      this.pushCloudStore({ mirrorLogs: false });
    }, 700);
  },

  async pushCloudStore(options = {}) {
    const store = this.getStore();
    const openid = store.cloud && store.cloud.openid;
    if (!openid || this.cloudSyncing) return store;

    this.cloudSyncing = true;
    try {
      this.markCloudStatus({
        mode: "cloud",
        modeLabel: "云端",
        cloudReady: true,
        syncStatus: "syncing",
        syncMessage: "正在同步云端"
      });
      const result = await writeCloudStore(this.getStore(), { openid }, options);
      const nextStore = this.getStore();
      nextStore.cloud = {
        ...(nextStore.cloud || {}),
        enabled: true,
        envId: CLOUD_ENV_ID,
        openid,
        userDocId: result.userDocId,
        lastPushedAt: result.updatedAt,
        localUpdatedAt: result.updatedAt,
        error: ""
      };
      nextStore.profile = {
        ...(nextStore.profile || {}),
        mode: "cloud",
        modeLabel: "云端",
        cloudReady: true,
        syncStatus: "synced",
        syncMessage: "云端数据已同步",
        lastSyncedAt: result.updatedAt,
        error: ""
      };
      this.setStore(nextStore, { sync: false, touch: false });
      return nextStore;
    } catch (error) {
      this.markCloudStatus({
        mode: "cloud",
        modeLabel: "云端",
        cloudReady: true,
        syncStatus: "error",
        syncMessage: "云端同步失败，本地已保存",
        error: error && (error.errMsg || error.message) || "unknown error"
      });
      return this.getStore();
    } finally {
      this.cloudSyncing = false;
    }
  },

  async syncCloudNow() {
    await this.whenCloudReady();
    return this.pushCloudStore({ mirrorLogs: true });
  },

  async syncTrainingLog(log) {
    try {
      await this.whenCloudReady();
      const store = this.getStore();
      const openid = store.cloud && store.cloud.openid;
      if (!openid) return;
      await writeCloudLog(log, { openid });
    } catch (error) {
      const store = this.getStore();
      store.cloud = {
        ...(store.cloud || {}),
        error: error && (error.errMsg || error.message) || "unknown error"
      };
      this.setStore(store, { sync: false, touch: false });
    }
  }
});
