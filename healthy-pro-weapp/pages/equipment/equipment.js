const { getEquipment, getPrimaryExerciseForEquipment } = require("../../utils/coach");

function groupEquipment(items) {
  const groups = [];
  const byCategory = {};
  items.forEach((item) => {
    const category = item.category || "其他器械";
    if (!byCategory[category]) {
      byCategory[category] = { category, items: [] };
      groups.push(byCategory[category]);
    }
    byCategory[category].items.push(item);
  });
  return groups;
}

function getCurrentEquipmentIds(context) {
  const workout = context && context.workout;
  return new Set(((workout && workout.exercises) || [])
    .map((exercise) => exercise.equipmentId)
    .filter(Boolean));
}

Page({
  data: {
    query: "",
    equipment: [],
    visibleEquipment: [],
    currentEquipmentAll: [],
    currentEquipment: [],
    equipmentGroups: []
  },

  onShow() {
    const context = getApp().getTrainingContext();
    const equipment = getEquipment();
    const currentIds = getCurrentEquipmentIds(context);
    const currentEquipment = equipment.filter((item) => currentIds.has(item.id));
    this.setData({ equipment, currentEquipmentAll: currentEquipment });
    this.applyFilter(this.data.query);
  },

  search(event) {
    const query = String(event.detail.value || "").trim();
    this.applyFilter(query);
  },

  applyFilter(query) {
    const source = this.data.equipment;
    const visibleEquipment = query
      ? source.filter((item) => `${item.name} ${item.category} ${item.muscles} ${item.setup}`.includes(query))
      : source;
    const currentSource = this.data.currentEquipmentAll || [];
    this.setData({
      query,
      visibleEquipment,
      equipmentGroups: groupEquipment(visibleEquipment),
      currentEquipment: query
        ? currentSource.filter((item) => visibleEquipment.some((visible) => visible.id === item.id))
        : currentSource
    });
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
