# Healthy A/B Release Acceptance Card

## 目的与边界

这张卡只用于把 Healthy Web 接入 LifeMap 前的受控 A/B 验收。小程序仍是训练执行和唯一写入端；Web 只读，不能写训练、身体或计划数据，也不能缓存健康数据。

- A/B 仅代表两个受控测试资格，不是用户昵称、账号、OpenID 或任何真实身份。
- 发布操作员只能看到 `slot=A/B`、不透明 `fixtureRef` / `bindingRef` 和 pass/fail；不得粘贴 Cookie、绑定码、OpenID、健康数据或可关联身份的字段。
- 本卡不授权 CloudBase、Git、生产、集合创建、授权发放或体验版上传。

平台 selector 是发布控制面，不进入 Healthy 业务接口。Healthy BFF 和 `rockyBinding` 不接收 `fixtureRef`、`bindingRef` 或 slot；它们仍独立校验 Rocky session、grant、allowlist、一次性码和 `cloud.getWXContext()`。这样服务注册、用户授权和微信绑定三层不会被混成一个“测试账号开关”。

## 发布对象与逐项门槛

| 对象 | 上线前置条件 | 成功证据 | 失败关闭与回滚 |
| --- | --- | --- | --- |
| Rocky 身份 `healthy` scope | 中央身份候选注册 `healthy`，只含 `session:read`、`healthy:data:read`；受保护 resolver 只解析 A/B | 脱敏收据通过 7 项矩阵且 `healthyBusinessReads=0`；之后真实会话仍必须有 active grant/allowlist | 不注册/撤销 grant 时 Web 返回拒绝；不尝试旧数据或降级读取 |
| 四个 binding collection | `rocky_healthy_binding_codes`、`rocky_healthy_binding_code_owners`、`rocky_healthy_bindings`、`rocky_healthy_binding_openids` 均为 server-admin-only | 客户端直读直写均被拒；两端云函数各自完成最小读写 | 任一权限规则不符，阻止发布；回滚只关开关，不删除绑定或训练数据 |
| `rockyBinding` 云函数 | 已部署但 `HEALTHY_ROCKY_BINDING_ENABLED=false`；仅 `cloud.getWXContext()` 取微信身份 | A/B 窗口中，正确码只成功一次；错误 AppID、冲突绑定、撤权都失败 | 关闭该开关；已存在绑定保持惰性，不改小程序原始档案 |
| Healthy Web BFF | 路由为 `/apps/healthy/api/`；`GET /bootstrap` 只读；`POST /binding-code` 同源 JSON；两个 Web 开关初始关闭 | 响应 `no-store`；浏览器不能提交 owner/OpenID；只返回脱敏数据 | 任一身份、grant、绑定或数据校验失败即拒绝；关闭两个 Web 开关 |
| Web 静态包 | 仅发布 `dist-cloudbase/apps/healthy/` 至 `/apps/healthy/`；不得发布根目录 | 精确 URL 正常打开；API 不被 service worker 缓存；无 Supabase 内容 | 回滚 Healthy 静态包；不得触碰根目录、DNS、旧 PWA |
| LifeMap registry | 仅将 `train` / `身体训练` 指向 `/apps/healthy/`，不得改 `healthy` / `健康体检站` | 从 LifeMap 点击进入精确路径，返回链接回 `/apps/lifemap/` | 恢复 `train` 为 pending；不影响其他 App |
| 微信 v0.5.9 | 小程序开发/体验候选已上传，且 `rockyBinding` 仍默认关闭 | A/B 在真实微信端能看到绑定入口和受控失败提示；原训练流程不回归 | 撤下体验资格或关闭绑定开关；不需要回滚训练数据 |

## 本地已验证的失败关闭证据

运行 `npm run check` 时，合成 fixture 证明以下行为：

- Web 没有 `healthy:data:read` 时返回 `APP_ACCESS_DENIED`，且不会读取绑定或训练档案。
- 未绑定时返回 `WECHAT_BINDING_REQUIRED`，且不会读取训练档案。
- 绑定码已使用、过期、被替换、App ID 不符时返回 `BINDING_CODE_INVALID_OR_EXPIRED`。
- grant 缺失、撤销、scope 缺失、allowlist 撤销/过期或身份关联不符时返回 `HEALTHY_ACCESS_REVOKED` 或 `ROCKY_ACCOUNT_UNAVAILABLE`。
- 微信账号和 Rocky 账号的双向冲突都会被拒；正确路径把绑定码及 owner pointer 事务性标为已消费。
- Web BFF 只有 `GET /bootstrap` 与 `POST /binding-code`；同源/JSON 不成立的写请求被拒。
- Web API 使用 `no-store`，前端无 `localStorage`、`sessionStorage`、`indexedDB`，service worker 跳过 `/apps/healthy/api/`。

这些都是合成 fixture，不是生产 A/B 证据。

## 平台脱敏收据闸门

平台本地候选 commit 为 `a7351e875f95774e4bc818eb03480e15584453df`，交接文件为 `HEALTHY_AB_CONTROLLED_ONBOARDING_HANDOFF_20260813.md`。它只证明中央代码候选和合成矩阵，不代表已部署或已给用户授权。

正式发布操作员必须先用平台脚本验证服务端生成的脱敏收据。收据必须同时满足：

- `kind=rocky-healthy-controlled-ab-acceptance`、`appId=healthy`、`serviceRegistration=pass`。
- `healthyBusinessReads=0`。
- `aSuccess`、`bSuccess`、`wrongAccount`、`missingGrant`、`revoked`、`expired`、`replay` 七项均为 `pass`。
- 任意层级不得出现 email、Rocky 用户 ID、OpenID、Cookie、Token 或 authorization 字段。

收据通过只允许进入真实 A/B + 微信验收；不会自动打开 Healthy 三项开关，也不会读取训练或身体数据。

## 受控 A/B 必测清单

| 场景 | 预期 | 证据记录方式 |
| --- | --- | --- |
| A 正常绑定并打开 Web | 只看到 A 自己的计划与训练摘要 | `slot=A / PASS`，不保存页面内容 |
| B 正常绑定并打开 Web | 只看到 B 自己的计划与训练摘要 | `slot=B / PASS`，不保存页面内容 |
| A 使用 B 的码 | 被拒，A/B 都不产生新绑定 | `slot=A / CROSS_CODE_DENIED` |
| 未授权资格 | 无 scope 或 grant 时被拒，不能看到健康数据 | `slot=A / GRANT_DENIED` |
| 过期或重复消费码 | 被拒，不能覆盖既有绑定 | `slot=A / REPLAY_DENIED` |
| 撤销 A 的 allowlist 或 grant | 已有 Web 会话刷新后被拒，前端无旧健康内容 | `slot=A / REVOKED_DENIED` |
| 直接客户端访问 binding collection | 读写都被权限规则拒绝 | `slot=A / COLLECTION_DENIED` |
| LifeMap 跳转 | 只更新 `train`，进入 `/apps/healthy/` | `slot=A / ROUTE_PASS` |
| 微信 v0.5.9 原流程 | 未绑定也可完成既有训练、记录和同步 | `slot=A / WECHAT_REGRESSION_FREE` |

## 不能由本地 fixture 伪造的证据

以下项目必须在受控 A/B 的真实 Rocky、CloudBase 和微信环境完成：

1. 中央身份服务实际注册 `healthy` scope，且 grant/allowlist 撤销后立即失效。
2. 四个 collection 的真实 server-admin-only 权限，以及普通客户端无法直接访问。
3. `rockyFormalWeb` 对 `/apps/healthy/` 与 `/apps/healthy/api/` 的真实路由、CSP 和部署哈希。
4. 同源 Rocky session 的 Cookie 传递、BFF 独立会话校验和跨设备一次性码消费。
5. A/B 两份真实数据的相互隔离、撤权后的刷新行为、浏览器开发者工具无 API 缓存。
6. 微信开发版 v0.5.9 的真机入口、云函数 `getWXContext()`、原训练流程回归及体验版可见版本。
7. LifeMap `train` 真实跳转和精确 `https://rocky4ai.com/apps/healthy/` 可用性。

## 最小发布顺序与回滚点

1. 先固化并发布中央 identity code-only 候选，不改 grant、路由、数据或开关；服务端 resolver 生成脱敏 A/B 收据并通过 7 项验证。
2. 四个 collection 锁为 server-admin-only；部署 `rockyBinding`、BFF 和静态包时三项开关均关闭，并记录精确函数/静态哈希。
3. 仅对 selector 解析出的 A/B 短时开启绑定，跑完正向与拒绝路径；再对同一 A/B 开启 Web 只读。
4. 精确 URL 与微信 v0.5.9 真机回归通过后，才把 LifeMap `train` 更新为 live。
5. 任何异常：先关闭 `HEALTHY_WEB_ENABLED`、`HEALTHY_WEB_BINDING_READ_ENABLED`、`HEALTHY_ROCKY_BINDING_ENABLED`，再恢复 `train` pending；不删除 binding、grant、训练或身体数据。

## 当前交接结论

Healthy 侧无需运行时兼容修改，已可消费平台脱敏 A/B 收据所建立的发布闸门。中央身份本地候选和 32/32 合成矩阵已完成，但尚未部署；正式 Web 路由、四个 collection 权限和真实 A/B/微信验收仍未发生。以上任一项未关闭时，必须保持三项开关关闭，LifeMap `train` 保持 pending。
