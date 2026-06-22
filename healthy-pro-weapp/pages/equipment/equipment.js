const { getEquipment, getPrimaryExerciseForEquipment } = require("../../utils/coach");

Page({
  data: {
    query: "",
    equipment: [],
    visibleEquipment: []
  },

  onShow() {
    const equipment = getEquipment();
    this.setData({
      equipment,
      visibleEquipment: equipment
    });
  },

  search(event) {
    const query = String(event.detail.value || "").trim();
    const source = this.data.equipment;
    const visibleEquipment = query
      ? source.filter((item) => `${item.name} ${item.category} ${item.muscles} ${item.setup}`.includes(query))
      : source;
    this.setData({ query, visibleEquipment });
  },

  viewEquipmentExercise(event) {
    const equipmentId = event.currentTarget.dataset.id;
    const exercise = getPrimaryExerciseForEquipment(equipmentId);
    if (!exercise) {
      wx.showToast({ title: "暂无关联动作", icon: "none" });
      return;
    }
    wx.navigateTo({
      url: `/pages/exercise-detail/exercise-detail?id=${encodeURIComponent(exercise.id)}&returnPath=${encodeURIComponent("/pages/equipment/equipment")}`
    });
  }
});
