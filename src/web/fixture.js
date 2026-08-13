export function createHealthyFixture() {
  return {
    schemaVersion: 1,
    source: {
      kind: "healthy-weapp-cloudbase",
      syncedAt: "2026-08-12T08:20:00+08:00"
    },
    profile: { nickname: "Rocky" },
    assessment: {
      targetPreference: "gain",
      trainingExperience: "familiar",
      focusAreas: ["chest", "back"],
      sessionBudget: 60,
      weeklyLimit: "3"
    },
    plan: {
      id: "fixture-plan",
      createdAt: "2026-08-01T09:00:00+08:00",
      goal: { type: "精益增肌期", priority: "提高有效训练量，同时控制增脂速度" },
      frequency: { sessionsPerWeek: 3, pattern: "胸部强化 / 背部强化 / 腿臀辅助" },
      duration: { label: "45-60 分钟", budget: 60 },
      weeks: [
        { week: 1, label: "适应周", rule: "动作标准优先" },
        { week: 2, label: "稳定周", rule: "稳定完成目标次数" },
        { week: 3, label: "微进阶周", rule: "主动作小幅加量" },
        { week: 4, label: "复盘周", rule: "根据记录调整下一轮" }
      ],
      workouts: [
        {
          id: "A",
          title: "胸部强化",
          focus: "主练胸，肩和三头只做辅助",
          exercises: [
            { id: "warmup", name: "跑步机短热身", equipmentId: "treadmill", equipmentName: "跑步机", type: "cardio", sets: "1 段", reps: "5-8 分钟", rest: "无" },
            { id: "chest-press", name: "坐姿推胸", equipmentId: "chest-back-press", equipmentName: "胸肌/背肌推举训练机", type: "strength", sets: "4 组", reps: "10-12 次", rest: "75 秒", loadLabel: "建议起步：25-35kg" },
            { id: "incline", name: "史密斯上斜推胸", equipmentId: "smith-machine", equipmentName: "史密斯训练架", type: "strength", sets: "3 组", reps: "8-10 次", rest: "90 秒", loadLabel: "建议起步：25-30kg 总重" }
          ]
        },
        {
          id: "B",
          title: "背部强化",
          focus: "下拉和划船优先做扎实",
          exercises: [
            { id: "warmup-b", name: "跑步机短热身", equipmentId: "treadmill", equipmentName: "跑步机", type: "cardio", sets: "1 段", reps: "5-8 分钟", rest: "无" },
            { id: "pulldown", name: "高位下拉", equipmentId: "high-row", equipmentName: "高拉训练器", type: "strength", sets: "4 组", reps: "10-12 次", rest: "75 秒", loadLabel: "建议起步：25-30kg" },
            { id: "row", name: "坐姿划船", equipmentId: "seated-row", equipmentName: "坐姿划船机", type: "strength", sets: "4 组", reps: "10-12 次", rest: "75 秒", loadLabel: "建议起步：25-35kg" }
          ]
        },
        {
          id: "C",
          title: "腿臀辅助",
          focus: "覆盖股四头、臀和大腿后侧",
          exercises: [
            { id: "warmup-c", name: "跑步机短热身", equipmentId: "treadmill", equipmentName: "跑步机", type: "cardio", sets: "1 段", reps: "5-8 分钟", rest: "无" },
            { id: "leg-press", name: "坐式蹬腿", equipmentId: "leg-press", equipmentName: "坐式蹬腿训练器", type: "strength", sets: "4 组", reps: "12-15 次", rest: "90 秒", loadLabel: "建议起步：50-70kg" },
            { id: "hip-thrust", name: "臀推", equipmentId: "hip-thrust", equipmentName: "臀推训练机", type: "strength", sets: "3 组", reps: "10-12 次", rest: "90 秒", loadLabel: "建议起步：40-50kg" }
          ]
        }
      ]
    },
    trainingExecution: {
      nextWorkoutId: "B",
      overrideWorkoutId: ""
    },
    logs: [
      {
        id: "log-1",
        createdAt: "2026-08-05T19:20:00+08:00",
        workoutId: "A",
        workoutTitle: "胸部强化",
        week: 2,
        completedCount: 3,
        intensityFeedback: "right",
        exercises: [
          { id: "warmup", name: "跑步机短热身", done: true, durationMinutes: "6", feelingLabel: "正好" },
          { id: "chest-press", name: "坐姿推胸", done: true, setsDone: 4, weight: "30", reps: "12", feelingLabel: "正好" },
          { id: "incline", name: "史密斯上斜推胸", done: true, setsDone: 3, weight: "27.5", reps: "9", feelingLabel: "偏重" }
        ]
      },
      {
        id: "log-2",
        createdAt: "2026-08-08T18:45:00+08:00",
        workoutId: "B",
        workoutTitle: "背部强化",
        week: 2,
        completedCount: 3,
        intensityFeedback: "right",
        exercises: [
          { id: "warmup-b", name: "跑步机短热身", done: true, durationMinutes: "7", feelingLabel: "正好" },
          { id: "pulldown", name: "高位下拉", done: true, setsDone: 4, weight: "30", reps: "11", feelingLabel: "正好" },
          { id: "row", name: "坐姿划船", done: true, setsDone: 4, weight: "32.5", reps: "10", feelingLabel: "正好" }
        ]
      },
      {
        id: "log-3",
        createdAt: "2026-08-11T19:10:00+08:00",
        workoutId: "C",
        workoutTitle: "腿臀辅助",
        week: 3,
        completedCount: 3,
        intensityFeedback: "right",
        exercises: [
          { id: "warmup-c", name: "跑步机短热身", done: true, durationMinutes: "6", feelingLabel: "正好" },
          { id: "leg-press", name: "坐式蹬腿", done: true, setsDone: 4, weight: "65", reps: "12", feelingLabel: "正好" },
          { id: "hip-thrust", name: "臀推", done: true, setsDone: 3, weight: "45", reps: "11", feelingLabel: "正好" }
        ]
      }
    ],
    bodyLogs: []
  };
}
