# Rocky 中央身份接入就绪说明

日期：2026-07-22
状态：跨端绑定契约就绪，运行时未接入。

Healthy Pro 是微信小程序，不能读取 `rocky4ai.com` 的 Web Cookie。安全接入必须由 Rocky 账号中心生成一次性绑定码，并由 Healthy 云函数通过 `cloud.getWXContext()` 证明真实 OpenID；客户端不得上报 `rockyUserId` 或覆盖 OpenID。

当前 OpenID 归属的训练、身体、好友和历史数据保持冻结，不自动迁移。绑定运行时、namespaced 新数据集合、撤销/换绑和 A/B × 微信身份隔离验证完成前，Healthy 继续使用现有微信身份边界，不能标记为 Rocky SSO 已上线。

详细协议由中央平台文档 `docs/HEALTHY_WECHAT_BINDING_CONTRACT.md` 管理。该说明没有修改小程序、CloudBase 函数、集合、体验版或生产版本。
