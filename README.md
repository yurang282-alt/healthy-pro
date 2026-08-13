# Healthy Pro

Healthy Pro 是健身计划与训练记录工具，当前由两个互补入口组成：

- 微信小程序：评估、生成/调整计划、健身房训练执行、记录与好友功能。
- Healthy Web：在 Rocky LifeMap 中查看同一份计划、训练历史和阶段进度，不创建第二套数据。

## 当前架构

- 权威业务数据：微信小程序 CloudBase，按微信 `openid` 隔离。
- Web 身份：Rocky 统一账号。
- 跨端关联：Rocky 身份服务确认本人后，经服务端绑定表找到对应微信档案。
- Web 权限：第一版只读；浏览器不能提交 OpenID 或 owner，也不在本地持久化健康数据。
- 正式 Web 路径：`https://rocky4ai.com/apps/healthy/`。

Supabase 与 Vercel 仅作为历史资源冻结保留。官方构建不再包含 Supabase 配置、依赖或数据写入，也不再维护旧 PWA 与小程序的功能对齐。

## 本地运行

```bash
npm run dev
```

打开带本地只读样例数据的 Web 伴侣版：

```text
http://127.0.0.1:5173/apps/healthy/?fixture=1
```

检查 Rocky 与微信档案尚未关联时的绑定引导：

```text
http://127.0.0.1:5173/apps/healthy/?fixture=unbound
```

未带 fixture 参数时会走真实 Rocky 登录与 Healthy API；本地没有该服务时应显示失败关闭状态，不会回退到旧数据。

## 检查与构建

```bash
npm run check
npm run build
```

CloudBase 静态发布物生成到：

```text
dist-cloudbase/apps/healthy/
```

该目录只能发布到 `/apps/healthy/`，不能发布到 CloudBase 根目录 `/`。

## 目录

- `healthy-pro-weapp/`：微信小程序与 CloudBase 云函数。
- `src/web/`：Healthy Web 只读伴侣端。
- `healthy-pro-web-api/`：Rocky 会话校验与微信档案只读 BFF 候选。
- `healthy-pro-weapp/cloudfunctions/rockyBinding/`：由微信运行时证明 OpenID 并消费一次性绑定码。
- `scripts/check-healthy-web.mjs`：构建范围、数据隔离、脱敏、同源写接口和器械资源检查。
- `scripts/check-weapp-rocky-binding.cjs`：绑定码过期/重放、撤权与双向唯一性检查。
- `docs/healthy-web-companion.md`：跨端架构、启用顺序与回滚边界。
- `docs/healthy-lifemap-handoff.md`：交给 `app-factory` 的 LifeMap 注册、发布顺序和验收清单。
- `release/healthy-web-app-factory-manifest.json`：机器可读的精确发布范围，锁定 `train -> /apps/healthy/`，禁止根目录发布。

## 上线前依赖

1. Rocky 身份服务正式登记 `healthy` 及 `healthy:data:read` 权限。
2. 创建四个仅服务端可读写的绑定集合，部署 `rockyBinding` 与 Healthy Web BFF，保持三个功能开关默认关闭。
3. 完成双账号隔离、过期码、旧码、重放、撤权与冲突负向测试后，先为测试账号开放绑定和只读数据。
4. 由 `app-factory` 将静态发布物接入 `/apps/healthy/`，验证精确 URL 后再把入口加入 LifeMap。
5. 健康数据属于高敏数据；同源 `/apps/*` 不能提供浏览器级隔离。扩大到真实朋友前，必须完成整站同源安全审计，或改为独立 origin / 独立会话边界。

项目线程不直接发布 CloudBase 根目录、DNS、证书或 LifeMap 根入口。
