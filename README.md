# Healthy Pro

移动端优先的健身房私教 MVP。

## 当前版本

- 邮箱 + 密码账号体系；配置 Supabase 后，账号、计划和记录保存到云端。
- 基础评估：年龄、性别、身高、体重、体脂、训练经验、时间限制、伤病边界。
- 专业教练计划：结合身体数据、目标、训练经验和重点部位，自动判断目标、频次、单次时长、4 周训练结构。
- 今日训练：展示器械、组数、次数/时长、休息、用力感和动作要点。
- 训练记录：力量动作记录重量/次数，有氧动作记录时长/档位，每个动作记录感觉。
- 身体记录：体重、体脂、睡眠、备注。
- 器械库：保留 17 个图文能匹配的核心设备，按有氧区、力量区、自由力量区分组。
- PWA：支持添加到手机桌面，显示云端同步、离线和安装状态。

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

构建会读取以下环境变量，并写入 `dist/src/runtime-config.js`：

```bash
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
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

## Supabase 接入

1. 在 Supabase SQL Editor 执行 `docs/supabase-schema.sql`。
2. 在 Supabase Auth 里使用 Email + Password。若不想注册后收确认邮件，关闭 email confirmation。
3. 在 Vercel Project Settings -> Environment Variables 配置：

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

4. 重新部署 Vercel。配置缺失时 App 会退回本地模式，方便开发预览。

## 下一步接入

- AI 模型：使用 `docs/ai-coach-spec.md` 的输出结构和系统提示词，替换 `src/coach.js` 中的本地规则生成。
- 计划调整：基于最近 2-3 次训练记录，自动调整下周容量、重量和频次。
