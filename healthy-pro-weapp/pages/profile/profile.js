const { formatDateTime } = require("../../utils/format");

const LOCAL_RELEASES = [
  {
    id: "weapp-v0.5.5",
    version: "v0.5.5",
    title: "好友页重新设计",
    summary: "好友码、添加好友和本周排行集中到首屏，减少设置项对主要任务的干扰。",
    highlights: ["好友码和添加入口集中到训练风格主面板", "本周排行优先展示，好友请求移动到排行之后", "昵称、共享范围和好友管理按需展开", "扩大主要按钮触控区域并改善长昵称排版"],
    releaseType: "improvement",
    publishedAt: "2026-07-13T18:00:00+08:00"
  },
  {
    id: "weapp-v0.5.4",
    version: "v0.5.4",
    title: "核心界面简化",
    summary: "减少训练过程中的重复信息，让每个页面更快找到当前任务和下一步操作。",
    highlights: ["记录页聚焦当前动作，全部完成后顶部引导保存", "计划编辑按训练日切换，动作默认折叠但保留组次、休息和建议重量", "器械库默认只显示今日器械，完整列表按需展开", "基础评估拆成身体、训练方向、时间限制三步"],
    releaseType: "improvement",
    publishedAt: "2026-07-12T20:00:00+08:00"
  },
  {
    id: "weapp-v0.5.3",
    version: "v0.5.3",
    title: "编辑计划输入与布局修复",
    summary: "编辑组数和休息时间时可以先清空再输入，计划页在手机上也更易操作。",
    highlights: ["组数、休息时间改为失焦或保存时校验，不再出现 1 改 5 变成 15", "动作卡信息、上移下移和替换操作重新排布，避免文字和按钮互相挤压", "保存区保持在底部安全区域，完成调整后可直接保存"],
    releaseType: "fix",
    publishedAt: "2026-07-12T10:00:00+08:00"
  },
  {
    id: "weapp-v0.5.2",
    version: "v0.5.2",
    title: "编辑计划页面布局修复",
    summary: "修复编辑计划页在手机上横向溢出、动作名竖排和按钮挤压的问题。",
    highlights: ["动作卡改为摘要、操作、处方三层结构", "上移、下移和替换按钮不再挤压动作名称", "底部保存区保留在安全区域内，便于完成修改后保存"],
    releaseType: "fix",
    publishedAt: "2026-07-09T08:00:00+08:00"
  },
  {
    id: "weapp-v0.5.1",
    version: "v0.5.1",
    title: "计划编辑和训练记录修复",
    summary: "修复自定义计划改了但执行不生效的问题，并补齐训练日切换、动作顺序调整和完整历史明细。",
    highlights: ["编辑计划支持按训练日切换，不再需要一直下滑", "组数和休息时间改为结构化保存，执行训练时会按组递进并触发休息", "替换动作后保留建议重量，历史训练显示完整动作明细"],
    releaseType: "fix",
    publishedAt: "2026-07-08T12:00:00+08:00"
  },
  {
    id: "weapp-v0.5.0",
    version: "v0.5.0",
    title: "朋友试用前安全和体验收口",
    summary: "收口好友隐私边界，并把首页、计划页和记录页统一成更清晰的训练驾驶舱体验。",
    highlights: ["好友请求和排行只通过云函数返回摘要信息", "不向好友展示体重、体脂、训练重量、完整计划或完整记录", "训练记录和计划页减少长文本堆叠，优先展示当前动作、进度和下一步"],
    releaseType: "improvement",
    publishedAt: "2026-07-06T20:00:00+08:00"
  },
  {
    id: "weapp-v0.4.4",
    version: "v0.4.4",
    title: "好友隐私边界修复",
    summary: "好友码、好友请求和排行读取改为通过云函数处理，前端不再直接读取其他用户的完整数据。",
    highlights: ["好友功能只返回昵称、完成率、训练次数和连续周数等摘要", "不返回体重、体脂、训练重量、完整计划或完整训练记录", "为后续收紧 CloudBase 集合权限和朋友试用做准备"],
    releaseType: "fix",
    publishedAt: "2026-07-02T18:00:00+08:00"
  },
  {
    id: "weapp-v0.4.3",
    version: "v0.4.3",
    title: "训练记录流程优化",
    summary: "记录页改成训练中流程，用户按当前动作逐项完成，全部完成后会在顶部提示保存本次训练。",
    highlights: ["当前动作成为主入口，不再同时展示长表单", "完成动作后自动跳到下一个待完成动作", "支持保存草稿、继续修改和保存第 N 次训练"],
    releaseType: "improvement",
    publishedAt: "2026-06-30T12:00:00+08:00"
  },
  {
    id: "weapp-v0.4.2",
    version: "v0.4.2",
    title: "评估生成计划修复",
    summary: "修复小程序重新评估后计划没有更新的问题，评估结果会正确写入并刷新首页计划。",
    highlights: ["补齐全局状态排序函数，避免评估提交后状态整理异常", "重新评估后会按最新目标、频次、时长和重点部位生成计划", "减少运行异常导致的开发工具重连和红色报错"],
    releaseType: "fix",
    publishedAt: "2026-06-25T18:00:00+08:00"
  },
  {
    id: "weapp-v0.4.1",
    version: "v0.4.1",
    title: "与 PWA 功能对齐",
    summary: "补齐小程序和 PWA 的计划解释、计划编辑审核、趋势、训练历史、器械分组和反馈记录差异。",
    highlights: ["计划页新增教练解释", "编辑计划前提示风险和建议", "我的页补齐强度趋势和身体趋势", "器械页按今日器械和训练区分组"],
    releaseType: "improvement",
    publishedAt: "2026-06-25T00:00:00+08:00"
  },
  {
    id: "weapp-v0.1.0",
    version: "v0.1.0",
    title: "小程序端 MVP 启动",
    summary: "新增 Healthy Pro 微信小程序端骨架，可在微信里查看计划、记录训练和浏览器械。",
    highlights: ["保留 PWA 已验证的训练模型", "支持微信云保存训练计划和记录", "移动端界面按微信小程序重新整理"],
    releaseType: "feature",
    publishedAt: "2026-06-15T00:00:00+08:00"
  },
  {
    id: "weapp-v0.2.0",
    version: "v0.2.0",
    title: "小程序功能对齐",
    summary: "补齐 PWA 已验证的训练中辅助、好友排行、结构化反馈和更新公告能力。",
    highlights: ["记录页升级为训练助手", "我的页支持好友码、排行和反馈", "更新公告可以标记已读"],
    releaseType: "improvement",
    publishedAt: "2026-06-20T00:00:00+08:00"
  },
  {
    id: "weapp-v0.3.0",
    version: "v0.3.0",
    title: "完整迁移 PWA 已验证功能",
    summary: "补齐训练中辅助、好友排行、结构化反馈和更新公告，让小程序端体验接近 PWA。",
    highlights: ["训练记录支持当前动作、休息倒计时和动作详情", "我的页支持好友码、好友请求、排行和反馈", "更新公告可查看多版本并标记已读"],
    releaseType: "feature",
    publishedAt: "2026-06-22T00:00:00+08:00"
  },
  {
    id: "weapp-v0.3.1",
    version: "v0.3.1",
    title: "微信用户数据隔离修复",
    summary: "小程序启动时会自动绑定当前微信用户，新用户不再默认进入同一套演示计划。",
    highlights: ["启动时自动读取微信身份并按 openid 加载云端数据", "新用户先进入基础评估，不再共用默认 demo 计划", "本地训练草稿和身体草稿按微信用户隔离"],
    releaseType: "fix",
    publishedAt: "2026-06-22T12:00:00+08:00"
  },
  {
    id: "weapp-v0.3.2",
    version: "v0.3.2",
    title: "我的页信息层级简化",
    summary: "我的页改为训练档案、周报摘要和更多入口，减少首屏信息堆叠。",
    highlights: ["首屏保留训练状态和本周周报摘要", "好友排行、更新公告、设置与反馈改为入口卡片", "原有好友、反馈、同步和公告能力都保留在详情页"],
    releaseType: "improvement",
    publishedAt: "2026-06-24T00:00:00+08:00"
  },
  {
    id: "weapp-v0.4.0",
    version: "v0.4.0",
    title: "训练反馈和好友动态",
    summary: "保存训练后会给即时教练反馈，新用户首次进入会看到开始顺序，好友页新增最近训练动态。",
    highlights: ["训练记录保存后生成一句教练反馈，并随记录保存", "首页新增首次使用引导", "好友页新增最近训练动态，只展示昵称、训练时间和本周次数"],
    releaseType: "feature",
    publishedAt: "2026-06-24T20:00:00+08:00"
  }
];

const FEEDBACK_RATING_OPTIONS = [
  { value: "5", label: "5 分", note: "很顺" },
  { value: "4", label: "4 分", note: "还不错" },
  { value: "3", label: "3 分", note: "一般" },
  { value: "2", label: "2 分", note: "有点卡" },
  { value: "1", label: "1 分", note: "不好用" }
];

const FEEDBACK_CATEGORY_OPTIONS = [
  { value: "confusing", label: "看不懂" },
  { value: "plan", label: "计划不合理" },
  { value: "equipment", label: "器械找不到" },
  { value: "ux", label: "页面不好用" },
  { value: "other", label: "其他" }
];

const SHARE_OPTION_CONFIG = [
  { key: "shareLeaderboard", label: "参与好友排行", note: "展示完成率、次数和连续周数" },
  { key: "shareWeeklySummary", label: "共享本周摘要", note: "不展示体重、体脂和训练重量" }
];

function sortRecords(records = []) {
  return records.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function getStartOfLocalWeek(now = new Date()) {
  const date = new Date(now);
  const day = date.getDay() || 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day + 1);
  return date;
}

function getLatest(records = []) {
  return records.length ? records[records.length - 1] : null;
}

function getIntensityLabel(value) {
  if (value === "too-easy") return "偏轻松";
  if (value === "too-hard") return "偏吃力";
  return "刚刚好";
}

function getAverageFeelingLabel(value) {
  if (!Number.isFinite(value)) return "还未记录";
  if (value <= 2.4) return "偏轻松";
  if (value <= 4.2) return "刚刚好";
  if (value <= 5.8) return "有点吃力";
  return "偏难";
}

function getWeekKey(dateValue) {
  const date = new Date(dateValue);
  const start = getStartOfLocalWeek(date);
  return `${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}`;
}

function getBestWeeklyLogCount(logs) {
  const counts = {};
  logs.forEach((log) => {
    const key = getWeekKey(log.createdAt);
    counts[key] = (counts[key] || 0) + 1;
  });
  return Math.max(0, ...Object.values(counts));
}

function getRecentWeekBuckets(logs, weekTarget, now = new Date()) {
  const currentStart = getStartOfLocalWeek(now);
  const labels = ["3周前", "2周前", "上周", "本周"];
  return labels.map((label, index) => {
    const start = new Date(currentStart);
    start.setDate(currentStart.getDate() - (3 - index) * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const weekLogs = logs.filter((log) => {
      const createdAt = new Date(log.createdAt);
      return createdAt >= start && createdAt < end;
    });
    return {
      label,
      count: weekLogs.length,
      rate: weekTarget ? Math.min(100, Math.round((weekLogs.length / weekTarget) * 100)) : 0
    };
  });
}

function getIntensityInsights(logs) {
  const recent = logs.slice(-6);
  const feelings = recent
    .reduce((list, log) => list.concat(log.exercises || []), [])
    .filter((exercise) => exercise.done && Number.isFinite(Number(exercise.feeling)))
    .map((exercise) => Number(exercise.feeling));
  const averageFeeling = feelings.length
    ? feelings.reduce((sum, value) => sum + value, 0) / feelings.length
    : NaN;
  return {
    recentCount: recent.length,
    tooEasy: recent.filter((log) => log.intensityFeedback === "too-easy").length,
    right: recent.filter((log) => !log.intensityFeedback || log.intensityFeedback === "right").length,
    tooHard: recent.filter((log) => log.intensityFeedback === "too-hard").length,
    feelingLabel: getAverageFeelingLabel(averageFeeling),
    latestFeedbackLabel: getIntensityLabel((getLatest(recent) || {}).intensityFeedback)
  };
}

function getBodyTrend(bodyLogs) {
  const latest = getLatest(bodyLogs);
  const previous = bodyLogs.length > 1 ? bodyLogs[bodyLogs.length - 2] : null;
  const weightDelta = latest && previous
    ? `${latest.weight >= previous.weight ? "+" : ""}${(latest.weight - previous.weight).toFixed(1)}kg`
    : "暂无对比";
  return {
    latest,
    previous,
    weightDelta
  };
}

function getProfileCoachMessage({ logs, weekTarget, thisWeekCount, intensity, bodyTrend }) {
  if (!logs.length) return "先完成 1-2 次训练记录，这里会开始判断训练频次、强度和身体变化。";
  if (intensity.tooHard >= 2) return "近几次训练有偏强信号，下一次先保持重量或少做 1 组。";
  if (intensity.tooEasy >= 2) return "近几次反馈偏轻松，如果动作稳定，可以在计划页重新调整。";
  if (weekTarget && thisWeekCount < weekTarget) return `本周还差 ${weekTarget - thisWeekCount} 次训练，优先完成计划频次。`;
  if (bodyTrend.latest && bodyTrend.previous && Math.abs(bodyTrend.latest.weight - bodyTrend.previous.weight) >= 1.5) return "最近体重波动较大，训练计划先不要只根据单次体重调整。";
  return "当前节奏比较稳定，继续按计划记录训练和身体状态。";
}

function getCurrentTrainingWeekStreak(logs, now = new Date()) {
  if (!logs.length) return 0;
  const weeks = new Set(logs.map((log) => getWeekKey(log.createdAt)));
  let streak = 0;
  let cursor = getStartOfLocalWeek(now);
  while (weeks.has(getWeekKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

function getProfileInsights(user, logs = [], bodyLogs = []) {
  const sortedLogs = sortRecords(logs);
  const sortedBodyLogs = sortRecords(bodyLogs);
  const weekTarget = Number(user && user.plan && user.plan.frequency && user.plan.frequency.sessionsPerWeek || 0);
  const now = new Date();
  const weekStart = getStartOfLocalWeek(now);
  const thisWeekLogs = sortedLogs.filter((log) => {
    const createdAt = new Date(log.createdAt);
    return createdAt >= weekStart && createdAt <= now;
  });
  const thisWeekCompleted = thisWeekLogs.reduce((sum, log) => sum + Number(log.completedCount || 0), 0);
  const intensity = getIntensityInsights(sortedLogs);
  const bodyTrend = getBodyTrend(sortedBodyLogs);
  const weeklyBuckets = getRecentWeekBuckets(sortedLogs, weekTarget, now);
  const intensityTotal = Math.max(1, intensity.recentCount || 0);
  const intensityRows = [
    { label: "偏轻松", count: intensity.tooEasy, rate: Math.round((intensity.tooEasy / intensityTotal) * 100) },
    { label: "刚刚好", count: intensity.right, rate: Math.round((intensity.right / intensityTotal) * 100) },
    { label: "偏吃力", count: intensity.tooHard, rate: Math.round((intensity.tooHard / intensityTotal) * 100) }
  ];
  const bodyTrendRows = sortedBodyLogs.slice(-4).reverse().map((record) => ({
    label: formatDateTime(record.createdAt),
    weight: Number.isFinite(Number(record.weight)) ? `${record.weight}kg` : "未记",
    bodyFat: record.bodyFat ? `${record.bodyFat}%` : "未记体脂"
  }));
  const bestWorkout = Math.max(0, ...sortedLogs.map((log) => Number(log.completedCount || 0)));
  const totalCompleted = sortedLogs.reduce((sum, log) => sum + Number(log.completedCount || 0), 0);
  const weekCompletionRate = weekTarget ? Math.min(100, Math.round((thisWeekLogs.length / weekTarget) * 100)) : 0;
  return {
    weekTarget,
    thisWeekCount: thisWeekLogs.length,
    thisWeekCompleted,
    weekCompletionRate,
    weekTargetText: weekTarget || "-",
    latestWeightText: bodyTrend.latest ? `${bodyTrend.latest.weight}kg` : "未记",
    streakText: `${getCurrentTrainingWeekStreak(sortedLogs, now)} 周`,
    intensity,
    intensityRows,
    bodyTrend,
    bodyTrendRows,
    weeklyBuckets,
    latestLog: getLatest(sortedLogs),
    coachMessage: getProfileCoachMessage({ logs: sortedLogs, weekTarget, thisWeekCount: thisWeekLogs.length, intensity, bodyTrend }),
    records: [
      { label: "累计训练", value: `${sortedLogs.length} 次`, note: `${totalCompleted} 个动作被记录` },
      { label: "最佳训练周", value: `${getBestWeeklyLogCount(sortedLogs)} 次`, note: "按自然周统计" },
      { label: "连续训练周", value: `${getCurrentTrainingWeekStreak(sortedLogs, now)} 周`, note: "本周有记录才会延续" },
      { label: "单次完成最多", value: `${bestWorkout} 动作`, note: "观察执行稳定性" },
      { label: "最近体重", value: bodyTrend.latest ? `${bodyTrend.latest.weight}kg` : "未记录", note: bodyTrend.latest ? formatDateTime(bodyTrend.latest.createdAt) : "去记录页保存体重" },
      { label: "最近体脂", value: bodyTrend.latest && bodyTrend.latest.bodyFat ? `${bodyTrend.latest.bodyFat}%` : "未记录", note: "可选记录，不按 0 处理" }
    ]
  };
}

function formatReleaseDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getReleaseTypeLabel(type) {
  if (type === "feature") return "新功能";
  if (type === "fix") return "修复";
  return "优化";
}

function buildReleaseState(store) {
  const reads = store.releaseReads || {};
  const releases = LOCAL_RELEASES
    .slice()
    .sort((left, right) => new Date(right.publishedAt) - new Date(left.publishedAt))
    .map((release) => ({
      ...release,
      dateLabel: formatReleaseDate(release.publishedAt),
      typeLabel: getReleaseTypeLabel(release.releaseType),
      isRead: Boolean(reads[release.id])
    }));
  return {
    releases,
    unreadCount: releases.filter((release) => !release.isRead).length,
    unreadLabel: releases.filter((release) => !release.isRead).length
      ? `${releases.filter((release) => !release.isRead).length} 条未读`
      : "已读"
  };
}

function buildShareOptions(profile) {
  return SHARE_OPTION_CONFIG.map((item) => ({
    ...item,
    checked: profile[item.key] !== false
  }));
}

function buildLocalLeaderboard(social, insights) {
  const profile = social.friendProfile || {};
  const accepted = (social.friendships || []).filter((item) => item.status === "accepted");
  const self = profile.shareLeaderboard !== false ? [{
    isSelf: true,
    nickname: profile.nickname || "微信用户",
    currentWeekCount: insights.thisWeekCount || 0,
    currentWeekCompleted: insights.thisWeekCompleted || 0,
    currentWeekCompletionRate: insights.weekCompletionRate || 0,
    streakWeeks: Number(String(insights.streakText || "0").replace(/[^\d]/g, "") || 0),
    latestTrainingAt: insights.latestLog && insights.latestLog.createdAt || ""
  }] : [];
  return self.concat(accepted.filter((item) => item.shareLeaderboard !== false)).sort((left, right) => (
    Number(right.currentWeekCompletionRate || 0) - Number(left.currentWeekCompletionRate || 0) ||
    Number(right.currentWeekCount || 0) - Number(left.currentWeekCount || 0) ||
    Number(right.streakWeeks || 0) - Number(left.streakWeeks || 0)
  ));
}

function getRelativeTimeLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return formatDateTime(value);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "昨天";
  if (days < 7) return `${days} 天前`;
  return formatDateTime(value);
}

function buildFriendActivities(leaderboard, accepted) {
  const seen = {};
  return [...(leaderboard || []), ...(accepted || [])]
    .filter((item) => item && !item.isSelf && item.latestTrainingAt)
    .map((item) => {
      const key = item.openid || item.userId || item.id || `${item.nickname}-${item.latestTrainingAt}`;
      if (seen[key]) return null;
      seen[key] = true;
      const count = Number(item.currentWeekCount || 0);
      return {
        key,
        nickname: item.nickname || "训练伙伴",
        summary: count ? `最近完成一次训练，本周已记录 ${count} 次` : "最近完成一次训练",
        timeLabel: getRelativeTimeLabel(item.latestTrainingAt),
        createdAt: item.latestTrainingAt
      };
    })
    .filter(Boolean)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 6);
}

function buildSocialView(store, insights) {
  const social = store.social || {};
  const profile = social.friendProfile || {};
  const friendships = Array.isArray(social.friendships) ? social.friendships : [];
  const incoming = friendships.filter((item) => item.status === "pending" && item.direction === "incoming");
  const outgoing = friendships.filter((item) => item.status === "pending" && item.direction === "outgoing");
  const accepted = friendships.filter((item) => item.status === "accepted");
  const leaderboard = Array.isArray(social.leaderboard) && social.leaderboard.length
    ? social.leaderboard
    : buildLocalLeaderboard(social, insights);
  const decorateFriend = (item) => ({
    ...item,
    displaySummary: item.shareLeaderboard === false
      ? "对方未参与排行"
      : `本周 ${item.currentWeekCount || 0} 次 · 完成率 ${item.currentWeekCompletionRate || 0}%`
  });
  return {
    enabled: Boolean(store.cloud && store.cloud.enabled),
    friendProfile: profile,
    shareOptions: buildShareOptions(profile),
    incoming: incoming.map(decorateFriend),
    outgoing: outgoing.map(decorateFriend),
    requestCount: incoming.length + outgoing.length,
    accepted: accepted.map(decorateFriend),
    leaderboard: leaderboard.map((item, index) => ({
      ...item,
      rank: index + 1,
      displayName: `${item.nickname || "微信用户"}${item.isSelf ? " · 我" : ""}`,
      displaySummary: `完成率 ${item.currentWeekCompletionRate || 0}% · 本周 ${item.currentWeekCount || 0} 次 · 连续 ${item.streakWeeks || 0} 周`
    })),
    activities: buildFriendActivities(leaderboard, accepted),
    leaderboardCount: leaderboard.length,
    lastSyncedLabel: social.lastSyncedAt ? formatDateTime(social.lastSyncedAt) : "",
    summary: social.summary || {}
  };
}

function getSocialEntrySummary(socialView) {
  if (!socialView) return "添加好友后查看本周排行";
  if (socialView.incoming && socialView.incoming.length) return `${socialView.incoming.length} 个好友请求待确认`;
  if (socialView.accepted && socialView.accepted.length) return `${socialView.accepted.length} 个好友 · 榜单 ${socialView.leaderboardCount || 0} 人`;
  if (socialView.leaderboardCount) return `榜单 ${socialView.leaderboardCount} 人`;
  return "添加好友后查看本周排行";
}

function getDataModeText(profile = {}) {
  if (profile.mode === "cloud" || profile.syncStatus === "synced" || profile.syncStatus === "syncing" || profile.syncStatus === "connecting") {
    return "云端数据";
  }
  return "本地数据";
}

function buildProfileEntries(insights, socialView, releaseState) {
  return [
    {
      mode: "weekly",
      eyebrow: "周报",
      title: "周报与趋势",
      summary: `本周 ${insights.thisWeekCount}/${insights.weekTargetText} 次 · ${insights.intensity.feelingLabel}`
    },
    {
      mode: "friends",
      eyebrow: "好友",
      title: "好友与排行",
      summary: getSocialEntrySummary(socialView)
    },
    {
      mode: "releases",
      eyebrow: "更新",
      title: "更新公告",
      summary: releaseState.unreadCount ? `${releaseState.unreadCount} 条未读` : "查看最近版本变化"
    },
    {
      mode: "settings",
      eyebrow: "设置",
      title: "设置与反馈",
      summary: "同步、评估、反馈与重置"
    }
  ];
}

function getProfileModeMeta(mode) {
  const meta = {
    weekly: ["周报与趋势", "训练、身体和感觉变化"],
    friends: ["好友与排行", "昵称、好友码和本周稳定榜"],
    releases: ["更新公告", "看看最近改了什么"],
    settings: ["设置与反馈", "同步、评估和体验反馈"]
  }[mode] || ["我的", ""];
  return {
    title: meta[0],
    summary: meta[1]
  };
}

Page({
  data: {
    user: null,
    profile: null,
    logs: [],
    feedbacks: [],
    feedbackText: "",
    feedbackRating: "5",
    feedbackCategory: "confusing",
    feedbackRatingOptions: FEEDBACK_RATING_OPTIONS,
    feedbackCategoryOptions: FEEDBACK_CATEGORY_OPTIONS,
    insights: null,
    socialView: null,
    socialNickname: "",
    friendCodeInput: "",
    socialSettingsOpen: false,
    releaseState: null,
    profileMode: "hub",
    profileModeTitle: "",
    profileModeSummary: "",
    profileEntries: [],
    completionRate: 0,
    syncStatusText: "本地",
    dataModeText: "本地数据",
    releaseChipText: "已是最新",
    lastSyncedLabel: ""
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const app = getApp();
    const store = app.getStore();
    const target = Number((store.user.plan && store.user.plan.frequency && store.user.plan.frequency.sessionsPerWeek) || 0);
    const count = store.logs.length;
    const profile = store.profile || {};
    const lastSyncedAt = profile.lastSyncedAt || (store.cloud && store.cloud.lastPushedAt) || "";
    const insights = getProfileInsights(store.user, store.logs || [], store.bodyLogs || []);
    const socialView = buildSocialView(store, insights);
    const releaseState = buildReleaseState(store);
    const modeMeta = getProfileModeMeta(this.data.profileMode);
    this.setData({
      user: store.user,
      profile,
      logs: store.logs,
      feedbacks: store.feedbacks || [],
      insights,
      socialView,
      socialNickname: socialView.friendProfile.nickname || profile.nickname || "微信用户",
      releaseState,
      profileModeTitle: modeMeta.title,
      profileModeSummary: modeMeta.summary,
      profileEntries: buildProfileEntries(insights, socialView, releaseState),
      completionRate: target ? Math.min(100, Math.round((count / target) * 100)) : 0,
      syncStatusText: this.getSyncStatusText(profile),
      dataModeText: getDataModeText(profile),
      releaseChipText: releaseState.unreadCount ? releaseState.unreadLabel : "已是最新",
      lastSyncedLabel: lastSyncedAt ? formatDateTime(lastSyncedAt) : ""
    });
  },

  openProfileMode(event) {
    const mode = event.currentTarget.dataset.mode || "hub";
    const modeMeta = getProfileModeMeta(mode);
    this.setData({
      profileMode: mode,
      profileModeTitle: modeMeta.title,
      profileModeSummary: modeMeta.summary
    });
  },

  backProfileHome() {
    this.setData({
      profileMode: "hub",
      profileModeTitle: "",
      profileModeSummary: ""
    });
  },

  getSyncStatusText(profile) {
    if (!profile) return "本地";
    if (profile.syncStatus === "synced") return "已同步";
    if (profile.syncStatus === "syncing" || profile.syncStatus === "connecting") return "同步中";
    if (profile.syncStatus === "error") return "需重试";
    return profile.modeLabel || "本地";
  },

  goAssessment() {
    wx.navigateTo({ url: "/pages/assessment/assessment" });
  },

  goLog() {
    wx.switchTab({ url: "/pages/log/log" });
  },

  goPlan() {
    wx.switchTab({ url: "/pages/plan/plan" });
  },

  setFeedbackText(event) {
    this.setData({ feedbackText: event.detail.value });
  },

  chooseFeedbackRating(event) {
    this.setData({ feedbackRating: String(event.currentTarget.dataset.value || "5") });
  },

  chooseFeedbackCategory(event) {
    this.setData({ feedbackCategory: String(event.currentTarget.dataset.value || "other") });
  },

  saveFeedback() {
    const content = String(this.data.feedbackText || "").trim();
    if (content.length < 2) {
      wx.showToast({ title: "至少写 2 个字", icon: "none" });
      return;
    }
    const app = getApp();
    const store = app.getStore();
    store.feedbacks = Array.isArray(store.feedbacks) ? store.feedbacks : [];
    const feedback = {
      id: `feedback_${Date.now()}`,
      createdAt: new Date().toISOString(),
      content,
      message: content,
      rating: Number(this.data.feedbackRating || 5),
      category: this.data.feedbackCategory || "other",
      page: "profile",
      source: "weapp"
    };
    store.feedbacks.push(feedback);
    app.setStore(store);
    app.syncFeedback(feedback);
    this.setData({ feedbackText: "" });
    this.refresh();
    wx.showToast({ title: "已保存反馈", icon: "success" });
  },

  setSocialNickname(event) {
    this.setData({ socialNickname: event.detail.value });
  },

  toggleSocialSettings() {
    this.setData({ socialSettingsOpen: !this.data.socialSettingsOpen });
  },

  toggleShareOption(event) {
    const key = event.currentTarget.dataset.key;
    const socialView = {
      ...this.data.socialView,
      shareOptions: (this.data.socialView.shareOptions || []).map((item) => (
        item.key === key ? { ...item, checked: !item.checked } : item
      ))
    };
    this.setData({ socialView });
  },

  saveSocialProfile() {
    const nickname = String(this.data.socialNickname || "").trim().slice(0, 16);
    if (!nickname) {
      wx.showToast({ title: "昵称不能为空", icon: "none" });
      return;
    }
    const app = getApp();
    const store = app.getStore();
    const optionMap = (this.data.socialView.shareOptions || []).reduce((map, item) => {
      map[item.key] = item.checked !== false;
      return map;
    }, {});
    store.profile = {
      ...(store.profile || {}),
      nickname
    };
    store.social = {
      ...(store.social || {}),
      friendProfile: {
        ...(store.social && store.social.friendProfile || {}),
        nickname,
        shareLeaderboard: optionMap.shareLeaderboard !== false,
        shareWeeklySummary: optionMap.shareWeeklySummary !== false
      }
    };
    app.setStore(store);
    this.refresh();
    wx.showToast({ title: "已保存设置", icon: "success" });
  },

  copyFriendCode() {
    const code = this.data.socialView && this.data.socialView.friendProfile && this.data.socialView.friendProfile.friendCode;
    if (!code) return;
    wx.setClipboardData({
      data: code,
      success: () => wx.showToast({ title: "好友码已复制", icon: "success" })
    });
  },

  setFriendCodeInput(event) {
    this.setData({ friendCodeInput: String(event.detail.value || "").toUpperCase() });
  },

  addFriend() {
    const code = String(this.data.friendCodeInput || "").trim().toUpperCase();
    if (!code) {
      wx.showToast({ title: "先输入好友码", icon: "none" });
      return;
    }
    const ownCode = this.data.socialView && this.data.socialView.friendProfile && this.data.socialView.friendProfile.friendCode;
    if (code === ownCode) {
      wx.showToast({ title: "不能添加自己", icon: "none" });
      return;
    }
    const app = getApp();
    const store = app.getStore();
    if (!store.cloud || !store.cloud.enabled) {
      wx.showToast({ title: "先连接微信云", icon: "none" });
      return;
    }
    wx.showLoading({ title: "发送中" });
    app.addCloudFriendByCode(code)
      .then(() => {
        wx.hideLoading();
        this.setData({ friendCodeInput: "" });
        this.refresh();
        wx.showToast({ title: "已发送请求", icon: "success" });
      })
      .catch((error) => {
        wx.hideLoading();
        wx.showModal({
          title: "添加失败",
          content: error && (error.errMsg || error.message) || "请确认好友码是否正确。",
          showCancel: false
        });
      });
  },

  respondFriend(event) {
    const friendshipId = event.currentTarget.dataset.id;
    const status = event.currentTarget.dataset.status;
    if (!friendshipId) return;
    wx.showLoading({ title: status === "accepted" ? "确认中" : "处理中" });
    getApp().respondCloudFriendship(friendshipId, status)
      .then(() => {
        wx.hideLoading();
        this.refresh();
        wx.showToast({ title: status === "accepted" ? "已确认" : "已拒绝", icon: "success" });
      })
      .catch((error) => {
        wx.hideLoading();
        wx.showModal({
          title: "操作失败",
          content: error && (error.errMsg || error.message) || "请稍后再试。",
          showCancel: false
        });
      });
  },

  removeFriend(event) {
    const friendshipId = event.currentTarget.dataset.id;
    if (!friendshipId) return;
    wx.showModal({
      title: "移除好友",
      content: "移除后，对方不会再出现在你的好友排行里。",
      confirmText: "移除",
      cancelText: "取消",
      success: (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: "移除中" });
        getApp().removeCloudFriendship(friendshipId)
          .then(() => {
            wx.hideLoading();
            this.refresh();
            wx.showToast({ title: "已移除", icon: "success" });
          })
          .catch((error) => {
            wx.hideLoading();
            wx.showModal({
              title: "移除失败",
              content: error && (error.errMsg || error.message) || "请稍后再试。",
              showCancel: false
            });
          });
      }
    });
  },

  markReleaseRead(event) {
    const releaseId = event.currentTarget.dataset.id;
    if (!releaseId) return;
    const app = getApp();
    const store = app.getStore();
    store.releaseReads = {
      ...(store.releaseReads || {}),
      [releaseId]: new Date().toISOString()
    };
    app.setStore(store);
    this.refresh();
    wx.showToast({ title: "已标记已读", icon: "success" });
  },

  resetDemo() {
    wx.showModal({
      title: "重置训练数据",
      content: "会把当前计划和训练记录重置为演示数据；如果云端已连接，也会同步覆盖云端。",
      confirmText: "重置",
      cancelText: "取消",
      success: (res) => {
        if (!res.confirm) return;
        const app = getApp();
        app.resetDemo();
        this.refresh();
        wx.showToast({ title: "已重置", icon: "success" });
      }
    });
  },

  syncCloud() {
    const app = getApp();
    wx.showLoading({ title: "同步中" });
    app.syncCloudNow()
      .then(() => app.refreshCloudSocial().catch(() => null))
      .then(() => {
        wx.hideLoading();
        this.refresh();
        wx.showToast({ title: "已同步", icon: "success" });
      })
      .catch((error) => {
        wx.hideLoading();
        wx.showModal({
          title: "同步失败",
          content: error && (error.errMsg || error.message) || "请稍后再试。",
          showCancel: false
        });
      });
  }
});
