Page({
  data: {
    user: null,
    profile: null,
    logs: [],
    completionRate: 0
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const app = getApp();
    const store = app.getStore();
    const target = Number((store.user.plan && store.user.plan.frequency && store.user.plan.frequency.sessionsPerWeek) || 0);
    const count = store.logs.length;
    this.setData({
      user: store.user,
      profile: store.profile,
      logs: store.logs,
      completionRate: target ? Math.min(100, Math.round((count / target) * 100)) : 0
    });
  },

  goAssessment() {
    wx.navigateTo({ url: "/pages/assessment/assessment" });
  },

  resetDemo() {
    const app = getApp();
    app.resetDemo();
    this.refresh();
    wx.showToast({ title: "已重置", icon: "success" });
  },

  mockLogin() {
    wx.showModal({
      title: "微信登录待接入",
      content: "等你开通云开发环境后，我会接入 wx.login 和云数据库。当前版本先用本地 mock 数据。",
      showCancel: false
    });
  }
});
