const { buildPortableDataExport, formatDeletionPreview } = require("../../utils/data-rights");

function getDateStamp(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

Page({
  data: {
    cloudReady: false,
    trainingLogCount: 0,
    bodyLogCount: 0,
    feedbackCount: 0,
    deletionPending: false,
    busy: false
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const app = getApp();
    const store = app.getStore();
    const deletionLock = app.getDataDeletionLock ? app.getDataDeletionLock() : null;
    this.setData({
      cloudReady: Boolean(store.cloud && store.cloud.enabled && store.cloud.openid),
      trainingLogCount: Array.isArray(store.logs) ? store.logs.length : 0,
      bodyLogCount: Array.isArray(store.bodyLogs) ? store.bodyLogs.length : 0,
      feedbackCount: Array.isArray(store.feedbacks) ? store.feedbacks.length : 0,
      deletionPending: Boolean(deletionLock)
    });
  },

  openPrivacyContract() {
    if (typeof wx.openPrivacyContract !== "function") {
      wx.showModal({
        title: "隐私说明",
        content: "当前微信版本暂不支持打开平台隐私指引。本页已经列出 Healthy Pro 收集、使用和删除数据的规则。",
        showCancel: false
      });
      return;
    }
    wx.openPrivacyContract({
      fail: () => wx.showToast({ title: "隐私指引暂不可用", icon: "none" })
    });
  },

  exportMyData() {
    if (this.data.busy) return;
    const payload = buildPortableDataExport(getApp().getStore());
    const content = JSON.stringify(payload, null, 2);
    const fileName = `healthy-pro-data-${getDateStamp()}.txt`;
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
    this.setData({ busy: true });
    wx.showLoading({ title: "正在整理" });
    wx.getFileSystemManager().writeFile({
      filePath,
      data: content,
      encoding: "utf8",
      success: () => {
        wx.hideLoading();
        if (typeof wx.shareFileMessage === "function") {
          wx.shareFileMessage({
            filePath,
            fileName,
            success: () => wx.showToast({ title: "导出成功", icon: "success" }),
            fail: () => this.copyExport(content)
          });
        } else {
          this.copyExport(content);
        }
      },
      fail: () => {
        wx.hideLoading();
        this.copyExport(content);
      },
      complete: () => this.setData({ busy: false })
    });
  },

  copyExport(content) {
    wx.setClipboardData({
      data: content,
      success: () => wx.showToast({ title: "数据已复制", icon: "success" }),
      fail: () => wx.showModal({
        title: "导出失败",
        content: "暂时无法生成文件或复制数据，请稍后重试。",
        showCancel: false
      })
    });
  },

  requestDeleteMyData() {
    if (this.data.busy) return;
    if (!this.data.cloudReady) {
      wx.showModal({
        title: "暂时不能删除",
        content: "当前没有连接微信云。请先返回设置页完成同步，再删除云端数据。",
        showCancel: false
      });
      return;
    }

    wx.showModal({
      title: this.data.deletionPending ? "继续完成删除" : "删除我的全部数据",
      content: this.data.deletionPending
        ? "上次删除尚未全部完成，云同步已暂停。继续操作会重试剩余数据，已删除的内容不会重复造成影响。"
        : "建议先导出备份。删除后，评估、计划、训练记录、身体记录、反馈和好友关系都无法恢复。",
      confirmText: "继续",
      cancelText: "取消",
      success: (firstResult) => {
        if (!firstResult.confirm) return;
        this.previewAndConfirmDeletion();
      }
    });
  },

  async previewAndConfirmDeletion() {
    this.setData({ busy: true });
    wx.showLoading({ title: "正在核对" });
    try {
      const counts = await getApp().previewUserDataDeletion();
      wx.hideLoading();
      wx.showModal({
        title: "最后确认",
        content: `${formatDeletionPreview(counts)}删除后会退出当前训练档案，且无法撤销。`,
        confirmText: "永久删除",
        confirmColor: "#b42318",
        cancelText: "取消",
        success: (finalResult) => {
          if (finalResult.confirm) this.deleteMyData();
        }
      });
    } catch (error) {
      wx.hideLoading();
      wx.showModal({
        title: "删除服务未就绪",
        content: error && (error.errMsg || error.message) || "请稍后重试。",
        showCancel: false
      });
    } finally {
      this.setData({ busy: false });
    }
  },

  async deleteMyData() {
    this.setData({ busy: true });
    wx.showLoading({ title: "正在删除", mask: true });
    try {
      await getApp().deleteCurrentUserData();
      wx.hideLoading();
      wx.showModal({
        title: "数据已删除",
        content: "当前微信身份下的原训练数据和本机草稿已清除。继续使用时可以重新评估。",
        showCancel: false,
        success: () => wx.reLaunch({ url: "/pages/assessment/assessment" })
      });
    } catch (error) {
      wx.hideLoading();
      const message = error && (error.errMsg || error.message) || "请稍后重试。";
      wx.showModal({
        title: error && error.code === "LOCAL_DELETE_PENDING" ? "本机清理待完成" : "删除尚未完成",
        content: message,
        showCancel: false,
        success: () => this.refresh()
      });
    } finally {
      this.setData({ busy: false });
    }
  }
});
