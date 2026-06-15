const { createDemoUser, getCurrentWeek, getNextWorkout } = require("./utils/coach");

App({
  globalData: {
    appName: "Healthy Pro",
    appId: "wx23c667125f5dae35",
    cloudEnvId: ""
  },

  onLaunch() {
    this.ensureStore();
  },

  createDefaultStore() {
    return {
      user: createDemoUser(),
      logs: [],
      bodyLogs: [],
      profile: {
        nickname: "微信用户",
        mode: "mock",
        cloudReady: false
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

  ensureStore() {
    const store = wx.getStorageSync("healthyProStore");
    if (this.isUsableStore(store)) return store;

    const nextStore = this.createDefaultStore();
    wx.setStorageSync("healthyProStore", nextStore);
    return nextStore;
  },

  getStore() {
    return this.ensureStore();
  },

  setStore(nextStore) {
    wx.setStorageSync("healthyProStore", nextStore);
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
    wx.setStorageSync("healthyProStore", this.createDefaultStore());
  },

  getTrainingContext() {
    const store = this.getStore();
    const plan = store.user.plan;
    return {
      ...store,
      week: getCurrentWeek(plan, store.logs),
      workout: getNextWorkout(plan, store.logs)
    };
  }
});
