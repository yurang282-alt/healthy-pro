const COACH_SPEC_VERSION = "mvp-2026-06-05-model-v2";

const FOCUS_AREAS = [
  { id: "chest", label: "胸" },
  { id: "shoulders", label: "肩" },
  { id: "back", label: "背" },
  { id: "legs", label: "腿" },
  { id: "glutes", label: "臀" }
];

const FOCUS_BY_ID = Object.fromEntries(FOCUS_AREAS.map((item) => [item.id, item]));

const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "健身小白", description: "需要更明确的器械和动作提示" },
  { id: "familiar", label: "略有了解", description: "可以接受更完整的训练结构" },
  { id: "years", label: "健身多年", description: "训练容量和分化可以更进阶" },
  { id: "coach", label: "资深教练", description: "给出框架和关键限制，保留自主调整空间" }
];

const EXPERIENCE_BY_ID = Object.fromEntries(EXPERIENCE_LEVELS.map((item) => [item.id, item]));

const ASSESSMENT_LIMITS = {
  age: { min: 14, max: 80, label: "年龄" },
  height: { min: 120, max: 230, label: "身高" },
  weight: { min: 30, max: 250, label: "体重" },
  bodyFat: { min: 3, max: 60, label: "体脂率" }
};

const VISIBLE_EQUIPMENT_IDS = [
  "treadmill",
  "elliptical",
  "recumbent-bike",
  "rower",
  "chest-back-press",
  "high-row",
  "seated-row",
  "leg-press",
  "leg-extension-curl",
  "shoulder-press",
  "rear-delt",
  "assisted-pullup",
  "hack-squat",
  "smith-machine",
  "cable-station",
  "hip-thrust",
  "dumbbell-rack"
];

const EQUIPMENT = [
  {
    id: "treadmill",
    name: "跑步机",
    category: "有氧训练区",
    quantity: 15,
    imageClass: "visual--treadmill",
    muscles: ["心肺", "热身", "减脂"],
    setup: ["先夹好安全扣", "建议坡度 0-3%", "速度从能完整说话开始"],
    mistakes: ["一上来冲刺", "双手长时间压扶手", "膝盖疼还硬撑"]
  },
  {
    id: "elliptical",
    name: "椭圆机",
    category: "有氧训练区",
    quantity: 8,
    imageClass: "visual--elliptical",
    muscles: ["心肺", "臀腿", "低冲击"],
    setup: ["脚掌踩满踏板", "膝盖朝脚尖方向", "阻力从 3-5 档开始"],
    mistakes: ["只靠手臂拉", "身体左右晃", "阻力过高导致塌腰"]
  },
  {
    id: "recumbent-bike",
    name: "靠背健身车",
    category: "有氧训练区",
    quantity: 1,
    imageClass: "visual--recumbent-bike",
    muscles: ["心肺", "膝友好", "恢复"],
    setup: ["座椅调到膝盖微弯", "背部贴住靠背", "阻力从低档开始"],
    mistakes: ["座椅太近导致膝盖顶住", "阻力过高硬踩", "脚掌只踩前半截"]
  },
  {
    id: "upright-bike",
    name: "直立健身车",
    category: "有氧训练区",
    quantity: 1,
    imageClass: "visual--elliptical",
    muscles: ["心肺", "大腿前侧", "热身"],
    setup: ["座垫调到髋部附近", "踩到底时膝盖微弯", "保持上身稳定"],
    mistakes: ["座椅过低", "左右摇摆发力", "一开始阻力太高"]
  },
  {
    id: "rower",
    name: "划船器",
    category: "有氧训练区",
    quantity: 3,
    imageClass: "visual--rower",
    muscles: ["心肺", "背", "臀腿"],
    setup: ["先蹬腿，再后倾，再拉手柄", "回程顺序相反", "节奏慢一点学动作"],
    mistakes: ["只用手臂拉", "圆背猛拉", "节奏太快导致动作散"]
  },
  {
    id: "stair-climber",
    name: "楼梯机",
    category: "有氧训练区",
    quantity: 2,
    imageClass: "visual--treadmill",
    muscles: ["心肺", "臀腿", "减脂"],
    setup: ["从最低速度开始", "手只轻扶", "脚掌踩稳整级台阶"],
    mistakes: ["趴在扶手上", "速度太快踩空", "膝盖不舒服还硬撑"]
  },
  {
    id: "multi-press",
    name: "多角度推举训练器",
    category: "力量训练区",
    quantity: 2,
    imageClass: "visual--chest-press",
    muscles: ["胸", "肩", "肱三头肌"],
    setup: ["先选低重量", "座椅调到把手略低于肩", "背部贴紧靠垫"],
    mistakes: ["耸肩", "手腕塌陷", "推到肘关节锁死"]
  },
  {
    id: "high-row",
    name: "高拉/划船训练器",
    category: "力量训练区",
    quantity: 1,
    imageClass: "visual--lat-pulldown",
    muscles: ["背", "后肩", "肱二头肌"],
    setup: ["胸口贴稳", "先沉肩再拉", "肘往身体后下方走"],
    mistakes: ["身体后仰借力", "耸肩夹脖子", "只用手臂硬拉"]
  },
  {
    id: "seated-row",
    name: "坐姿划船机",
    category: "力量训练区",
    quantity: 1,
    imageClass: "visual--seated-row",
    muscles: ["中背", "背阔肌", "后肩"],
    setup: ["胸口贴稳靠垫", "先伸直手再启动肩胛", "把手拉到肋骨两侧"],
    mistakes: ["用腰猛甩", "肩膀耸起", "手腕弯折发力"]
  },
  {
    id: "leg-extension-curl",
    name: "腿部伸展/弯曲训练机",
    category: "力量训练区",
    quantity: 1,
    imageClass: "visual--leg-extension-curl",
    muscles: ["大腿前侧", "大腿后侧"],
    setup: ["膝盖轴心对准机器转轴", "先轻重量试动作", "顶端或末端慢停 1 秒"],
    mistakes: ["甩腿", "重量过大", "膝盖刺痛还继续"]
  },
  {
    id: "rear-delt",
    name: "蝴蝶后三角训练器",
    category: "力量训练区",
    quantity: 1,
    imageClass: "visual--rear-delt",
    muscles: ["后肩", "上背", "体态"],
    setup: ["胸口贴垫", "手肘微弯", "手臂向两侧打开到肩后"],
    mistakes: ["耸肩", "身体离开垫子", "用惯性甩开"]
  },
  {
    id: "leg-press",
    name: "坐式蹬腿训练器",
    category: "力量训练区",
    quantity: 1,
    imageClass: "visual--leg-press",
    muscles: ["股四头肌", "臀", "腘绳肌"],
    setup: ["脚放踏板中上方", "膝盖跟脚尖同向", "下降到骨盆不卷起为止"],
    mistakes: ["膝盖内扣", "下放过深导致腰离垫", "推起时锁死膝盖"]
  },
  {
    id: "chest-back-press",
    name: "胸肌/背肌推举训练机",
    category: "力量训练区",
    quantity: 1,
    imageClass: "visual--chest-press",
    muscles: ["胸", "背", "肩稳定"],
    setup: ["按当天动作调节方向", "先空档熟悉轨迹", "背部或胸口贴稳靠垫"],
    mistakes: ["动作模式切错", "重量太大轨迹变形", "肩膀前顶"]
  },
  {
    id: "arm-curl-extension",
    name: "二头/三头肌训练机",
    category: "力量训练区",
    quantity: 1,
    imageClass: "visual--dumbbell-rack",
    muscles: ["肱二头肌", "肱三头肌"],
    setup: ["肘关节对准转轴", "上臂贴稳垫子", "慢起慢落"],
    mistakes: ["身体跟着晃", "手腕弯折", "重量大到肘疼"]
  },
  {
    id: "assisted-pullup",
    name: "助力引体向上机",
    category: "力量训练区",
    quantity: 1,
    imageClass: "visual--assisted-pullup",
    muscles: ["背", "肱二头肌", "核心稳定"],
    setup: ["助力调大一点更轻松", "先沉肩", "下放到手臂伸直但不耸肩"],
    mistakes: ["助力太小导致动作散", "脖子前伸", "下放失控"]
  },
  {
    id: "hack-squat",
    name: "哈克深蹲机",
    category: "力量训练区",
    quantity: 1,
    imageClass: "visual--hack-squat",
    muscles: ["大腿前侧", "臀"],
    setup: ["脚站稳踏板中上方", "先用很轻重量", "下蹲到腰背不离垫"],
    mistakes: ["膝盖内扣", "下蹲过深骨盆卷起", "一开始就加大重量"]
  },
  {
    id: "abductor-adductor",
    name: "内/外大腿肌训练器",
    category: "力量训练区",
    quantity: 1,
    imageClass: "visual--leg-extension",
    muscles: ["臀中肌", "大腿内侧", "骨盆稳定"],
    setup: ["背贴靠垫", "动作幅度可控", "末端停 1 秒"],
    mistakes: ["身体前后晃", "幅度硬撑过大", "用惯性弹回"]
  },
  {
    id: "shoulder-press",
    name: "坐式肩膀推举训练器",
    category: "力量训练区",
    quantity: 1,
    imageClass: "visual--shoulder-press",
    muscles: ["肩", "肱三头肌"],
    setup: ["座椅调到把手在耳朵附近", "背部贴紧", "肘略在身体前侧"],
    mistakes: ["耸肩", "腰过度反弓", "推到肘关节锁死"]
  },
  {
    id: "smith-machine",
    name: "史密斯训练架",
    category: "自由力量训练区",
    quantity: 1,
    imageClass: "visual--smith-machine",
    muscles: ["全身", "推", "蹲"],
    setup: ["先确认安全挂钩和限位", "空杆熟悉轨迹", "动作稳定后再加重量"],
    mistakes: ["不熟安全钩就训练", "脚位随便放", "一开始追求大重量"]
  },
  {
    id: "standing-hip",
    name: "站姿屈臀训练器",
    category: "力量训练区",
    quantity: 1,
    imageClass: "visual--leg-extension",
    muscles: ["臀", "髋稳定"],
    setup: ["身体扶稳", "动作小而稳", "骨盆不要左右歪"],
    mistakes: ["甩腿", "腰代偿", "重量过大"]
  },
  {
    id: "fortyfive-leg-press",
    name: "45度蹬腿训练机",
    category: "力量训练区",
    quantity: 1,
    imageClass: "visual--leg-press",
    muscles: ["大腿", "臀"],
    setup: ["先确认安全挡杆", "脚掌踩稳踏板", "下放到腰不离垫"],
    mistakes: ["膝盖内扣", "锁死膝盖", "下放太深"]
  },
  {
    id: "hip-thrust",
    name: "臀推训练机",
    category: "力量训练区",
    quantity: 1,
    imageClass: "visual--hip-thrust",
    muscles: ["臀", "腘绳肌"],
    setup: ["髋垫压在骨盆前侧", "下巴微收", "顶端夹臀 1 秒"],
    mistakes: ["腰顶起来代偿", "脚离身体太远", "重量大到腰酸"]
  },
  {
    id: "cable-station",
    name: "双滑轮双向拉力训练机",
    category: "自由力量训练区",
    quantity: 2,
    imageClass: "visual--cable-station",
    muscles: ["胸", "背", "肩", "核心"],
    setup: ["先选轻重量", "两边高度调一致", "站稳后再拉"],
    mistakes: ["重量拉着人走", "身体乱晃", "动作路径不固定"]
  },
  {
    id: "right-angle-bench",
    name: "直角凳",
    category: "自由力量训练区",
    quantity: 1,
    imageClass: "visual--dumbbell-rack",
    muscles: ["坐姿支撑", "肩", "手臂"],
    setup: ["凳子放稳", "背贴靠垫", "脚踩实地面"],
    mistakes: ["凳子没放稳", "腰悬空", "借力后仰"]
  },
  {
    id: "dumbbell-rack",
    name: "双层哑铃架",
    category: "自由力量训练区",
    quantity: 2,
    imageClass: "visual--dumbbell-rack",
    muscles: ["全身", "稳定", "单侧控制"],
    setup: ["从最轻可控重量开始", "动作全程能慢停", "左右重量一致"],
    mistakes: ["为了重量牺牲动作", "弯腰捡铃不屈髋", "手腕塌陷"]
  },
  {
    id: "adjustable-bench",
    name: "多方位可调训练椅",
    category: "自由力量训练区",
    quantity: 3,
    imageClass: "visual--adjustable-bench",
    muscles: ["胸", "肩", "背支撑"],
    setup: ["确认卡扣锁紧", "角度先用低斜度", "脚踩实地面"],
    mistakes: ["卡扣没锁", "角度太陡", "拿太重的哑铃"]
  },
  {
    id: "decline-ab-bench",
    name: "可调式腹肌下斜训练椅",
    category: "自由力量训练区",
    quantity: 1,
    imageClass: "visual--dumbbell-rack",
    muscles: ["腹部", "髋屈肌"],
    setup: ["从低角度开始", "卷腹而不是猛坐起", "腰不舒服就停止"],
    mistakes: ["角度太陡", "双手抱头猛拉", "腰疼还做"]
  },
  {
    id: "barbell-rack",
    name: "杠铃架",
    category: "自由力量训练区",
    quantity: 1,
    imageClass: "visual--dumbbell-rack",
    muscles: ["全身", "力量基础"],
    setup: ["新手先空杆学习", "确认保护杆高度", "有人指导再加重量"],
    mistakes: ["无人保护冲重量", "保护杆没设", "动作没学会就加片"]
  },
  {
    id: "roman-chair",
    name: "罗马凳",
    category: "自由力量训练区",
    quantity: 1,
    imageClass: "visual--dumbbell-rack",
    muscles: ["臀", "下背", "后链"],
    setup: ["髋部顶在垫子边缘", "脊柱保持中立", "动作幅度小一点"],
    mistakes: ["腰过度后仰", "速度太快", "腰疼还继续"]
  },
  {
    id: "deadlift-platform",
    name: "硬拉台",
    category: "自由力量训练区",
    quantity: 1,
    imageClass: "visual--dumbbell-rack",
    muscles: ["后链", "全身力量"],
    setup: ["MVP 仅作为识别，不给新手安排硬拉", "需要线下教练指导", "先学髋铰链"],
    mistakes: ["新手自行大重量硬拉", "圆背拉", "疲劳时硬撑"]
  },
  {
    id: "flat-bench",
    name: "哑铃训练平椅",
    category: "自由力量训练区",
    quantity: 1,
    imageClass: "visual--dumbbell-rack",
    muscles: ["胸", "肩", "手臂"],
    setup: ["肩胛轻收", "脚踩稳", "先用轻哑铃"],
    mistakes: ["哑铃路径乱晃", "肩膀前顶", "无人保护冲重量"]
  },
  {
    id: "three-d-smith",
    name: "三维史密斯机",
    category: "自由力量训练区",
    quantity: 1,
    imageClass: "visual--dumbbell-rack",
    muscles: ["全身", "轨迹控制"],
    setup: ["先空杆熟悉轨迹", "确认安全限制", "动作稳定再加重量"],
    mistakes: ["把它当普通固定轨迹", "安全设置没确认", "追求大重量"]
  },
  {
    id: "trap-bar",
    name: "六角杠铃",
    category: "自由力量训练区",
    quantity: 1,
    imageClass: "visual--dumbbell-rack",
    muscles: ["腿", "臀", "背"],
    setup: ["MVP 先不安排新手负重硬拉", "可用于轻重量农夫走", "保持身体直立"],
    mistakes: ["没学动作就拉重", "弯腰捡起", "握力失控"]
  },
  {
    id: "stretch-bench",
    name: "多功能拉伸训练凳",
    category: "自由力量训练区",
    quantity: 1,
    imageClass: "visual--dumbbell-rack",
    muscles: ["放松", "灵活性"],
    setup: ["训练后轻柔拉伸", "每个姿势 20-30 秒", "不追求疼痛感"],
    mistakes: ["弹振拉伸", "拉到疼", "训练前长时间静态拉伸"]
  }
];

const EQUIPMENT_IMAGE_BY_CLASS = {
  "visual--treadmill": "/assets/equipment/treadmill.png",
  "visual--elliptical": "/assets/equipment/elliptical.png",
  "visual--recumbent-bike": "/assets/equipment/recumbent-bike.png",
  "visual--rower": "/assets/equipment/rower.png",
  "visual--chest-press": "/assets/equipment/chest-press.png",
  "visual--lat-pulldown": "/assets/equipment/lat-pulldown.png",
  "visual--seated-row": "/assets/equipment/seated-row.png",
  "visual--leg-press": "/assets/equipment/leg-press.png",
  "visual--leg-extension-curl": "/assets/equipment/leg-extension-curl.png",
  "visual--leg-extension": "/assets/equipment/leg-extension-curl.png",
  "visual--shoulder-press": "/assets/equipment/shoulder-press.png",
  "visual--rear-delt": "/assets/equipment/rear-delt.png",
  "visual--assisted-pullup": "/assets/equipment/assisted-pullup.png",
  "visual--hack-squat": "/assets/equipment/hack-squat.png",
  "visual--cable-station": "/assets/equipment/cable-station.png",
  "visual--hip-thrust": "/assets/equipment/hip-thrust.png",
  "visual--dumbbell-rack": "/assets/equipment/dumbbell-rack.png",
  "visual--adjustable-bench": "/assets/equipment/dumbbell-rack.png",
  "visual--smith-machine": "/assets/equipment/smith-machine.png"
};

for (const item of EQUIPMENT) {
  item.imageSrc = EQUIPMENT_IMAGE_BY_CLASS[item.imageClass] || EQUIPMENT_IMAGE_BY_CLASS["visual--dumbbell-rack"];
}

const EQUIPMENT_BY_ID = Object.fromEntries(EQUIPMENT.map((item) => [item.id, item]));

const BASE_EXERCISES = {
  treadmillWarmup: {
    id: "treadmill-warmup",
    name: "跑步机坡度快走",
    equipmentId: "treadmill",
    type: "cardio",
    target: "8-10 分钟",
    rest: "无",
    cues: ["鼻吸口呼，能说短句", "脚步落点稳定", "结束后心率明显升高但不喘爆"]
  },
  treadmillWarmupShort: {
    id: "treadmill-warmup-short",
    name: "跑步机短热身",
    equipmentId: "treadmill",
    type: "cardio",
    target: "5-8 分钟",
    rest: "无",
    cues: ["微微出汗即可", "不要把热身做成正式有氧", "增肌日保留体力给力量训练"]
  },
  treadmillFinish: {
    id: "treadmill-finish",
    name: "跑步机放松快走",
    equipmentId: "treadmill",
    type: "cardio",
    target: "10-15 分钟",
    rest: "无",
    cues: ["坡度 3-6%", "速度保持可持续", "最后 2 分钟逐步降速"]
  },
  ellipticalWarmup: {
    id: "elliptical-warmup",
    name: "椭圆机热身",
    equipmentId: "elliptical",
    type: "cardio",
    target: "8 分钟",
    rest: "无",
    cues: ["阻力低到中等", "脚掌不离踏板", "肩膀放松"]
  },
  rowingFinish: {
    id: "rowing-finish",
    name: "划船器轻松划",
    equipmentId: "rower",
    type: "cardio",
    target: "8-12 分钟",
    rest: "无",
    cues: ["先蹬腿再拉手", "节奏稳定", "腰背保持中立"]
  },
  stairClimberFinish: {
    id: "stair-climber-finish",
    name: "楼梯机低速爬楼",
    equipmentId: "stair-climber",
    type: "cardio",
    target: "6-10 分钟",
    rest: "无",
    cues: ["速度低一点", "手只轻扶", "膝盖不舒服就换椭圆机"]
  },
  chestPress: {
    id: "chest-press",
    name: "坐姿推胸",
    equipmentId: "chest-back-press",
    type: "strength",
    baseSets: 3,
    reps: "10-12 次",
    rest: "75 秒",
    cues: ["推起 1 秒，下放 2 秒", "肩膀不要前顶", "每组保留 3 次余力"]
  },
  cableChestFly: {
    id: "cable-chest-fly",
    name: "绳索夹胸",
    equipmentId: "cable-station",
    type: "strength",
    baseSets: 2,
    reps: "12-15 次",
    rest: "60 秒",
    cues: ["重量很轻开始", "手肘微弯", "像抱住一棵树一样合拢"]
  },
  cableArmTraining: {
    id: "cable-arm-training",
    name: "绳索手臂训练",
    equipmentId: "cable-station",
    type: "strength",
    baseSets: 2,
    reps: "10-12 次",
    rest: "60 秒",
    cues: ["先选轻重量", "上臂保持稳定", "手腕中立，慢起慢落"]
  },
  dumbbellInclinePress: {
    id: "dumbbell-incline-press",
    name: "哑铃上斜推胸",
    equipmentId: "dumbbell-rack",
    type: "strength",
    baseSets: 2,
    reps: "10-12 次",
    rest: "75 秒",
    cues: ["凳子调低斜角", "哑铃从胸外侧推起", "肩膀不舒服就降低角度或减重"]
  },
  smithInclinePress: {
    id: "smith-incline-press",
    name: "史密斯上斜推胸",
    equipmentId: "smith-machine",
    type: "strength",
    baseSets: 2,
    reps: "8-10 次",
    rest: "90 秒",
    cues: ["凳子调低斜角", "先空杆确认挂钩方向", "肩胛稳定，不要推到肘关节锁死"]
  },
  latPulldown: {
    id: "lat-pulldown",
    name: "高位下拉",
    equipmentId: "high-row",
    type: "strength",
    baseSets: 3,
    reps: "10-12 次",
    rest: "75 秒",
    cues: ["先沉肩再拉", "把手拉向锁骨", "不要拉到脖子后面"]
  },
  seatedRow: {
    id: "seated-row",
    name: "坐姿划船",
    equipmentId: "seated-row",
    type: "strength",
    baseSets: 3,
    reps: "10-12 次",
    rest: "75 秒",
    cues: ["胸口贴稳", "肘向身体后侧走", "顶点夹背 1 秒"]
  },
  assistedPullup: {
    id: "assisted-pullup",
    name: "助力引体向上",
    equipmentId: "assisted-pullup",
    type: "strength",
    baseSets: 2,
    reps: "6-8 次",
    rest: "90 秒",
    cues: ["助力调大一点", "先沉肩再拉", "动作慢，不追求次数"]
  },
  legPress: {
    id: "leg-press",
    name: "坐式蹬腿",
    equipmentId: "leg-press",
    type: "strength",
    baseSets: 3,
    reps: "12-15 次",
    rest: "90 秒",
    cues: ["膝盖跟脚尖同向", "不要锁死膝盖", "下放到腰不离垫"]
  },
  legExtension: {
    id: "leg-extension",
    name: "腿部伸展",
    equipmentId: "leg-extension-curl",
    type: "strength",
    baseSets: 2,
    reps: "12-15 次",
    rest: "60 秒",
    cues: ["顶端停 1 秒", "慢慢下放", "膝盖不舒服立即停止"]
  },
  legCurl: {
    id: "leg-curl",
    name: "腿部弯曲",
    equipmentId: "leg-extension-curl",
    type: "strength",
    baseSets: 2,
    reps: "12-15 次",
    rest: "60 秒",
    cues: ["动作慢一点", "大腿贴稳垫子", "不要靠惯性甩"]
  },
  hipThrust: {
    id: "hip-thrust",
    name: "臀推",
    equipmentId: "hip-thrust",
    type: "strength",
    baseSets: 2,
    reps: "10-12 次",
    rest: "90 秒",
    cues: ["顶端夹臀 1 秒", "腰不要反弓", "先用轻重量找感觉"]
  },
  abductor: {
    id: "abductor",
    name: "外展臀中肌",
    equipmentId: "abductor-adductor",
    type: "strength",
    baseSets: 2,
    reps: "12-15 次",
    rest: "60 秒",
    cues: ["背贴靠垫", "打开到可控范围", "末端停 1 秒"]
  },
  hackSquat: {
    id: "hack-squat",
    name: "哈克深蹲轻重量",
    equipmentId: "hack-squat",
    type: "strength",
    baseSets: 2,
    reps: "8-10 次",
    rest: "90 秒",
    cues: ["先空载或很轻", "膝盖跟脚尖同向", "腰背不离垫"]
  },
  smithBoxSquat: {
    id: "smith-box-squat",
    name: "史密斯箱蹲",
    equipmentId: "smith-machine",
    type: "strength",
    baseSets: 2,
    reps: "8-10 次",
    rest: "90 秒",
    cues: ["先空杆", "箱凳高度让骨盆不卷起", "脚位固定后再开始正式组"]
  },
  shoulderPress: {
    id: "shoulder-press",
    name: "坐式肩推",
    equipmentId: "shoulder-press",
    type: "strength",
    baseSets: 2,
    reps: "10-12 次",
    rest: "75 秒",
    cues: ["背贴靠垫", "不要耸肩", "肘略在身体前侧"]
  },
  rearDelt: {
    id: "rear-delt",
    name: "蝴蝶机后肩打开",
    equipmentId: "rear-delt",
    type: "strength",
    baseSets: 2,
    reps: "12-15 次",
    rest: "60 秒",
    cues: ["手肘微弯", "肩膀下沉", "动作慢，不甩"]
  },
  armCurlExtension: {
    id: "arm-curl-extension",
    name: "二头/三头机器训练",
    equipmentId: "arm-curl-extension",
    type: "strength",
    baseSets: 2,
    reps: "10-12 次",
    rest: "60 秒",
    cues: ["肘贴稳", "手腕中立", "慢起慢落"]
  },
  romanChairBackExtension: {
    id: "roman-chair-back-extension",
    name: "罗马凳小幅背伸",
    equipmentId: "roman-chair",
    type: "strength",
    baseSets: 2,
    reps: "8-10 次",
    rest: "60 秒",
    cues: ["幅度小一点", "臀部发力", "腰不舒服立即停止"]
  },
  declineCrunch: {
    id: "decline-crunch",
    name: "低角度卷腹",
    equipmentId: "decline-ab-bench",
    type: "strength",
    baseSets: 2,
    reps: "8-12 次",
    rest: "60 秒",
    cues: ["用最低角度", "卷起上背即可", "不要抱头猛拉"]
  },
  dumbbellGobletSquat: {
    id: "dumbbell-goblet-squat",
    name: "哑铃杯式箱蹲",
    equipmentId: "dumbbell-rack",
    type: "strength",
    baseSets: 2,
    reps: "8-10 次",
    rest: "90 秒",
    cues: ["先用 2-8kg", "坐到箱凳轻触再起", "躯干稳定，不追求蹲深"]
  },
  dumbbellCarry: {
    id: "dumbbell-farmer-carry",
    name: "哑铃农夫走",
    equipmentId: "dumbbell-rack",
    type: "strength",
    baseSets: 3,
    reps: "20-30 米",
    rest: "60 秒",
    cues: ["双肩自然下沉", "身体不要侧歪", "步伐稳定"]
  }
};

const PLAN_EXERCISES = Object.values(BASE_EXERCISES).filter((exercise, index, list) =>
  VISIBLE_EQUIPMENT_IDS.includes(exercise.equipmentId) &&
  list.findIndex((item) => item.id === exercise.id) === index
);

const WORKOUT_BLUEPRINTS = [
  {
    id: "A",
    title: "全身基础 A",
    focus: "学习推、拉、腿举三类基础模式",
    exercises: [
      BASE_EXERCISES.treadmillWarmup,
      BASE_EXERCISES.legPress,
      BASE_EXERCISES.chestPress,
      BASE_EXERCISES.seatedRow,
      BASE_EXERCISES.legExtension,
      BASE_EXERCISES.treadmillFinish
    ]
  },
  {
    id: "B",
    title: "全身基础 B",
    focus: "背部发力和低冲击心肺",
    exercises: [
      BASE_EXERCISES.ellipticalWarmup,
      BASE_EXERCISES.latPulldown,
      BASE_EXERCISES.dumbbellGobletSquat,
      BASE_EXERCISES.seatedRow,
      BASE_EXERCISES.chestPress,
      BASE_EXERCISES.rowingFinish
    ]
  },
  {
    id: "C",
    title: "全身基础 C",
    focus: "巩固动作质量和核心稳定",
    exercises: [
      BASE_EXERCISES.treadmillWarmup,
      BASE_EXERCISES.legPress,
      BASE_EXERCISES.latPulldown,
      BASE_EXERCISES.shoulderPress,
      BASE_EXERCISES.dumbbellCarry,
      BASE_EXERCISES.ellipticalWarmup
    ]
  }
];

const EXTRA_BALANCED_WORKOUTS = [
  {
    id: "D",
    title: "全身基础 D",
    focus: "低冲击心肺和肩背稳定，不堆大重量",
    exercises: [
      BASE_EXERCISES.treadmillWarmupShort,
      BASE_EXERCISES.shoulderPress,
      BASE_EXERCISES.rearDelt,
      BASE_EXERCISES.legCurl,
      BASE_EXERCISES.dumbbellCarry,
      BASE_EXERCISES.rowingFinish
    ]
  }
];

const FOCUS_EXERCISES = {
  chest: [BASE_EXERCISES.smithInclinePress, BASE_EXERCISES.cableChestFly, BASE_EXERCISES.chestPress],
  shoulders: [BASE_EXERCISES.shoulderPress, BASE_EXERCISES.rearDelt],
  back: [BASE_EXERCISES.assistedPullup, BASE_EXERCISES.seatedRow, BASE_EXERCISES.latPulldown],
  legs: [BASE_EXERCISES.legCurl, BASE_EXERCISES.smithBoxSquat, BASE_EXERCISES.legPress],
  glutes: [BASE_EXERCISES.hipThrust, BASE_EXERCISES.legPress, BASE_EXERCISES.legCurl],
  arms: [BASE_EXERCISES.cableArmTraining],
  core: [BASE_EXERCISES.dumbbellCarry, BASE_EXERCISES.seatedRow],
  cardio: [BASE_EXERCISES.rowingFinish, BASE_EXERCISES.ellipticalWarmup]
};

const WEEK_RULES = [
  {
    week: 1,
    label: "适应周",
    setOffset: -1,
    effort: "6/10",
    effortText: "适中，动作稳，结束后还能再做几次",
    load: "找到能稳定完成上限次数的重量",
    rule: "动作标准优先，宁可轻一点。"
  },
  {
    week: 2,
    label: "稳定周",
    setOffset: 0,
    effort: "6-7/10",
    effortText: "有点吃力，但动作不变形",
    load: "维持重量，把动作轨迹做稳定",
    rule: "所有组都完成上限次数，下一次再加重量。"
  },
  {
    week: 3,
    label: "微进阶周",
    setOffset: 0,
    effort: "7/10",
    effortText: "明显吃力，但不憋、不硬撑",
    load: "上肢可加 2.5kg，下肢可加 5kg",
    rule: "加重量后次数可以落在区间下限。"
  },
  {
    week: 4,
    label: "复盘周",
    setOffset: -1,
    effort: "6/10",
    effortText: "回到适中，观察恢复和动作质量",
    load: "略降训练量，观察疲劳和动作质量",
    rule: "用记录决定下一轮是否增加频次或训练量。"
  }
];

const EXPERIENCE_RANK = {
  beginner: 1,
  familiar: 2,
  years: 3,
  coach: 4
};

const VOLUME_TIER_ORDER = ["compressed", "base", "moderate-hypertrophy", "hypertrophy"];

const WEEKLY_SET_ANCHORS = {
  gain: {
    compressed: { min: 6, max: 8 },
    base: { min: 8, max: 12 },
    "moderate-hypertrophy": { min: 10, max: 14 },
    hypertrophy: { min: 12, max: 18 }
  },
  other: {
    compressed: { min: 4, max: 6 },
    base: { min: 6, max: 8 },
    "moderate-hypertrophy": { min: 8, max: 10 },
    hypertrophy: { min: 10, max: 12 }
  }
};

const LOAD_PROFILES = {
  "chest-press": {
    region: "upper",
    unit: "kg",
    step: 5,
    min: 10,
    max: 120,
    coefficients: { beginner: 0.28, familiar: 0.42, years: 0.55, coach: 0.65 }
  },
  "cable-chest-fly": {
    region: "upper",
    unit: "kg/侧",
    step: 2.5,
    min: 2.5,
    max: 35,
    coefficients: { beginner: 0.06, familiar: 0.09, years: 0.13, coach: 0.16 }
  },
  "cable-arm-training": {
    region: "upper",
    unit: "kg",
    step: 2.5,
    min: 5,
    max: 45,
    coefficients: { beginner: 0.12, familiar: 0.18, years: 0.24, coach: 0.3 }
  },
  "dumbbell-incline-press": {
    region: "upper",
    unit: "kg/只",
    step: 2,
    min: 4,
    max: 45,
    coefficients: { beginner: 0.08, familiar: 0.12, years: 0.17, coach: 0.22 }
  },
  "smith-incline-press": {
    region: "upper",
    unit: "kg总重",
    step: 5,
    min: 15,
    max: 120,
    coefficients: { beginner: 0.25, familiar: 0.36, years: 0.5, coach: 0.62 }
  },
  "lat-pulldown": {
    region: "upper",
    unit: "kg",
    step: 5,
    min: 15,
    max: 110,
    coefficients: { beginner: 0.32, familiar: 0.45, years: 0.58, coach: 0.7 }
  },
  "seated-row": {
    region: "upper",
    unit: "kg",
    step: 5,
    min: 15,
    max: 120,
    coefficients: { beginner: 0.32, familiar: 0.46, years: 0.6, coach: 0.72 }
  },
  "assisted-pullup": {
    region: "upper",
    unit: "kg助力",
    step: 5,
    min: 10,
    max: 80,
    kind: "assistance",
    coefficients: { beginner: 0.58, familiar: 0.45, years: 0.32, coach: 0.22 }
  },
  "leg-press": {
    region: "lower",
    unit: "kg",
    step: 10,
    min: 30,
    max: 260,
    coefficients: { beginner: 0.7, familiar: 1.0, years: 1.3, coach: 1.6 }
  },
  "leg-extension": {
    region: "lower",
    unit: "kg",
    step: 5,
    min: 10,
    max: 90,
    coefficients: { beginner: 0.22, familiar: 0.32, years: 0.42, coach: 0.5 }
  },
  "leg-curl": {
    region: "lower",
    unit: "kg",
    step: 5,
    min: 10,
    max: 90,
    coefficients: { beginner: 0.18, familiar: 0.28, years: 0.38, coach: 0.45 }
  },
  "hip-thrust": {
    region: "lower",
    unit: "kg",
    step: 10,
    min: 20,
    max: 220,
    coefficients: { beginner: 0.45, familiar: 0.7, years: 0.95, coach: 1.15 }
  },
  "abductor": {
    region: "lower",
    unit: "kg",
    step: 5,
    min: 10,
    max: 90,
    coefficients: { beginner: 0.22, familiar: 0.32, years: 0.42, coach: 0.5 }
  },
  "hack-squat": {
    region: "lower",
    unit: "kg",
    step: 10,
    min: 20,
    max: 220,
    coefficients: { beginner: 0.45, familiar: 0.75, years: 1.05, coach: 1.25 }
  },
  "smith-box-squat": {
    region: "lower",
    unit: "kg总重",
    step: 5,
    min: 15,
    max: 180,
    coefficients: { beginner: 0.32, familiar: 0.5, years: 0.72, coach: 0.9 }
  },
  "shoulder-press": {
    region: "upper",
    unit: "kg",
    step: 5,
    min: 5,
    max: 80,
    coefficients: { beginner: 0.18, familiar: 0.26, years: 0.36, coach: 0.45 }
  },
  "rear-delt": {
    region: "upper",
    unit: "kg",
    step: 2.5,
    min: 5,
    max: 45,
    coefficients: { beginner: 0.1, familiar: 0.15, years: 0.2, coach: 0.25 }
  },
  "arm-curl-extension": {
    region: "upper",
    unit: "kg",
    step: 2.5,
    min: 5,
    max: 55,
    coefficients: { beginner: 0.12, familiar: 0.18, years: 0.25, coach: 0.32 }
  },
  "dumbbell-goblet-squat": {
    region: "lower",
    unit: "kg",
    step: 2,
    min: 4,
    max: 40,
    coefficients: { beginner: 0.12, familiar: 0.18, years: 0.25, coach: 0.32 }
  },
  "dumbbell-farmer-carry": {
    region: "full",
    unit: "kg/只",
    step: 2,
    min: 6,
    max: 60,
    coefficients: { beginner: 0.16, familiar: 0.24, years: 0.34, coach: 0.45 }
  }
};

function validateAssessment(assessment = {}) {
  const errors = [];
  const normalized = {
    ...assessment,
    gender: ["male", "female", "other"].includes(assessment.gender) ? assessment.gender : "other",
    trainingExperience: getExperience(assessment.trainingExperience).id,
    targetPreference: ["auto", "fat-loss", "gain", "shape"].includes(assessment.targetPreference) ? assessment.targetPreference : "auto",
    weeklyLimit: normalizeWeeklyLimit(assessment.weeklyLimit),
    sessionBudget: [45, 60, 75].includes(Number(assessment.sessionBudget)) ? Number(assessment.sessionBudget) : 60,
    focusAreas: normalizeFocusAreas(assessment.focusAreas),
    injury: ["none", "knee", "back", "shoulder", "heart"].includes(assessment.injury) ? assessment.injury : "none"
  };

  for (const field of ["age", "height", "weight"]) {
    const value = Number(assessment[field]);
    const limit = ASSESSMENT_LIMITS[field];
    if (!Number.isFinite(value) || value < limit.min || value > limit.max) {
      errors.push(`${limit.label}需要在 ${limit.min}-${limit.max} 之间。`);
      continue;
    }
    normalized[field] = value;
  }

  if (assessment.bodyFat === "" || assessment.bodyFat === null || assessment.bodyFat === undefined) {
    normalized.bodyFat = "";
  } else {
    const bodyFat = Number(assessment.bodyFat);
    const limit = ASSESSMENT_LIMITS.bodyFat;
    if (!Number.isFinite(bodyFat) || bodyFat < limit.min || bodyFat > limit.max) {
      errors.push(`${limit.label}不知道可以不填；填写时需要在 ${limit.min}-${limit.max}% 之间。`);
    } else {
      normalized.bodyFat = bodyFat;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    normalized
  };
}

function generateCoachPlan(assessment, logs = []) {
  const validation = validateAssessment(assessment);
  const safeAssessment = validation.normalized;

  if (!validation.valid) {
    return {
      id: createId("plan"),
      createdAt: new Date().toISOString(),
      version: COACH_SPEC_VERSION,
      safetyHold: true,
      validationHold: true,
      validation,
      risk: {
        blocked: true,
        label: "评估信息需要修正",
        boundary: validation.errors.join("")
      },
      metrics: {
        bmi: "--",
        bmiCategory: "未评估",
        bodyFat: null,
        fatLevel: "unknown",
        bodyStatusSource: "unknown",
        category: "未评估"
      },
      goal: {
        type: "需要重新填写评估",
        priority: "先把基础数据填在合理范围内，再生成训练计划。"
      },
      rationale: validation.errors.join("")
    };
  }

  const metrics = getMetrics(safeAssessment);
  const risk = getRisk(safeAssessment);

  if (risk.blocked) {
    return {
      id: createId("plan"),
      createdAt: new Date().toISOString(),
      safetyHold: true,
      risk,
      metrics,
      validation,
      goal: "暂不生成计划",
      rationale: "你填写了伤病或心血管风险。这个 MVP 不做康复诊断，建议先找线下医生或康复师评估。"
    };
  }

  const focusAreas = safeAssessment.focusAreas;
  const experience = getExperience(safeAssessment.trainingExperience);
  const review = summarizeLogs(logs);
  const goal = chooseGoal(safeAssessment, metrics);
  const trainingProfileBase = getTrainingProfile(safeAssessment, metrics, goal, experience);
  const arbitration = arbitratePlanParameters(safeAssessment, metrics, goal, experience, review, trainingProfileBase);
  const trainingProfile = arbitration.trainingProfile;
  const weeks = getWeekRulesForExperience(experience.id);
  const workouts = fitWorkoutsToSessionBudget(
    buildWorkouts(goal, focusAreas, experience.id, trainingProfile, arbitration.frequency.sessionsPerWeek),
    safeAssessment.sessionBudget
  );
  const frequency = {
    ...arbitration.frequency,
    pattern: describeWorkoutPattern(workouts)
  };
  const duration = chooseDuration(safeAssessment, metrics, goal, workouts, trainingProfile, weeks);

  return {
    id: createId("plan"),
    createdAt: new Date().toISOString(),
    version: COACH_SPEC_VERSION,
    safetyHold: false,
    validation,
    metrics,
    risk,
    goal,
    experience,
    trainingProfile,
    focusAreas: focusAreas.map((id) => FOCUS_BY_ID[id]),
    frequency,
    duration,
    review,
    arbitration,
    decisionSummary: arbitration.reason,
    workouts,
    weeks,
    rationale: buildRationale(goal, frequency, duration, metrics, review, focusAreas, experience),
    adjustmentGuide: "重新调整会读取最近训练里的完成动作、每个动作的感觉、整体强弱反馈和身体记录。觉得太弱或太强时，先在记录里选对应反馈，再回到计划页点重新调整。",
    progressionRules: [
      "每组最后几次应该吃力，但动作不变形。",
      "连续两次同动作都完成目标次数，并且感觉是刚好或偏轻松，下次小幅加重量。",
      "如果感觉是太难、有不适、刺痛、麻木或关节卡顿，立即停止该动作。",
      "连续两次选择太强，下周少做 1 组或减少一次训练。"
    ]
  };
}

function getCurrentWeek(plan, logs = []) {
  if (!plan || plan.safetyHold) return 1;
  const frequency = Number(plan.frequency?.sessionsPerWeek || 3);
  return Math.min(4, Math.floor(logs.length / Math.max(1, frequency)) + 1);
}

function getNextWorkout(plan, logs = []) {
  if (!plan || plan.safetyHold) return null;
  const index = logs.length % plan.workouts.length;
  return plan.workouts[index];
}

function getPrescription(exercise, weekNumber = 1, weekRules = WEEK_RULES) {
  const week = getWeekRule(weekNumber, weekRules);
  if (exercise.type === "cardio") {
    return {
      sets: "1 段",
      reps: exercise.target,
      rest: exercise.rest,
      effort: week.effort,
      effortText: week.effortText
    };
  }

  return {
    sets: `${getSetCount(exercise, weekNumber, weekRules)} 组`,
    reps: exercise.reps,
    rest: exercise.rest,
    effort: week.effort,
    effortText: week.effortText
  };
}

function getLoadRecommendation(exercise, assessment = {}, logs = [], weekNumber = 1) {
  if (!exercise || exercise.type !== "strength") return null;

  const profile = getLoadProfile(exercise);
  if (!profile) return null;

  const history = getLatestExerciseLoad(exercise, logs);
  if (history) {
    return getHistoryLoadRecommendation(exercise, profile, history, weekNumber);
  }

  return getEstimatedLoadRecommendation(exercise, assessment, profile, weekNumber);
}

function getWorkoutDuration(workout, weekNumber = 1, weekRules = WEEK_RULES) {
  if (!workout?.exercises?.length) {
    return {
      min: 0,
      max: 0,
      label: "未生成",
      note: "还没有可估算的训练安排。"
    };
  }

  let min = 0;
  let max = 0;
  let strengthSets = 0;

  for (const exercise of workout.exercises) {
    if (exercise.type === "cardio") {
      const range = parseMinuteRange(exercise.target);
      min += range.min;
      max += range.max;
      continue;
    }

    const sets = getSetCount(exercise, weekNumber, weekRules);
    const restMinutes = parseRestMinutes(exercise.rest);
    strengthSets += sets;
    min += sets * 1.5 + Math.max(0, sets - 1) * restMinutes + 2.25;
    max += sets * 2 + sets * restMinutes + 2.75;
  }

  const roundedMin = Math.max(strengthSets ? 25 : 5, roundUpToFive(min));
  let roundedMax = Math.max(roundedMin + 10, roundUpToFive(max));
  if (roundedMax - roundedMin > 20) {
    roundedMax = roundedMin + 20;
  }

  return {
    min: roundedMin,
    max: roundedMax,
    label: `${roundedMin}-${roundedMax} 分钟`,
    note: "已计入热身、组间休息和换器械调重量时间。"
  };
}

function getMetrics(assessment) {
  const heightM = Number(assessment.height) / 100;
  const weight = Number(assessment.weight);
  const bmi = heightM > 0 ? weight / (heightM * heightM) : 0;
  const bodyFat = Number(assessment.bodyFat || 0);
  const gender = assessment.gender;
  const leanLine = gender === "female" ? 22 : 15;
  const healthyFatLine = gender === "female" ? 28 : 20;
  const highFatLine = gender === "female" ? 32 : 25;
  const fatLevel = !bodyFat
    ? "unknown"
    : bodyFat <= leanLine
      ? "lean"
      : bodyFat <= healthyFatLine
        ? "healthy"
        : bodyFat >= highFatLine
          ? "high"
          : "moderate";

  return {
    bmi: round(bmi, 1),
    bmiCategory: getBmiCategory(bmi),
    bodyFat: bodyFat > 0 ? bodyFat : null,
    fatLevel,
    bodyStatusSource: bodyFat > 0 ? "bodyFat" : "bmi",
    category: getBodyStatusCategory(fatLevel, bmi, bodyFat > 0)
  };
}

function getBmiCategory(bmi) {
  if (bmi >= 28) return "高体重压力";
  if (bmi >= 24) return "偏重";
  if (bmi < 18.5) return "偏轻";
  return "正常范围";
}

function getBodyStatusCategory(fatLevel, bmi, hasBodyFat) {
  if (!hasBodyFat) return getBmiCategory(bmi);
  const labels = {
    lean: "低体脂",
    healthy: "体脂健康",
    moderate: "体脂略高",
    high: "体脂偏高",
    unknown: getBmiCategory(bmi)
  };
  return labels[fatLevel] || labels.unknown;
}

function buildWorkouts(goal, focusAreas, experienceId, trainingProfile, sessionsPerWeek = 3) {
  const isGain = goal.type.includes("增肌");
  const workoutCount = getWorkoutCountForFrequency(sessionsPerWeek);
  const selectedAreas = focusAreas.length ? focusAreas : ["chest", "back", "legs"];

  if (!isGain) {
    return tuneWorkoutsForProfile(
      applyFocusAdjustments(getBalancedWorkoutsForCount(workoutCount), focusAreas, experienceId),
      trainingProfile
    );
  }

  const selectedSet = new Set(selectedAreas);
  const workoutAreas = getWorkoutAreasForCount(selectedAreas, workoutCount);
  const workouts = workoutAreas.map((area) => buildFocusWorkout(area, experienceId, trainingProfile, !selectedSet.has(area)));

  return tuneWorkoutsForProfile(
    workouts.map((workout, index) => ({
      ...workout,
      id: String.fromCharCode(65 + index)
    })),
    trainingProfile
  );
}

function getWorkoutCountForFrequency(sessionsPerWeek) {
  const value = Number(sessionsPerWeek || 3);
  if (value <= 2) return 2;
  if (value >= 4) return 4;
  return 3;
}

function getBalancedWorkoutsForCount(workoutCount) {
  return [...WORKOUT_BLUEPRINTS, ...EXTRA_BALANCED_WORKOUTS].slice(0, workoutCount);
}

function getWorkoutAreasForCount(selectedAreas, workoutCount) {
  const areas = [];
  for (const area of selectedAreas) {
    if (!areas.includes(area)) areas.push(area);
    if (areas.length >= workoutCount) return areas;
  }

  while (areas.length < workoutCount) {
    const support = getSupportArea(areas, areas.length);
    if (!areas.includes(support)) {
      areas.push(support);
      continue;
    }
    break;
  }

  return areas;
}

function getTrainingProfile(assessment, metrics, goal, experience) {
  const budget = Number(assessment.sessionBudget || 60);
  const isGain = goal.type.includes("增肌");
  const leanGain = isGain && supportsLeanGain(metrics);
  const experienceRank = EXPERIENCE_RANK[experience.id] || 1;

  let volumeTier = "base";
  if (leanGain && budget >= 70 && experienceRank >= 2) {
    volumeTier = "hypertrophy";
  } else if (leanGain && budget >= 60) {
    volumeTier = experienceRank >= 2 ? "moderate-hypertrophy" : "base";
  } else if (isGain && budget >= 60 && experienceRank >= 3) {
    volumeTier = "moderate-hypertrophy";
  }

  if (budget <= 45 || experienceRank === 1) {
    volumeTier = budget <= 45 ? "compressed" : volumeTier;
  }

  return applyTrainingProfileTier({
    budget,
    isGain,
    leanGain,
    experienceRank,
    volumeTier,
    rationale: leanGain
      ? "低体脂或健康体脂下想增肌，训练重点应放在足够的有效组数、渐进负荷和恢复，而不是短时间打卡。"
      : "先按当前身体状态建立稳定训练容量，再根据记录逐步调整。"
  }, volumeTier);
}

function supportsLeanGain(metrics) {
  const leanOrHealthy = metrics.fatLevel === "lean" || metrics.fatLevel === "healthy";
  if (!leanOrHealthy) return false;
  if (metrics.bodyStatusSource === "bodyFat") return true;
  return metrics.bmi >= 19 && metrics.bmi < 25;
}

function applyTrainingProfileTier(profile, volumeTier) {
  const config = getVolumeConfig(volumeTier, profile.isGain, profile.experienceRank, profile.budget);
  return {
    ...profile,
    volumeTier,
    maxBaseSets: config.maxBaseSets,
    targetWeekOneMax: config.targetWeekOneMax,
    targetWeekThreeMax: config.targetWeekThreeMax,
    weeklySetAnchor: config.weeklySetAnchor
  };
}

function getVolumeConfig(volumeTier, isGain, experienceRank, budget) {
  const maxBaseSetsByTier = {
    compressed: 3,
    base: experienceRank >= 3 ? 4 : 3,
    "moderate-hypertrophy": 4,
    hypertrophy: 5
  };
  const targetWeekOneByTier = {
    compressed: Math.min(40, budget),
    base: Math.min(Math.max(45, Math.round(budget * 0.72 / 5) * 5), budget),
    "moderate-hypertrophy": Math.min(Math.max(50, Math.round(budget * 0.84 / 5) * 5), budget),
    hypertrophy: Math.min(Math.max(60, Math.round(budget * 0.86 / 5) * 5), budget)
  };
  const family = isGain ? "gain" : "other";

  return {
    maxBaseSets: maxBaseSetsByTier[volumeTier] || maxBaseSetsByTier.base,
    targetWeekOneMax: targetWeekOneByTier[volumeTier] || targetWeekOneByTier.base,
    targetWeekThreeMax: budget,
    weeklySetAnchor: WEEKLY_SET_ANCHORS[family][volumeTier] || WEEKLY_SET_ANCHORS[family].base
  };
}

function moveVolumeTier(volumeTier, direction) {
  const index = VOLUME_TIER_ORDER.indexOf(volumeTier);
  const safeIndex = index === -1 ? VOLUME_TIER_ORDER.indexOf("base") : index;
  const nextIndex = Math.max(0, Math.min(VOLUME_TIER_ORDER.length - 1, safeIndex + direction));
  return VOLUME_TIER_ORDER[nextIndex];
}

function tuneWorkoutsForProfile(workouts, trainingProfile) {
  if (!trainingProfile) return workouts;
  return workouts.map((workout) => expandWorkoutToProfile(workout, trainingProfile));
}

function expandWorkoutToProfile(workout, trainingProfile) {
  if (trainingProfile.volumeTier === "compressed") return workout;

  const fitted = {
    ...workout,
    exercises: workout.exercises.map((exercise, index) => ({
      ...exercise,
      priority: exercise.priority ?? getExercisePriority(exercise, index)
    }))
  };

  const blocked = new Set();
  for (let guard = 0; guard < 40; guard += 1) {
    const weekOne = getWorkoutDuration(fitted, 1);
    const weekThree = getWorkoutDuration(fitted, 3);
    if (weekOne.max >= trainingProfile.targetWeekOneMax || weekThree.max >= trainingProfile.targetWeekThreeMax) break;

    const candidateIndex = getNextExpandableExerciseIndex(fitted, trainingProfile, blocked);
    if (candidateIndex === -1) break;

    const previous = fitted.exercises[candidateIndex];
    fitted.exercises[candidateIndex] = {
      ...previous,
      baseSets: Number(previous.baseSets || 1) + 1,
      profileAdjusted: true
    };

    if (getWorkoutDuration(fitted, 3).max > trainingProfile.targetWeekThreeMax) {
      fitted.exercises[candidateIndex] = previous;
      blocked.add(previous.id);
    }
  }

  return {
    ...fitted,
    profileAdjusted: fitted.exercises.some((exercise) => exercise.profileAdjusted)
  };
}

function getExercisePriority(exercise, index) {
  if (exercise.type !== "strength") return 0;
  if (index <= 2) return 4;
  if (exercise.equipmentId === "smith-machine" || exercise.equipmentId === "leg-press" || exercise.equipmentId === "high-row") return 3;
  if (exercise.equipmentId === "cable-station" || exercise.equipmentId === "rear-delt") return 2;
  return 1;
}

function getNextExpandableExerciseIndex(workout, trainingProfile, blocked) {
  return workout.exercises
    .map((exercise, index) => ({ exercise, index }))
    .filter(({ exercise }) =>
      exercise.type === "strength" &&
      !blocked.has(exercise.id) &&
      Number(exercise.baseSets || 1) < trainingProfile.maxBaseSets
    )
    .sort((a, b) => {
      const priorityDiff = Number(b.exercise.priority || 0) - Number(a.exercise.priority || 0);
      if (priorityDiff) return priorityDiff;
      return Number(a.exercise.baseSets || 1) - Number(b.exercise.baseSets || 1);
    })[0]?.index ?? -1;
}

function fitWorkoutsToSessionBudget(workouts, sessionBudget) {
  const budget = Number(sessionBudget || 60);
  if (!Number.isFinite(budget) || budget <= 0) return workouts;

  return workouts.map((workout) => fitWorkoutToSessionBudget(workout, budget));
}

function fitWorkoutToSessionBudget(workout, budget) {
  const fitted = {
    ...workout,
    exercises: workout.exercises.map((exercise) => ({ ...exercise }))
  };

  for (let guard = 0; guard < 30 && getWorkoutDuration(fitted, 3).max > budget; guard += 1) {
    const strengthIndexes = fitted.exercises
      .map((exercise, index) => ({ exercise, index }))
      .filter((item) => item.exercise.type === "strength");

    const reducible = [...strengthIndexes]
      .reverse()
      .find((item, reverseIndex) => {
        const fromEnd = reverseIndex;
        return item.exercise.baseSets > 1 && (fromEnd <= strengthIndexes.length - 2 || strengthIndexes.length <= 3);
      });

    if (reducible) {
      fitted.exercises[reducible.index] = {
        ...reducible.exercise,
        baseSets: Math.max(1, Number(reducible.exercise.baseSets || 1) - 1),
        budgetAdjusted: true
      };
      continue;
    }

    const removableIndex = [...strengthIndexes]
      .reverse()
      .find((item) => strengthIndexes.length > 3 && !item.exercise.mustKeep)?.index;

    if (removableIndex !== undefined) {
      fitted.exercises = fitted.exercises.filter((_, index) => index !== removableIndex);
      continue;
    }

    break;
  }

  return {
    ...fitted,
    budgetAdjusted: fitted.exercises.some((exercise) => exercise.budgetAdjusted) || fitted.exercises.length < workout.exercises.length
  };
}

function buildFocusWorkout(area, experienceId, trainingProfile, support = false) {
  const titleByArea = {
    chest: support ? "胸肩辅助" : "胸部强化",
    shoulders: support ? "肩背辅助" : "肩部强化",
    back: support ? "背肩辅助" : "背部强化",
    legs: support ? "腿臀辅助" : "腿部强化",
    glutes: support ? "臀腿辅助" : "臀部强化",
    arms: support ? "手臂辅助" : "手臂强化",
    core: support ? "核心辅助" : "核心强化",
    cardio: support ? "心肺辅助" : "心肺强化"
  };
  const focusByArea = {
    chest: "主练胸，肩和三头只做辅助，不抢恢复",
    shoulders: "主练肩，兼顾后肩和肩胛稳定",
    back: "主练背，优先把下拉和划船做扎实",
    legs: "主练腿，股四头、臀和大腿后侧都覆盖",
    glutes: "主练臀，腿部动作只服务臀部发力",
    arms: "主练手臂，但保留推拉复合动作",
    core: "主练核心稳定，不做大量卷腹堆量",
    cardio: "以心肺为主，力量训练只做维持"
  };
  const exercisesByArea = {
    chest: [
      BASE_EXERCISES.treadmillWarmupShort,
      BASE_EXERCISES.chestPress,
      BASE_EXERCISES.smithInclinePress,
      BASE_EXERCISES.cableChestFly,
      BASE_EXERCISES.shoulderPress
    ],
    shoulders: [
      BASE_EXERCISES.treadmillWarmupShort,
      BASE_EXERCISES.shoulderPress,
      BASE_EXERCISES.rearDelt,
      BASE_EXERCISES.chestPress,
      BASE_EXERCISES.seatedRow
    ],
    back: [
      BASE_EXERCISES.treadmillWarmupShort,
      BASE_EXERCISES.latPulldown,
      BASE_EXERCISES.seatedRow,
      BASE_EXERCISES.assistedPullup,
      BASE_EXERCISES.rearDelt
    ],
    legs: [
      BASE_EXERCISES.treadmillWarmupShort,
      BASE_EXERCISES.legPress,
      BASE_EXERCISES.smithBoxSquat,
      BASE_EXERCISES.legCurl,
      BASE_EXERCISES.hipThrust
    ],
    glutes: [
      BASE_EXERCISES.treadmillWarmupShort,
      BASE_EXERCISES.hipThrust,
      BASE_EXERCISES.legPress,
      BASE_EXERCISES.legCurl,
      BASE_EXERCISES.dumbbellGobletSquat
    ],
    arms: [
      BASE_EXERCISES.treadmillWarmupShort,
      BASE_EXERCISES.cableArmTraining,
      BASE_EXERCISES.latPulldown,
      BASE_EXERCISES.chestPress,
      BASE_EXERCISES.dumbbellCarry
    ],
    core: [
      BASE_EXERCISES.treadmillWarmupShort,
      BASE_EXERCISES.dumbbellCarry,
      BASE_EXERCISES.seatedRow,
      BASE_EXERCISES.legPress,
      BASE_EXERCISES.rowingFinish
    ],
    cardio: [
      BASE_EXERCISES.ellipticalWarmup,
      BASE_EXERCISES.rowingFinish,
      BASE_EXERCISES.treadmillFinish,
      BASE_EXERCISES.dumbbellCarry
    ]
  };

  return {
    id: area,
    title: titleByArea[area] || "重点强化",
    focus: focusByArea[area] || "围绕你选择的方向安排训练",
    exercises: scaleForExperience(exercisesByArea[area] || exercisesByArea.chest, experienceId)
  };
}

function scaleForExperience(exercises, experienceId) {
  const setBonus = experienceId === "years" || experienceId === "coach" ? 1 : 0;
  return exercises.map((exercise) => ({
    ...exercise,
    baseSets: exercise.type === "strength" ? Number(exercise.baseSets || 1) + setBonus : exercise.baseSets
  }));
}

function getSupportArea(selectedAreas, index) {
  const supportOrder = ["back", "legs", "chest", "shoulders", "glutes"];
  return supportOrder.find((area) => !selectedAreas.includes(area)) || supportOrder[index % supportOrder.length];
}

function describeWorkoutPattern(workouts) {
  return workouts.map((workout) => workout.title).join(" / ");
}

function applyFocusAdjustments(blueprints, focusAreas, experienceId = "beginner") {
  const additions = focusAreas.flatMap((area) => FOCUS_EXERCISES[area] || []);
  const uniqueAdditions = uniqueExercises(additions);

  return blueprints.map((workout, index) => {
    const exercises = scaleForExperience(workout.exercises, experienceId);
    const extra = chooseExtraExercise(uniqueAdditions, exercises, index);
    const focusText = focusAreas.length ? `；本次加一点${focusAreas.map((id) => FOCUS_BY_ID[id].label).join("、")}强化` : "";

    if (!extra) {
      return {
        ...workout,
        focus: `${workout.focus}${focusText}`,
        exercises
      };
    }

    return {
      ...workout,
      focus: `${workout.focus}${focusText}`,
      exercises: insertBeforeLastCardio(exercises, { ...extra, focusTag: "重点强化" })
    };
  });
}

function chooseExtraExercise(additions, existing, index) {
  if (!additions.length) return null;
  const existingIds = new Set(existing.map((exercise) => exercise.id));
  for (let offset = 0; offset < additions.length; offset += 1) {
    const candidate = additions[(index + offset) % additions.length];
    if (!existingIds.has(candidate.id)) return candidate;
  }
  return null;
}

function insertBeforeLastCardio(exercises, extra) {
  const lastCardioIndex = exercises.map((exercise) => exercise.type).lastIndexOf("cardio");
  const insertIndex = lastCardioIndex > 0 ? lastCardioIndex : exercises.length;
  return [...exercises.slice(0, insertIndex), extra, ...exercises.slice(insertIndex)];
}

function uniqueExercises(exercises) {
  const seen = new Set();
  return exercises.filter((exercise) => {
    if (seen.has(exercise.id)) return false;
    seen.add(exercise.id);
    return true;
  });
}

function chooseGoal(assessment, metrics) {
  const preference = assessment.targetPreference || "auto";
  const wantsGain = preference === "gain";
  const wantsFatLoss = preference === "fat-loss";
  const leanOrHealthy = metrics.fatLevel === "lean" || metrics.fatLevel === "healthy";
  const hasBodyFat = metrics.bodyStatusSource === "bodyFat";
  const highFat = metrics.fatLevel === "high" || (!hasBodyFat && metrics.bmi >= 27);
  const bmiFatLossSignal = !hasBodyFat && metrics.bmi >= 24;

  if (wantsGain && leanOrHealthy && supportsLeanGain(metrics)) {
    return {
      type: "精益增肌期",
      priority: "当前体脂和体重都适合增肌，重点是增加肌肉量，同时尽量少涨脂肪",
      nutrition: "训练日轻微热量盈余，蛋白质优先，体重每周上涨 0.2-0.4kg 即可。"
    };
  }

  if (wantsGain && metrics.bmi < 20) {
    return {
      type: "增肌打底期",
      priority: "体重偏轻，先把训练习惯、力量基础和总摄入稳定起来",
      nutrition: "每餐保证蛋白质和主食，先追求体重缓慢上升。"
    };
  }

  if (wantsGain && highFat) {
    return {
      type: "体态重建期",
      priority: "不建议直接大幅增重，先用力量训练提升肌肉刺激，同时控制体脂继续上升",
      nutrition: "蛋白质达标，热量先接近维持，不做明显热量盈余。"
    };
  }

  if (wantsGain) {
    return {
      type: "增肌基础期",
      priority: "数据没有明显减脂优先信号，按增肌目标建立力量基础和训练容量",
      nutrition: "蛋白质达标，训练日适当增加主食，观察体重和围度变化。"
    };
  }

  if (metrics.bodyFat && highFat) {
    return {
      type: "减脂基础期",
      priority: "先降低体脂和建立训练习惯",
      nutrition: "蛋白质优先，每餐有优质蛋白，先不做极端节食。"
    };
  }

  if (wantsFatLoss || bmiFatLossSignal) {
    return {
      type: "减脂塑形基础期",
      priority: "先降低体脂压力，同时保住力量训练和肌肉量",
      nutrition: "控制总热量，减少含糖饮料和夜宵。"
    };
  }

  if (metrics.bmi < 20) {
    return {
      type: "增肌打底期",
      priority: "先学会稳定动作，再增加训练容量和饮食摄入",
      nutrition: "每餐保证蛋白质，训练日适当增加主食。"
    };
  }

  return {
    type: preference === "fat-loss" ? "减脂塑形基础期" : "体态塑形基础期",
    priority: "先提升动作质量、力量基础和心肺耐受",
    nutrition: "保持规律三餐，蛋白质和蔬菜先达标。"
  };
}

function chooseFrequency(assessment, metrics, goal, experience) {
  const cap = normalizeWeeklyLimit(assessment.weeklyLimit);
  const recoveryRisk = metrics.bmi >= 30 || Number(assessment.age) >= 50;
  const isGain = goal?.type?.includes("增肌");
  const experienceRank = EXPERIENCE_RANK[experience?.id] || 1;
  let sessionsPerWeek = recoveryRisk ? 2 : 3;

  if (cap === "2") {
    sessionsPerWeek = 2;
  } else if (cap === "3") {
    sessionsPerWeek = recoveryRisk ? 2 : 3;
  } else if (cap === "4") {
    sessionsPerWeek = recoveryRisk || experienceRank === 1 ? 3 : 4;
  } else if (isGain && experienceRank >= 3 && !recoveryRisk && Number(assessment.sessionBudget || 0) >= 75) {
    sessionsPerWeek = 3;
  }

  return {
    sessionsPerWeek,
    requestedLimit: cap,
    limitLabel: getWeeklyLimitLabel(cap),
    pattern: getBaseFrequencyPattern(sessionsPerWeek),
    restDays: "两次力量训练之间尽量间隔 1 天"
  };
}

function arbitratePlanParameters(assessment, metrics, goal, experience, review, trainingProfileBase) {
  const baseFrequency = chooseFrequency(assessment, metrics, goal, experience);
  const limit = baseFrequency.requestedLimit;
  const experienceRank = EXPERIENCE_RANK[experience?.id] || 1;
  let sessionsPerWeek = baseFrequency.sessionsPerWeek;
  let volumeTier = trainingProfileBase.volumeTier;
  const reasons = [];
  const signals = {
    goalStage: goal.type,
    weeklyLimit: limit,
    sessionBudget: trainingProfileBase.budget,
    baseSessions: baseFrequency.sessionsPerWeek,
    reviewStatus: review.status,
    baseVolumeTier: trainingProfileBase.volumeTier
  };

  if (review.status === "overloaded") {
    sessionsPerWeek = Math.max(2, sessionsPerWeek - 1);
    volumeTier = moveVolumeTier(volumeTier, -1);
    reasons.push(`近 ${review.trendWindow || 2} 次反馈偏强，本轮频次或容量下调一档。`);
  } else if (review.status === "ready") {
    volumeTier = moveVolumeTier(volumeTier, 1);
    if (limit === "4" && experienceRank >= 3 && sessionsPerWeek < 4) {
      sessionsPerWeek += 1;
    }
    reasons.push(`近 ${review.trendWindow || 2} 次反馈偏轻松，本轮容量小幅上调。`);
  }

  if (limit === "2") {
    sessionsPerWeek = Math.min(sessionsPerWeek, 2);
  } else if (limit === "3") {
    sessionsPerWeek = Math.min(sessionsPerWeek, 3);
  } else if (limit === "4") {
    sessionsPerWeek = Math.min(sessionsPerWeek, 4);
  }

  sessionsPerWeek = Math.max(2, Math.min(4, sessionsPerWeek));

  if (!reasons.length) {
    reasons.push("本轮按你的目标、每周上限、单次时长和恢复风险维持计划参数。");
  }

  const trainingProfile = applyTrainingProfileTier(trainingProfileBase, volumeTier);

  return {
    frequency: {
      ...baseFrequency,
      sessionsPerWeek,
      pattern: getBaseFrequencyPattern(sessionsPerWeek)
    },
    trainingProfile,
    reason: reasons.join(""),
    trace: {
      ...signals,
      finalSessions: sessionsPerWeek,
      finalVolumeTier: volumeTier,
      weeklySetAnchor: trainingProfile.weeklySetAnchor,
      rule: "安全/疲劳优先，其次看近 2-3 次记录趋势，最后满足目标阶段诉求。"
    }
  };
}

function normalizeWeeklyLimit(value = "coach") {
  const normalized = String(value || "coach");
  return ["coach", "2", "3", "4"].includes(normalized) ? normalized : "coach";
}

function getWeeklyLimitLabel(value) {
  const labels = {
    coach: "教练安排",
    2: "最多 2 次",
    3: "约 3 次",
    4: "4 次以上"
  };
  return labels[value] || labels.coach;
}

function getBaseFrequencyPattern(sessionsPerWeek) {
  if (sessionsPerWeek <= 2) return "A/B 交替，每周 2 次";
  if (sessionsPerWeek >= 4) return "A/B/C/D 轮换，每周 4 次";
  return "A/B/C 轮换，每周 3 次";
}

function chooseDuration(assessment, metrics, goal, workouts, trainingProfile, weekRules = WEEK_RULES) {
  const budget = Number(assessment.sessionBudget || 60);
  const isGain = goal.type.includes("增肌");
  const weekOne = getPlanDurationRange(workouts, 1, weekRules);
  const progression = getPlanDurationRange(workouts, 3, weekRules);
  const budgetNote = budget && progression.max > budget
    ? `如果当天只有 ${budget} 分钟，优先完成主练动作，辅助动作少做 1 组。`
    : `已按你在评估里选择的单次 ${budget} 分钟上限安排动作和组数；不需要为了凑时长额外加有氧。`;

  return {
    minutes: weekOne.max,
    min: weekOne.min,
    max: weekOne.max,
    budget,
    trainingProfile,
    label: weekOne.label,
    progressionLabel: progression.label,
    split: isGain
      ? `第 1 周单次约 ${weekOne.label}，第 2-3 周随组数增加约 ${progression.label}。热身、休息、换器械已计入；增肌日不强制长有氧。${budgetNote}`
      : `第 1 周单次约 ${weekOne.label}，第 2-3 周随组数增加约 ${progression.label}。热身、力量和放松心肺已计入。`
  };
}

function getPlanDurationRange(workouts, weekNumber, weekRules = WEEK_RULES) {
  const durations = workouts.map((workout) => getWorkoutDuration(workout, weekNumber, weekRules));
  const min = Math.min(...durations.map((duration) => duration.min));
  const max = Math.max(...durations.map((duration) => duration.max));
  return {
    min,
    max,
    label: `${min}-${max} 分钟`
  };
}

function getSetCount(exercise, weekNumber, weekRules = WEEK_RULES) {
  const week = getWeekRule(weekNumber, weekRules);
  return Math.max(1, Number(exercise.baseSets || 1) + week.setOffset);
}

function getWeekRule(weekNumber, weekRules = WEEK_RULES) {
  return weekRules[Math.max(0, Math.min(weekRules.length - 1, Number(weekNumber || 1) - 1))] || WEEK_RULES[0];
}

function getWeekRulesForExperience(experienceId) {
  if (experienceId !== "years" && experienceId !== "coach") return WEEK_RULES;
  return WEEK_RULES.map((week) => {
    if (week.week !== 4) return week;
    return {
      ...week,
      label: "减载复盘周",
      setOffset: -2,
      effort: "5-6/10",
      effortText: "明显轻一点，恢复优先，动作仍然标准",
      load: "容量和强度下调约 40-50%",
      rule: "不追重量，只保留动作质量，用记录决定下一轮加量。"
    };
  });
}

function parseMinuteRange(text = "") {
  const rangeMatch = String(text).match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*分钟/);
  if (rangeMatch) {
    return {
      min: Number(rangeMatch[1]),
      max: Number(rangeMatch[2])
    };
  }

  const singleMatch = String(text).match(/(\d+(?:\.\d+)?)\s*分钟/);
  if (singleMatch) {
    const value = Number(singleMatch[1]);
    return {
      min: value,
      max: value
    };
  }

  return {
    min: 4,
    max: 6
  };
}

function parseRestMinutes(text = "") {
  const secondsMatch = String(text).match(/(\d+(?:\.\d+)?)\s*秒/);
  if (secondsMatch) return Number(secondsMatch[1]) / 60;

  const minutesMatch = String(text).match(/(\d+(?:\.\d+)?)\s*分钟/);
  if (minutesMatch) return Number(minutesMatch[1]);

  return 1;
}

function getLoadProfile(exercise) {
  return LOAD_PROFILES[exercise.id] || LOAD_PROFILES[exercise.loadProfileId];
}

function getEstimatedLoadRecommendation(exercise, assessment, profile, weekNumber) {
  const bodyWeight = Number(assessment.weight || 65);
  const experienceId = getExperience(assessment.trainingExperience).id;
  const baseCoefficient = profile.coefficients[experienceId] || profile.coefficients.beginner;
  const value = clampLoad(
    bodyWeight * baseCoefficient * getLoadSexFactor(profile, assessment.gender) * getLoadAgeFactor(assessment.age) * getLoadGoalFactor(assessment, experienceId) * getWeekLoadFactor(weekNumber),
    profile
  );
  const range = getRoundedLoadRange(value, profile);

  return {
    source: "estimate",
    label: `${getLoadPrefix(profile)}${formatLoadRange(range, profile)}`,
    shortLabel: formatLoadRange(range, profile),
    inputPlaceholder: formatLoadInputHint(range, profile),
    detail: `${getLoadPrefix(profile)}${formatLoadRange(range, profile)}；先从下限试 1 组，动作稳再做正式组。`,
    caution: "以目标次数和动作质量为准，不做极限测试。"
  };
}

function getHistoryLoadRecommendation(exercise, profile, history, weekNumber) {
  const step = getBoundedLoadStep(profile, history.value);
  const target = getRepTarget(exercise.reps);
  const reps = parseRepNumbers(history.reps);
  const completedTopReps = reps.length ? reps.every((value) => value >= target.max) : false;
  const tooHard = history.feeling >= 6 || history.intensityFeedback === "too-hard";
  const tooEasy = history.feeling <= 2 || history.intensityFeedback === "too-easy" || completedTopReps;
  let next = history.value;
  let reason = "上次反馈刚好，这次先维持";

  if (profile.kind === "assistance") {
    if (tooHard) {
      next = history.value + step;
      reason = "上次偏吃力，这次增加助力";
    } else if (tooEasy) {
      next = history.value - step;
      reason = "上次偏轻松，这次减少助力";
    }
  } else if (tooHard) {
    next = history.value - step;
    reason = "上次偏吃力，这次降一档";
  } else if (tooEasy) {
    next = history.value + step;
    reason = "上次完成度不错，这次加一档";
  }

  const adjusted = roundAdjustedLoad(next * getWeekLoadFactorForHistory(weekNumber), profile, history.value);
  if (adjusted === history.value && next !== history.value) {
    reason = "受单次调整上限和器械刻度限制，这次先维持";
  }
  const formatted = formatSingleLoad(adjusted, profile);

  return {
    source: "history",
    label: `${getLoadPrefix(profile)}${formatted}`,
    shortLabel: formatted,
    inputPlaceholder: formatLoadNumber(adjusted),
    detail: `${reason}：参考上次 ${formatSingleLoad(history.value, profile)}。`,
    caution: profile.kind === "assistance"
      ? "助力数字越大越轻松，能稳定完成目标次数后再减少助力。"
      : "单次重量调整不超过约 5-10%；如果第一组动作变形，立刻降一档。"
  };
}

function getLatestExerciseLoad(exercise, logs = []) {
  for (let logIndex = logs.length - 1; logIndex >= 0; logIndex -= 1) {
    const log = logs[logIndex];
    const match = (log.exercises || []).find((item) =>
      item.done &&
      item.type !== "cardio" &&
      (item.exerciseId === exercise.id || item.name === exercise.name)
    );
    const value = parseFirstNumber(match?.weight);
    if (value !== null) {
      return {
        value,
        reps: match.reps,
        feeling: Number(match.feeling || legacyPainToFeeling(match.pain)),
        intensityFeedback: log.intensityFeedback
      };
    }
  }
  return null;
}

function getLoadSexFactor(profile, gender) {
  if (gender !== "female") return 1;
  if (profile.region === "lower") return 0.78;
  if (profile.region === "full") return 0.72;
  return 0.64;
}

function getLoadAgeFactor(age) {
  const value = Number(age || 0);
  if (value >= 55) return 0.82;
  if (value >= 45) return 0.9;
  if (value >= 38) return 0.95;
  return 1;
}

function getLoadGoalFactor(assessment, experienceId) {
  const rank = EXPERIENCE_RANK[experienceId] || 1;
  if (assessment.targetPreference === "gain" && rank >= 2) return 1.05;
  if (assessment.targetPreference === "fat-loss") return 0.95;
  return 1;
}

function getWeekLoadFactor(weekNumber) {
  const factors = [0.9, 1, 1.05, 0.9];
  return factors[Math.max(0, Math.min(3, Number(weekNumber || 1) - 1))];
}

function getWeekLoadFactorForHistory(weekNumber) {
  return Number(weekNumber) === 4 ? 0.95 : 1;
}

function getRoundedLoadRange(value, profile) {
  const spread = profile.kind === "assistance" ? 0.12 : 0.16;
  const low = roundToStep(clampLoad(value * (1 - spread), profile), profile.step);
  const high = roundToStep(clampLoad(value * (1 + spread), profile), profile.step);
  return high <= low
    ? { low, high: roundToStep(clampLoad(low + profile.step, profile), profile.step) }
    : { low, high };
}

function clampLoad(value, profile) {
  return Math.max(profile.min, Math.min(profile.max, Number(value || profile.min)));
}

function getLoadStep(profile, value) {
  if (profile.step) return profile.step;
  if (value >= 80) return 5;
  if (value >= 25) return 2.5;
  return 1;
}

function getBoundedLoadStep(profile, value) {
  const baseStep = getLoadStep(profile, value);
  const percentCap = Math.max(1, Number(value || 0) * 0.1);
  return Math.min(baseStep, percentCap);
}

function roundAdjustedLoad(value, profile, previousValue = null) {
  const fineStep = profile.step >= 5 ? 2.5 : profile.step;
  let capped = clampLoad(value, profile);
  if (Number.isFinite(previousValue) && previousValue > 0) {
    const lower = previousValue * 0.9;
    const upper = previousValue * 1.1;
    capped = Math.max(lower, Math.min(upper, capped));
    let rounded = roundToStep(capped, fineStep);
    if (rounded > upper) rounded = Math.floor(upper / fineStep) * fineStep;
    if (rounded < lower) rounded = Math.ceil(lower / fineStep) * fineStep;
    return roundToStep(clampLoad(rounded, profile), fineStep);
  }
  return roundToStep(capped, fineStep);
}

function roundToStep(value, step = 2.5) {
  const rounded = Math.round(Number(value || 0) / step) * step;
  return Number(rounded.toFixed(1));
}

function getRepTarget(text = "") {
  const rangeMatch = String(text).match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    return {
      min: Number(rangeMatch[1]),
      max: Number(rangeMatch[2])
    };
  }

  const singleMatch = String(text).match(/(\d+)/);
  const value = singleMatch ? Number(singleMatch[1]) : 10;
  return {
    min: value,
    max: value
  };
}

function parseRepNumbers(value = "") {
  return String(value).match(/\d+/g)?.map(Number).filter((item) => Number.isFinite(item)) || [];
}

function parseFirstNumber(value = "") {
  const match = String(value).match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function getLoadPrefix(profile) {
  return profile.kind === "assistance" ? "建议助力：" : "建议起步：";
}

function formatLoadRange(range, profile) {
  if (range.low === range.high) return formatSingleLoad(range.low, profile);
  return `${formatLoadNumber(range.low)}-${formatLoadNumber(range.high)}${profile.unit}`;
}

function formatSingleLoad(value, profile) {
  return `${formatLoadNumber(value)}${profile.unit}`;
}

function formatLoadInputHint(range, profile) {
  if (range.low === range.high) return formatLoadNumber(range.low);
  return `${formatLoadNumber(range.low)}-${formatLoadNumber(range.high)}`;
}

function formatLoadNumber(value) {
  return Number(value).toFixed(Number.isInteger(value) ? 0 : 1);
}

function getRisk(assessment) {
  const injury = assessment.injury || "none";
  const blocked = injury !== "none";
  const labels = {
    none: "无明显伤病",
    knee: "膝盖疼痛或旧伤",
    back: "腰背疼痛或旧伤",
    shoulder: "肩颈疼痛或旧伤",
    heart: "心血管风险或医生限制运动"
  };

  return {
    blocked,
    label: labels[injury] || labels.none,
    boundary: blocked
      ? "当前版本不提供伤病康复计划，请先完成线下专业评估。"
      : "默认不做极限测试，不安排大重量自由深蹲、硬拉、卧推。"
  };
}

function summarizeLogs(logs = []) {
  if (!logs.length) {
    return {
      status: "new",
      trendWindow: 0,
      completionRate: 0,
      averageFeeling: 4,
      recommendation: "先完成 2-3 次训练记录，再做个性化调整。"
    };
  }

  const recent = logs.slice(-3);
  const completed = recent.filter((log) => log.completedCount > 0).length;
  const feelingValues = recent.flatMap((log) =>
    (log.exercises || []).map((item) => Number(item.feeling || legacyPainToFeeling(item.pain)))
      .filter((value) => Number.isFinite(value))
  );
  const averageFeeling = average(feelingValues);
  const tooHardCount = recent.filter((log) => log.intensityFeedback === "too-hard").length;
  const tooEasyCount = recent.filter((log) => log.intensityFeedback === "too-easy").length;
  let status = "steady";
  let recommendation = "保持当前训练量，优先把动作做稳。";

  if (recent.length >= 2 && (tooHardCount >= 2 || averageFeeling >= 5.8)) {
    status = "overloaded";
    recommendation = "近几次反馈偏强。下周降低训练量，不增加重量，优先保证动作和恢复。";
  } else if (recent.length >= 2 && (tooEasyCount >= 2 || (completed >= 2 && averageFeeling <= 2.6))) {
    status = "ready";
    recommendation = "近几次反馈偏轻松。可以小幅进阶：优先加一点重量或主动作多做 1 组。";
  }

  return {
    status,
    trendWindow: recent.length,
    completionRate: round(completed / recent.length, 2),
    averageFeeling: round(averageFeeling, 1),
    recommendation
  };
}

function buildRationale(goal, frequency, duration, metrics, review, focusAreas, experience) {
  const focusText = focusAreas.length
    ? `你还选择了重点加强「${focusAreas.map((id) => FOCUS_BY_ID[id].label).join("、")}」，计划会按部位拆分训练日，而不是每次都混练一点。`
    : "你没有选择单一重点部位，所以先做全身均衡安排。";
  const base = `你的当前阶段更适合「${goal.type}」。依据是 BMI ${metrics.bmi}、体脂${metrics.bodyFat ? `${metrics.bodyFat}%` : "未知"}、目标偏好和训练经验「${experience.label}」。`;
  const cadence = `因此先安排每周 ${frequency.sessionsPerWeek} 次，第 1 周每次约 ${duration.label}，训练结构为${frequency.pattern}。`;
  const volume = duration.trainingProfile?.rationale ? `${duration.trainingProfile.rationale}` : "";
  const adjust = review.status === "new" ? "完成第一周记录后，再根据感觉、强弱反馈和完成度调整。" : review.recommendation;
  return `${base}${cadence}${focusText}${volume}${adjust}`;
}

function normalizeFocusAreas(focusAreas = []) {
  const list = Array.isArray(focusAreas) ? focusAreas : [focusAreas].filter(Boolean);
  const normalized = list.filter((id) => FOCUS_BY_ID[id]);
  if (normalized.includes("legs")) {
    return ["legs", ...normalized.filter((id) => id !== "legs")].slice(0, 3);
  }
  return normalized.slice(0, 3);
}

function getExperience(trainingExperience = "beginner") {
  return EXPERIENCE_BY_ID[trainingExperience] || EXPERIENCE_BY_ID.beginner;
}

function legacyPainToFeeling(pain) {
  const value = Number(pain || 0);
  if (value >= 4) return 7;
  if (value >= 2) return 5;
  return 4;
}

function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function average(values) {
  const cleaned = values.map(Number).filter((value) => Number.isFinite(value));
  if (!cleaned.length) return 0;
  return cleaned.reduce((sum, value) => sum + value, 0) / cleaned.length;
}

function round(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function roundUpToFive(value) {
  return Math.ceil(Number(value || 0) / 5) * 5;
}


function cloneForWeapp(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureWeappEquipmentImage(item) {
  const imageSrc = item && item.imageSrc ? item.imageSrc : '/assets/equipment/dumbbell-rack.png';
  return imageSrc
    .replace('/public/assets/equipment/', '/assets/equipment/')
    .replace('/public/assets/smith-machine.png', '/assets/equipment/smith-machine.png');
}

function getAssessmentFromPlan(plan) {
  return (plan && plan.assessmentSnapshot) || {};
}

function decorateExerciseForWeapp(exercise, context) {
  const safeContext = context || {};
  const week = Number(safeContext.week || 1);
  const plan = safeContext.plan || {};
  const assessment = safeContext.assessment || getAssessmentFromPlan(plan);
  const logs = safeContext.logs || [];
  const weekRules = plan.weeks || WEEK_RULES;
  const equipment = EQUIPMENT_BY_ID[exercise && exercise.equipmentId] || EQUIPMENT_BY_ID['dumbbell-rack'] || {};
  const target = getPrescription(exercise, week, weekRules);
  const load = getLoadRecommendation(exercise, assessment, logs, week);
  return Object.assign({}, cloneForWeapp(exercise), {
    sourceExerciseId: exercise.sourceExerciseId || exercise.id,
    equipmentName: equipment.name || '训练器械',
    image: ensureWeappEquipmentImage(equipment),
    sets: target.sets,
    reps: target.reps,
    rest: target.rest,
    effort: target.effort,
    effortText: target.effortText || '',
    cue: target.effortText || (exercise.cues && exercise.cues[0]) || '',
    cues: exercise.cues || [],
    load: load ? load.shortLabel : '',
    loadLabel: load ? load.label : '',
    loadDetail: load ? load.detail : '',
    loadCaution: load ? load.caution : ''
  });
}

function decorateWorkoutForWeapp(workout, context) {
  return Object.assign({}, cloneForWeapp(workout), {
    exercises: ((workout && workout.exercises) || []).map(function (exercise) {
      return decorateExerciseForWeapp(exercise, context || {});
    })
  });
}

function decoratePlanForWeapp(plan, context) {
  if (!plan) return plan;
  const safeContext = context || {};
  const safePlan = cloneForWeapp(plan);
  const assessment = safeContext.assessment || safePlan.assessmentSnapshot || {};
  const logs = safeContext.logs || [];
  const week = Number(safeContext.week || 1);
  return Object.assign({}, safePlan, {
    assessmentSnapshot: assessment,
    focusText: (safePlan.focusAreas || []).map(function (item) { return item && item.label; }).filter(Boolean).join('、'),
    workouts: (safePlan.workouts || []).map(function (workout) {
      return decorateWorkoutForWeapp(workout, {
        plan: safePlan,
        assessment: assessment,
        logs: logs,
        week: week
      });
    })
  });
}

function normalizeAssessment(form) {
  return validateAssessment(form || {}).normalized;
}

function generatePlan(input, logs) {
  const assessment = normalizeAssessment(input || {});
  const safeLogs = logs || [];
  const plan = generateCoachPlan(assessment, safeLogs);
  return decoratePlanForWeapp(Object.assign({}, plan, {
    assessmentSnapshot: assessment,
    modelSource: 'pwa-v2'
  }), { assessment: assessment, logs: safeLogs, week: 1 });
}

function shouldRegeneratePlan(plan) {
  return !plan || plan.version !== COACH_SPEC_VERSION || plan.modelSource !== 'pwa-v2' || !plan.arbitration;
}

function createDemoUser() {
  const assessment = normalizeAssessment({
    age: 28,
    gender: 'male',
    height: 170,
    weight: 65,
    bodyFat: 14,
    targetPreference: 'gain',
    trainingExperience: 'familiar',
    weeklyLimit: '3',
    sessionBudget: 75,
    injury: 'none',
    focusAreas: ['chest', 'back']
  });
  return {
    id: 'demo-user',
    openid: '',
    assessment: assessment,
    plan: generatePlan(assessment, [])
  };
}

function getEquipment() {
  return EQUIPMENT
    .filter(function (item) { return VISIBLE_EQUIPMENT_IDS.includes(item.id); })
    .map(function (item) {
      return Object.assign({}, cloneForWeapp(item), {
        image: ensureWeappEquipmentImage(item),
        muscles: (item.muscles || []).join(' / '),
        setup: (item.setup || []).join('。'),
        mistakes: (item.mistakes || []).join('。')
      });
    });
}

function getExerciseOptions() {
  return PLAN_EXERCISES.map(function (exercise) {
    const decorated = decorateExerciseForWeapp(exercise, { week: 1 });
    return {
      key: exercise.id,
      id: exercise.id,
      name: decorated.name,
      equipmentName: decorated.equipmentName,
      type: decorated.type,
      sets: decorated.sets,
      reps: decorated.reps,
      load: decorated.load,
      effort: decorated.effort,
      cue: decorated.cue,
      image: decorated.image
    };
  });
}

function createExerciseFromKey(key) {
  const source = PLAN_EXERCISES.find(function (exercise) { return exercise.id === key; }) ||
    PLAN_EXERCISES.find(function (exercise) { return exercise.id === 'chest-press'; }) ||
    PLAN_EXERCISES[0];
  return decorateExerciseForWeapp(Object.assign({}, cloneForWeapp(source), {
    id: source.id + '-' + Date.now().toString(16),
    sourceExerciseId: source.id
  }), { week: 1 });
}

function getBaseExerciseIdForWeapp(exercise) {
  if (!exercise) return '';
  if (PLAN_EXERCISES.some(function (item) { return item.id === exercise.sourceExerciseId; })) return exercise.sourceExerciseId;
  if (PLAN_EXERCISES.some(function (item) { return item.id === exercise.id; })) return exercise.id;
  const match = PLAN_EXERCISES.find(function (item) {
    return item.name === exercise.name && item.equipmentId === exercise.equipmentId;
  });
  return (match && match.id) || exercise.id || '';
}

function getExerciseAreaForWeapp(exercise) {
  const equipment = EQUIPMENT_BY_ID[exercise && exercise.equipmentId] || {};
  const text = String((exercise && exercise.name) || '') + ' ' + ((equipment.muscles || []).join(' '));
  if (/胸|推胸/.test(text)) return '胸';
  if (/背|下拉|划船|引体/.test(text)) return '背';
  if (/腿|蹬腿|深蹲|股四头/.test(text)) return '腿';
  if (/臀|髋/.test(text)) return '臀';
  if (/肩|后肩|推举/.test(text)) return '肩';
  if (/二头|三头|手臂/.test(text)) return '手臂';
  if (/核心|卷腹|农夫走/.test(text)) return '核心';
  return '全身';
}

function createExerciseFromLibraryForWeapp(exerciseId) {
  const source = PLAN_EXERCISES.find(function (item) { return item.id === exerciseId; });
  if (!source) return null;
  return Object.assign({}, cloneForWeapp(source), {
    sourceExerciseId: source.id
  });
}

function getPrimaryExerciseForEquipment(equipmentId) {
  return PLAN_EXERCISES.find(function (exercise) { return exercise.equipmentId === equipmentId; }) || null;
}

function getRelatedExercisesForWeapp(exercise, context) {
  const baseId = getBaseExerciseIdForWeapp(exercise);
  const area = getExerciseAreaForWeapp(exercise);
  const sameEquipment = PLAN_EXERCISES.filter(function (item) {
    return item.id !== baseId && item.equipmentId === exercise.equipmentId;
  });
  const sameArea = PLAN_EXERCISES.filter(function (item) {
    return item.id !== baseId && item.equipmentId !== exercise.equipmentId && getExerciseAreaForWeapp(item) === area;
  });
  return sameEquipment.concat(sameArea).slice(0, 3).map(function (item) {
    return decorateExerciseForWeapp(item, context || {});
  });
}

function getExerciseInstructionStepsForWeapp(exercise, equipment) {
  const intro = exercise && exercise.type === 'cardio'
    ? ['先从低速度或低阻力开始，身体热起来后再微调。']
    : ['先用轻重量做 1 组试动作，确认轨迹和关节感觉。'];
  return intro.concat((exercise && exercise.cues) || [], (equipment && equipment.setup || []).slice(0, 1)).slice(0, 5);
}

function getExerciseDetail(exerciseId, context) {
  const safeContext = context || {};
  const plan = safeContext.plan || {};
  const logs = safeContext.logs || [];
  const week = Number(safeContext.week || getCurrentWeek(plan, logs) || 1);
  const assessment = safeContext.assessment || getAssessmentFromPlan(plan);
  const planExercises = (plan.workouts || []).reduce(function (list, workout) {
    return list.concat(workout.exercises || []);
  }, []);
  let exercise = planExercises.find(function (item) {
    const baseId = getBaseExerciseIdForWeapp(item);
    return [item.id, item.sourceExerciseId, baseId].indexOf(exerciseId) >= 0;
  }) || createExerciseFromLibraryForWeapp(exerciseId);

  if (!exercise) {
    const nextWorkout = !plan.safetyHold ? getNextWorkout(plan, logs) : null;
    exercise = nextWorkout && nextWorkout.exercises && nextWorkout.exercises[0];
  }

  if (!exercise) return null;

  const decorated = decorateExerciseForWeapp(exercise, {
    plan: plan,
    assessment: assessment,
    logs: logs,
    week: week
  });
  const equipment = EQUIPMENT_BY_ID[decorated.equipmentId] || {};
  const loadFactLabel = decorated.type === 'cardio' ? '无需重量' : decorated.load || '按感觉试';
  return {
    exercise: decorated,
    equipment: Object.assign({}, cloneForWeapp(equipment), {
      image: ensureWeappEquipmentImage(equipment),
      musclesText: (equipment.muscles || []).join(' / '),
      setup: equipment.setup || [],
      mistakes: equipment.mistakes || []
    }),
    area: getExerciseAreaForWeapp(decorated),
    loadFactLabel: loadFactLabel,
    instructionSteps: getExerciseInstructionStepsForWeapp(decorated, equipment),
    relatedExercises: getRelatedExercisesForWeapp(decorated, {
      plan: plan,
      assessment: assessment,
      logs: logs,
      week: week
    }),
    safetyNote: '先用保守重量确认动作轨迹。只要出现刺痛、麻木或关节不适，本次动作直接停止。'
  };
}

function getPlanHistory(plan) {
  return Array.isArray(plan && plan.customization && plan.customization.previousPlans)
    ? plan.customization.previousPlans
    : [];
}

function getPreviousPlan(plan) {
  return getPlanHistory(plan)[0] || null;
}

function createPlanHistorySnapshot(plan) {
  if (!plan) return null;
  const snapshot = cloneForWeapp(plan);
  if (snapshot.customization) {
    snapshot.customization = {
      mode: snapshot.customization.mode,
      updatedAt: snapshot.customization.updatedAt,
      label: snapshot.customization.label,
      review: snapshot.customization.review
    };
  }
  return snapshot;
}

function getOriginalCoachPlan(plan) {
  if (plan && plan.customization && plan.customization.originalCoachPlan) {
    return cloneForWeapp(plan.customization.originalCoachPlan);
  }
  return null;
}

function canRestoreOriginalPlan(plan) {
  return Boolean(getOriginalCoachPlan(plan) && plan.customization && plan.customization.mode !== 'coach-restored');
}

function formatShortDateForWeapp(date) {
  const safeDate = date || new Date();
  const month = String(safeDate.getMonth() + 1).padStart(2, '0');
  const day = String(safeDate.getDate()).padStart(2, '0');
  return month + '/' + day;
}

function createPlanVersionForWeapp(plan, options) {
  const safeOptions = options || {};
  const now = new Date();
  const previousPlan = createPlanHistorySnapshot(plan);
  const originalCoachPlan = getOriginalCoachPlan(plan) || previousPlan;
  return decoratePlanForWeapp(Object.assign({}, cloneForWeapp(plan), safeOptions.patch || {}, {
    id: createId('plan'),
    createdAt: now.toISOString(),
    modelSource: 'pwa-v2',
    customization: {
      mode: safeOptions.mode || 'custom',
      updatedAt: now.toISOString(),
      label: safeOptions.label || ('计划调整 · ' + formatShortDateForWeapp(now)),
      originalCoachPlan: cloneForWeapp(originalCoachPlan),
      previousPlans: [previousPlan].concat(getPlanHistory(plan)).filter(Boolean).slice(0, 5),
      review: safeOptions.review || {
        level: 'ok',
        summary: '这版计划可以执行，建议完成 1 次训练后再继续调整。',
        warnings: [],
        suggestions: ['先看动作质量和恢复，再决定是否继续加量。'],
        positives: ['训练记录和身体记录不会被删除。']
      }
    }
  }), {
    assessment: safeOptions.assessment || getAssessmentFromPlan(plan),
    logs: safeOptions.logs || [],
    week: safeOptions.week || 1
  });
}

function adjustPlanFromLogs(plan, logs, assessment) {
  const safeAssessment = assessment || getAssessmentFromPlan(plan);
  const safeLogs = logs || [];
  const nextPlan = generatePlan(safeAssessment, safeLogs);
  return {
    changed: true,
    signal: nextPlan.review || { title: '重新调整计划', summary: nextPlan.decisionSummary || nextPlan.rationale || '已按最近记录重新生成计划。' },
    plan: createPlanVersionForWeapp(plan, {
      mode: 'adjusted',
      label: '重新调整 · ' + formatShortDateForWeapp(new Date()),
      patch: nextPlan,
      assessment: safeAssessment,
      logs: safeLogs,
      review: {
        level: nextPlan.review && nextPlan.review.status === 'overloaded' ? 'warning' : 'ok',
        summary: nextPlan.review && nextPlan.review.recommendation ? nextPlan.review.recommendation : nextPlan.decisionSummary || '已按最近训练记录重新调整。',
        warnings: nextPlan.review && nextPlan.review.status === 'overloaded' ? ['最近反馈偏强，本轮优先保证恢复。'] : [],
        suggestions: ['先执行 1 次训练，再根据记录继续微调。'],
        positives: ['本次调整不会删除训练记录。']
      }
    })
  };
}

function restoreOriginalPlan(plan) {
  const original = getOriginalCoachPlan(plan);
  if (!original) {
    return {
      changed: false,
      message: '当前已经是 AI 原始计划。',
      plan: plan
    };
  }
  return {
    changed: true,
    message: '已恢复 AI 原始计划。',
    plan: createPlanVersionForWeapp(plan, {
      mode: 'coach-restored',
      label: '恢复 AI 计划 · ' + formatShortDateForWeapp(new Date()),
      patch: original,
      assessment: getAssessmentFromPlan(plan),
      review: {
        level: 'ok',
        summary: '已恢复到 AI 原始计划。建议先按这个版本完成 1 次训练，再根据记录微调。',
        warnings: [],
        suggestions: ['如果还想微调，可以再次进入编辑计划。'],
        positives: ['原始计划仍保留基础评估里的目标、频次和单次时长。']
      }
    })
  };
}

function restorePreviousPlan(plan) {
  const previous = getPreviousPlan(plan);
  if (!previous) {
    return {
      changed: false,
      message: '还没有上一版计划。',
      plan: plan
    };
  }
  return {
    changed: true,
    message: '已恢复上一版计划。',
    plan: createPlanVersionForWeapp(plan, {
      mode: 'previous-restored',
      label: '恢复上一版 · ' + formatShortDateForWeapp(new Date()),
      patch: previous,
      assessment: getAssessmentFromPlan(plan),
      review: {
        level: 'ok',
        summary: '已恢复到上一版计划。建议按这个版本完成 1 次训练，再决定是否继续微调。',
        warnings: [],
        suggestions: ['恢复前的当前版本已进入历史，可以继续查看或再次恢复。'],
        positives: ['恢复计划不会删除训练记录。']
      }
    })
  };
}

function cleanExerciseForPlan(exercise) {
  const safeExercise = exercise || {};
  const baseId = safeExercise.sourceExerciseId || safeExercise.id;
  const source = PLAN_EXERCISES.find(function (item) { return item.id === baseId; }) ||
    PLAN_EXERCISES.find(function (item) { return item.name === safeExercise.name && item.equipmentId === safeExercise.equipmentId; }) ||
    safeExercise;
  const setMatch = String(safeExercise.sets || '').match(/\d+/);
  return Object.assign({}, cloneForWeapp(source), {
    id: safeExercise.id || source.id,
    sourceExerciseId: source.sourceExerciseId || source.id,
    name: safeExercise.name || source.name,
    equipmentId: safeExercise.equipmentId || source.equipmentId,
    type: safeExercise.type || source.type,
    baseSets: Math.max(1, Number(setMatch ? setMatch[0] : source.baseSets || 1)),
    reps: String(safeExercise.reps || source.reps || source.target || '10-12 次').slice(0, 16)
  });
}

function buildCustomPlan(plan, draft) {
  const safeDraft = draft || {};
  const workouts = (safeDraft.workouts || []).map(function (workout, index) {
    return {
      id: workout.id || createId('workout'),
      title: String(workout.title || ('训练日 ' + (index + 1))).slice(0, 18),
      focus: String(workout.focus || '按当前目标执行，注意动作质量。').slice(0, 80),
      exercises: (workout.exercises || []).map(cleanExerciseForPlan).filter(function (exercise) { return exercise.name; })
    };
  }).filter(function (workout) { return workout.exercises.length; });
  const safeWorkouts = workouts.length ? workouts : cloneForWeapp(plan.workouts || []);
  return createPlanVersionForWeapp(plan, {
    mode: 'custom',
    label: '手动编辑 · ' + formatShortDateForWeapp(new Date()),
    patch: {
      workouts: safeWorkouts,
      frequency: Object.assign({}, plan.frequency || {}, {
        sessionsPerWeek: safeWorkouts.length,
        pattern: safeWorkouts.map(function (item) { return item.title; }).join(' / ')
      })
    },
    assessment: getAssessmentFromPlan(plan),
    review: {
      level: 'ok',
      summary: '你已基于 AI 计划手动编辑。建议先按新版本完成 1 次训练，再看恢复和动作质量。',
      warnings: safeWorkouts.length >= 4 ? ['每周 4 次以上对恢复要求更高，睡眠和饮食要跟上。'] : [],
      suggestions: ['只从现有动作库调整，暂不支持用户自建动作。'],
      positives: ['原始 AI 计划和上一版都会保留。']
    }
  });
}

module.exports = {
  COACH_SPEC_VERSION: COACH_SPEC_VERSION,
  EXPERIENCE_LEVELS: EXPERIENCE_LEVELS,
  FOCUS_AREAS: FOCUS_AREAS,
  PLAN_EXERCISES: PLAN_EXERCISES,
  EQUIPMENT_BY_ID: EQUIPMENT_BY_ID,
  adjustPlanFromLogs: adjustPlanFromLogs,
  buildCustomPlan: buildCustomPlan,
  canRestoreOriginalPlan: canRestoreOriginalPlan,
  createDemoUser: createDemoUser,
  createExerciseFromKey: createExerciseFromKey,
  decorateExerciseForWeapp: decorateExerciseForWeapp,
  decoratePlanForWeapp: decoratePlanForWeapp,
  decorateWorkoutForWeapp: decorateWorkoutForWeapp,
  generateCoachPlan: generateCoachPlan,
  generatePlan: generatePlan,
  getCurrentWeek: getCurrentWeek,
  getEquipment: getEquipment,
  getExerciseOptions: getExerciseOptions,
  getLoadRecommendation: getLoadRecommendation,
  getMetrics: getMetrics,
  getNextWorkout: getNextWorkout,
  getExerciseDetail: getExerciseDetail,
  getOriginalCoachPlan: getOriginalCoachPlan,
  getPrimaryExerciseForEquipment: getPrimaryExerciseForEquipment,
  getPrescription: getPrescription,
  getPreviousPlan: getPreviousPlan,
  getWorkoutDuration: getWorkoutDuration,
  normalizeAssessment: normalizeAssessment,
  restoreOriginalPlan: restoreOriginalPlan,
  restorePreviousPlan: restorePreviousPlan,
  shouldRegeneratePlan: shouldRegeneratePlan,
  validateAssessment: validateAssessment
};
