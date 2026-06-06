# Healthy Pro

移动端优先的健身房私教 MVP。

## 当前版本

- 邮箱 + 密码账号体系，本地保存数据，邮箱唯一。
- 基础评估：年龄、性别、身高、体重、体脂、训练经验、时间限制、伤病边界。
- 专业教练计划：结合身体数据、目标、训练经验和重点部位，自动判断目标、频次、单次时长、4 周训练结构。
- 今日训练：展示器械、组数、次数/时长、休息、用力感和动作要点。
- 训练记录：力量动作记录重量/次数，有氧动作记录时长/档位，每个动作记录感觉。
- 身体记录：体重、体脂、睡眠、备注。
- 器械库：保留 17 个图文能匹配的核心设备，按有氧区、力量区、自由力量区分组。

## 本地运行

```bash
npm run dev
```

打开：

```text
http://127.0.0.1:5173
```

同一 Wi-Fi 下用手机预览：

```bash
npm run dev:lan
```

然后在手机浏览器打开：

```text
http://你的电脑局域网IP:5173
```

## 检查

```bash
npm run check
```

生成 Vercel 静态发布目录：

```bash
npm run build
```

## 快速演示

```text
http://127.0.0.1:5173?demo=focus
```

可直接打开指定页面：

```text
http://127.0.0.1:5173?demo=focus&view=plan&week=3
http://127.0.0.1:5173?demo=focus&view=log
http://127.0.0.1:5173?demo=focus&view=equipment
```

## 下一步接入

- Supabase：使用 `docs/supabase-schema.sql` 建表，替换当前 localStorage 数据层。
- AI 模型：使用 `docs/ai-coach-spec.md` 的输出结构和系统提示词，替换 `src/coach.js` 中的本地规则生成。
- 部署：`npm run build` 会生成 `dist/`，Vercel 发布该目录；接 Supabase 和模型后再加入环境变量。
