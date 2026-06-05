export const COACH_SPEC_VERSION = "mvp-2026-06-05-coach-volume-v1";

export const FOCUS_AREAS = [
  { id: "chest", label: "胸" },
  { id: "shoulders", label: "肩" },
  { id: "back", label: "背" },
  { id: "legs", label: "腿" },
  { id: "glutes", label: "臀" }
];

const FOCUS_BY_ID = Object.fromEntries(FOCUS_AREAS.map((item) => [item.id, item]));

export const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "健身小白", description: "需要更明确的器械和动作提示" },
  { id: "familiar", label: "略有了解", description: "可以接受更完整的训练结构" },
  { id: "years", label: "健身多年", description: "训练容量和分化可以更进阶" },
  { id: "coach", label: "资深教练", description: "给出框架和关键限制，保留自主调整空间" }
];

const EXPERIENCE_BY_ID = Object.fromEntries(EXPERIENCE_LEVELS.map((item) => [item.id, item]));

export const VISIBLE_EQUIPMENT_IDS = [
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

export const EQUIPMENT = [
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

export const EQUIPMENT_BY_ID = Object.fromEntries(EQUIPMENT.map((item) => [item.id, item]));

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

export function generateCoachPlan(assessment, logs = []) {
  const metrics = getMetrics(assessment);
  const risk = getRisk(assessment);

  if (risk.blocked) {
    return {
      id: createId("plan"),
      createdAt: new Date().toISOString(),
      safetyHold: true,
      risk,
      metrics,
      goal: "暂不生成计划",
      rationale: "你填写了伤病或心血管风险。这个 MVP 不做康复诊断，建议先找线下医生或康复师评估。"
    };
  }

  const focusAreas = normalizeFocusAreas(assessment.focusAreas);
  const experience = getExperience(assessment.trainingExperience);
  const review = summarizeLogs(logs);
  const goal = chooseGoal(assessment, metrics);
  const trainingProfile = getTrainingProfile(assessment, metrics, goal, experience);
  const workouts = fitWorkoutsToSessionBudget(
    buildWorkouts(goal, focusAreas, experience.id, trainingProfile),
    assessment.sessionBudget
  );
  const frequency = {
    ...chooseFrequency(assessment, metrics, logs),
    pattern: describeWorkoutPattern(workouts)
  };
  const duration = chooseDuration(assessment, metrics, goal, workouts, trainingProfile);

  return {
    id: createId("plan"),
    createdAt: new Date().toISOString(),
    version: COACH_SPEC_VERSION,
    safetyHold: false,
    metrics,
    risk,
    goal,
    experience,
    trainingProfile,
    focusAreas: focusAreas.map((id) => FOCUS_BY_ID[id]),
    frequency,
    duration,
    review,
    workouts,
    weeks: WEEK_RULES,
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

export function getCurrentWeek(plan, logs = []) {
  if (!plan || plan.safetyHold) return 1;
  const frequency = Number(plan.frequency?.sessionsPerWeek || 3);
  return Math.min(4, Math.floor(logs.length / Math.max(1, frequency)) + 1);
}

export function getNextWorkout(plan, logs = []) {
  if (!plan || plan.safetyHold) return null;
  const index = logs.length % plan.workouts.length;
  return plan.workouts[index];
}

export function getPrescription(exercise, weekNumber = 1) {
  const week = WEEK_RULES[Math.max(0, Math.min(3, weekNumber - 1))];
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
    sets: `${getSetCount(exercise, weekNumber)} 组`,
    reps: exercise.reps,
    rest: exercise.rest,
    effort: week.effort,
    effortText: week.effortText
  };
}

export function getWorkoutDuration(workout, weekNumber = 1) {
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

    const sets = getSetCount(exercise, weekNumber);
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

export function getMetrics(assessment) {
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
    bodyFat: bodyFat > 0 ? bodyFat : null,
    fatLevel,
    category: bmi >= 28 ? "高体重压力" : bmi >= 24 ? "偏重" : bmi < 18.5 ? "偏轻" : "正常范围"
  };
}

function buildWorkouts(goal, focusAreas, experienceId, trainingProfile) {
  const isGain = goal.type.includes("增肌");
  const selectedAreas = focusAreas.length ? focusAreas : ["chest", "back", "legs"];

  if (!isGain) {
    return tuneWorkoutsForProfile(
      applyFocusAdjustments(WORKOUT_BLUEPRINTS, focusAreas, experienceId),
      trainingProfile
    );
  }

  const workouts = selectedAreas.slice(0, 3).map((area) => buildFocusWorkout(area, experienceId, trainingProfile));
  while (workouts.length < 3) {
    workouts.push(buildFocusWorkout(getSupportArea(selectedAreas, workouts.length), experienceId, trainingProfile, true));
  }

  return tuneWorkoutsForProfile(
    workouts.map((workout, index) => ({
      ...workout,
      id: String.fromCharCode(65 + index)
    })),
    trainingProfile
  );
}

function getTrainingProfile(assessment, metrics, goal, experience) {
  const budget = Number(assessment.sessionBudget || 60);
  const isGain = goal.type.includes("增肌");
  const leanGain = isGain && (metrics.fatLevel === "lean" || metrics.fatLevel === "healthy") && metrics.bmi >= 19 && metrics.bmi < 25;
  const experienceRank = {
    beginner: 1,
    familiar: 2,
    years: 3,
    coach: 4
  }[experience.id] || 1;

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

  return {
    budget,
    isGain,
    leanGain,
    experienceRank,
    volumeTier,
    maxBaseSets: maxBaseSetsByTier[volumeTier],
    targetWeekOneMax: targetWeekOneByTier[volumeTier],
    targetWeekThreeMax: budget,
    rationale: leanGain
      ? "低体脂或健康体脂下想增肌，训练重点应放在足够的有效组数、渐进负荷和恢复，而不是短时间打卡。"
      : "先按当前身体状态建立稳定训练容量，再根据记录逐步调整。"
  };
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
  const highFat = metrics.fatLevel === "high" || metrics.bmi >= 27;

  if (wantsGain && leanOrHealthy && metrics.bmi >= 20 && metrics.bmi < 25) {
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

  if (wantsFatLoss || metrics.bmi >= 24) {
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

function chooseFrequency(assessment, metrics, logs) {
  const cap = assessment.weeklyLimit;
  const review = summarizeLogs(logs);
  let sessionsPerWeek = metrics.bmi >= 30 || Number(assessment.age) >= 50 ? 2 : 3;

  if (cap === "2") sessionsPerWeek = Math.min(sessionsPerWeek, 2);
  if (cap === "4") sessionsPerWeek = Math.max(sessionsPerWeek, 3);
  if (review.status === "overloaded") sessionsPerWeek = Math.max(2, sessionsPerWeek - 1);

  return {
    sessionsPerWeek,
    pattern: sessionsPerWeek <= 2 ? "A/B 交替，全身训练" : "A/B/C 轮换，全身训练",
    restDays: "两次力量训练之间尽量间隔 1 天"
  };
}

function chooseDuration(assessment, metrics, goal, workouts, trainingProfile) {
  const budget = Number(assessment.sessionBudget || 60);
  const isGain = goal.type.includes("增肌");
  const weekOne = getPlanDurationRange(workouts, 1);
  const progression = getPlanDurationRange(workouts, 3);
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

function getPlanDurationRange(workouts, weekNumber) {
  const durations = workouts.map((workout) => getWorkoutDuration(workout, weekNumber));
  const min = Math.min(...durations.map((duration) => duration.min));
  const max = Math.max(...durations.map((duration) => duration.max));
  return {
    min,
    max,
    label: `${min}-${max} 分钟`
  };
}

function getSetCount(exercise, weekNumber) {
  const week = WEEK_RULES[Math.max(0, Math.min(3, weekNumber - 1))];
  return Math.max(1, Number(exercise.baseSets || 1) + week.setOffset);
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
      completionRate: 0,
      averageFeeling: 4,
      recommendation: "先完成 2-3 次训练记录，再做个性化调整。"
    };
  }

  const recent = logs.slice(-6);
  const completed = recent.filter((log) => log.completedCount > 0).length;
  const feelingValues = recent.flatMap((log) =>
    log.exercises.map((item) => Number(item.feeling || legacyPainToFeeling(item.pain)))
  );
  const averageFeeling = average(feelingValues);
  const tooHardCount = recent.filter((log) => log.intensityFeedback === "too-hard").length;
  const tooEasyCount = recent.filter((log) => log.intensityFeedback === "too-easy").length;
  let status = "steady";
  let recommendation = "保持当前训练量，优先把动作做稳。";

  if (tooHardCount >= 2 || averageFeeling >= 6) {
    status = "overloaded";
    recommendation = "最近反馈偏强。下周降低训练量，不增加重量，优先保证动作和恢复。";
  } else if (tooEasyCount >= 2 || (completed >= 5 && averageFeeling <= 3.2)) {
    status = "ready";
    recommendation = "最近反馈偏轻松。可以小幅进阶：上肢加 2.5kg，下肢加 5kg，或主动作多做 1 组。";
  }

  return {
    status,
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
