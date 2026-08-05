# Healthy Pro 微信小程序 v0.5.8 正式发布候选

Updated: 2026-08-05

## Candidate Identity

- Registered Mini Program: `AI4RockyHP`
- In-product brand: `Healthy Pro`
- AppID: `wx9f1d623ecc4ce4ae`
- Candidate version: `0.5.8`
- CloudBase environment: `cloud1-d3g79qnvd808824c9`
- Product entrance: WeChat Mini Program only; there is no Healthy Pro H5 production route.
- Current status: local release candidate. It must not be described as a formal version until review passes and an administrator clicks publish.

## Upload Copy

### Project Note

```text
正式发布候选：补齐数据与隐私说明、本人数据导出和自助删除；保留已验证的训练计划、记录、器械和好友摘要能力。
```

### User-Facing Update Announcement

```text
数据与隐私管理

新增清晰的数据用途和非医疗边界说明；支持导出本人评估、计划、训练、身体和反馈记录；删除前会完整核对云端数据范围，若中途失败会暂停同步并支持安全重试。
```

### Review Description

```text
AI4RockyHP（产品内名称 Healthy Pro）是健身房训练计划和训练记录工具。用户填写身体与训练目标后，应用在本地生成一般健身建议，并通过当前微信 OpenID 将本人的评估、计划和训练记录保存到微信云开发。应用不提供医疗诊断、疾病治疗或付费服务。

本版本新增“我的 > 设置与反馈 > 数据与隐私”：用户可查看数据用途、导出本人数据，并在两次确认后删除当前微信身份下的云端数据及本机草稿。好友功能仅展示用户主动允许共享的训练次数、完成率和连续周数，不展示体重、体脂、训练重量、完整计划、备注或反馈。
```

### Reviewer Test Path

1. Open the Mini Program. A new WeChat user enters `基础评估` automatically.
2. Fill age, gender, height, weight, optional body-fat percentage, training experience, target, focus area, weekly limit, duration, and no-injury option.
3. Generate the four-week plan and inspect `首页` and `计划`.
4. Open `记录`, complete at least one exercise, and save the training record.
5. Open `我的 > 设置与反馈 > 数据与隐私` to inspect the privacy boundary and export path.
6. The delete button first previews the current user's affected record counts and then asks for a final irreversible confirmation. Do not confirm unless deletion behavior is specifically under review.
7. Open `我的 > 更新公告` and check v0.5.8.

No username or password is required. WeChat OpenID is obtained by the `login` cloud function.

## Suggested Service Category

Use the closest category currently offered to the registered personal Mini Program for a general fitness planning and logging tool, preferably `体育 > 在线健身` or the equivalent sports/fitness category shown in the live admin console.

Do not choose a medical consultation, diagnosis, treatment, hospital, drug, or clinical health category. If the console does not offer a non-medical fitness category to this entity type, stop and review the available options rather than misclassifying the service.

## Privacy Protection Guide Draft

The live WeChat privacy-protection guide must match the fields and purposes below. Use the exact standardized privacy-field names offered by the admin console, but do not declare unused platform permissions.

| Data | Source | Purpose | Sharing |
| --- | --- | --- | --- |
| WeChat OpenID | WeChat cloud login | Bind the user to owner-scoped cloud data | Not shown to friends or other users |
| Age, gender, height, weight, body-fat percentage | User input | Estimate a conservative training starting point and generate the plan | Not shared with friends |
| Training experience, target, focus areas, weekly limit, duration, injury/doctor limitation | User input | Generate and adjust the training plan; apply the non-medical safety boundary | Not shared with friends |
| Plan and training logs, including exercise, sets, repetitions, weight, duration, speed, incline, resistance, perceived effort, and notes | User activity/input | Run the workout, restore history, and create personal trends | Not shared with friends |
| Body logs, including weight, body-fat percentage, sleep, and notes | User input | Personal progress review | Not shared with friends |
| Custom nickname, friend code, friendship status, and sharing choices | User input/application generation | Friend request and allowed weekly ranking | Only nickname and opted-in weekly summary are visible to accepted friends |
| Feedback content and rating | User input | Product troubleshooting and improvement | Not shared with friends |

The Mini Program does not currently request location, contacts, phone number, camera, album, microphone, WeRun, payment, or a WeChat profile avatar/nickname API. Do not declare these fields unless the code changes.

### Purpose and Boundary Copy

```text
Healthy Pro 使用你主动填写的身体情况、训练目标、训练计划和训练记录，为你生成一般健身建议、保存训练进度并在当前微信账号下恢复数据。Healthy Pro 不提供医疗诊断、疾病治疗或医生服务，不能替代专业医疗意见。选择伤病或心血管限制时，应用会停止生成计划并建议线下评估。

好友仅能看到你主动允许共享的训练次数、完成率和连续周数，不会看到体重、体脂、训练重量、完整计划、备注或反馈。你的数据保存在当前设备和微信云开发环境中，不出售给其他机构。

你可以在“我的 > 设置与反馈 > 数据与隐私”导出或永久删除本人数据。永久删除会清除当前微信身份下的评估、计划、训练和身体记录、反馈及好友关系，且无法恢复。
```

## Exact Candidate P0 Gate

Automatable before upload:

- `npm run check`
- JavaScript syntax checks for Mini Program and cloud-function files
- `git diff --check`
- targeted secret scan
- verify the export excludes raw own/friend OpenID and internal CloudBase configuration
- verify `dataRights` derives identity only from `cloud.getWXContext()`
- verify deletion covers `users`, `plans`, `training_logs`, `feedbacks`, legacy `feedback`, and `friendships`
- verify deletion preview counts all records beyond the first 100
- verify a partial cloud deletion is idempotently retryable and reports remaining data
- verify local `setStore` or `removeStorageSync` failures retain the persistent lock and block store/log/feedback/social writes, including after restart

Must be proved after the exact candidate is uploaded:

- deploy `dataRights` from WeChat DevTools to `cloud1-d3g79qnvd808824c9`
- use a disposable test WeChat account to export and permanently delete test data
- confirm a disposable account can finish deletion and restart with a new empty profile
- repeat A/B private-data isolation on v0.5.8
- clear local data or use a second device and confirm same-account cloud restore
- verify `我的 > 更新公告` displays v0.5.8
- confirm the live privacy-protection guide matches this document

## Admin-Only Formal Release Steps

1. In WeChat DevTools, select environment `cloud1-d3g79qnvd808824c9` and deploy cloud function `dataRights` with cloud-side dependency installation.
2. Upload Mini Program development version `0.5.8`.
3. In the WeChat Mini Program admin console, complete/confirm service category and the privacy-protection guide.
4. Submit `0.5.8` for review with the review description and test path above.
5. Wait for review. If rejected, fix the cited issue and upload a new candidate; do not replace evidence silently.
6. After approval, an administrator must click `发布`. Review approval alone is not the public release.

## Rollback

- Code rollback point before this candidate: Git commit `9f1874c` / Mini Program v0.5.7.
- Cloud function `dataRights` is additive. If its deployment is faulty, do not expose the delete entry in a newly uploaded candidate; restore the previous candidate code rather than changing production data.
- Never test permanent deletion with an existing primary tester account. Use a disposable account and export first.
