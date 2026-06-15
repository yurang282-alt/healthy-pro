const { getEquipment } = require("../../utils/coach");

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
  }
});
