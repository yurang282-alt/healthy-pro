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
  deleteCloudFriendship,
  getCloudIdentity,
  initCloud,
  readCloudSocial,
  readCloudStore,
  respondCloudFriendship,
  sendCloudFriendRequest,
  userDocId,
  writeCloudLog,
  writeCloudStore
} = require("./utils/cloud");

const STORAGE_KEY = "healthyProStore";

function hashText(value) {
  return String(value || "").split("").reduce((hash, char) => {
    const nextHash = ((hash << 5) - hash) + char.charCodeAt(0);
    return nextHash | 0;
  }, 0);
}

function createFriendCode(source) {
  const hash = Math.abs(hashText(source || `local_${Date.now()}`));
  return `HP${hash.toString(36).toUpperCase().padStart(6, "0").slice(-6)}`;
}

function getStartOfLocalWeek(now = new Date()) {
  const date = new Date(now);
  const day = date.getDay() || 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day + 1);
  return date;
}

function getWeekKey(dateValue) {
  const date = new Date(dateValue);
  const start = getStartOfLocalWeek(date);
  return `${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}`;
}

function getCurrentTrainingWeekStreak(logs = [], now = new Date()) {
  if (!logs.length) return 0;
  const weeks = new Set(logs.map((log) => getWeekKey(log.createdAt)));
  let streak = 0;
  const cursor = getStartOfLocalWeek(now);
  while (weeks.has(getWeekKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

function buildSocialSummary(store) {
  const logs = Array.isArray(store.logs) ? store.logs : [];
  const now = new Date();
  const weekStart = getStartOfLocalWeek(now);
  const currentWeekLogs = logs.filter((log) => {
    const createdAt = new Date(log.createdAt);
    return createdAt >= weekStart && createdAt <= now;
  });
  const target = Number(store.user && store.user.plan && store.user.plan.frequency && store.user.plan.frequency.sessionsPerWeek || 0);
  const completed = currentWeekLogs.reduce((sum, log) => sum + Number(log.completedCount || 0), 0);
  return {
    currentWeekCount: currentWeekLogs.length,
    currentWeekCompleted: completed,
    currentWeekCompletionRate: target ? Math.min(100, Math.round((currentWeekLogs.length / target) * 100)) : 0,
    weekTarget: target,
    streakWeeks: getCurrentTrainingWeekStreak(logs, now),
    latestTrainingAt: logs.length ? logs[logs.length - 1].createdAt || "" : "",
    updatedAt: now.toISOString()
  };
}

function ensureSocialStore(store) {
  const social = store.social || {};
  const localUserId = social.localUserId || `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const profile = store.profile || {};
  const existingProfile = social.friendProfile || {};
  const friendCode = existingProfile.friendCode || createFriendCode(store.cloud && store.cloud.openid || localUserId);
  store.social = {
    localUserId,
    friendProfile: {
      nickname: existingProfile.nickname || profile.nickname || "微信用户",
      friendCode,
      shareLeaderboard: existingProfile.shareLeaderboard !== false,
      shareWeeklySummary: existingProfile.shareWeeklySummary !== false
    },
    friendships: Array.isArray(social.friendships) ? social.friendships : [],
    leaderboard: Array.isArray(social.leaderboard) ? social.leaderboard : [],
    summary: buildSocialSummary(store),
    lastSyncedAt: social.lastSyncedAt || ""
  };
  return store.social;
}

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
      releaseReads: {},
      social: null,
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
    store.releaseReads = store.releaseReads || {};
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
    ensureSocialStore(store);
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
    ensureSocialStore(store);
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
  },

  async refreshCloudSocial() {
    await this.whenCloudReady();
    const store = this.getStore();
    const openid = store.cloud && store.cloud.openid;
    if (!openid) return store.social || null;
    const social = await readCloudSocial(openid, store);
    const nextStore = this.getStore();
    nextStore.social = {
      ...(nextStore.social || {}),
      ...social
    };
    this.setStore(nextStore, { sync: false, touch: false });
    return nextStore.social;
  },

  async addCloudFriendByCode(friendCode) {
    await this.whenCloudReady();
    const store = this.getStore();
    const openid = store.cloud && store.cloud.openid;
    if (!openid) throw new Error("微信云未连接");
    await this.pushCloudStore({ mirrorLogs: false });
    await sendCloudFriendRequest(friendCode, this.getStore(), { openid });
    return this.refreshCloudSocial();
  },

  async respondCloudFriendship(friendshipId, status) {
    await this.whenCloudReady();
    await respondCloudFriendship(friendshipId, status);
    return this.refreshCloudSocial();
  },

  async removeCloudFriendship(friendshipId) {
    await this.whenCloudReady();
    await deleteCloudFriendship(friendshipId);
    return this.refreshCloudSocial();
  }
});
