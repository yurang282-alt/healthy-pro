# Healthy Pro Friend Trial P0 Evidence - 2026-07-10

Status: closed for small friend trial after user-reported two-user isolation and restore verification.

Scope: WeChat Mini Program and CloudBase only. PWA/Supabase was not treated as the primary trial surface.

## Guardrails

- No production records were modified or deleted.
- No detailed training, body, note, plan, or feedback record content was read.
- CloudBase checks were limited to environment metadata, function metadata, permission metadata, and collection counts.
- Existing uncommitted v0.5.2 edit-plan UI work remains `awaiting_user`; it was not committed, uploaded, or published as part of this P0 pass.
- CloudBase root static hosting was not touched.
- User-reported real-device verification was accepted as trial evidence; no private screenshots or health data were requested.

## Verified Evidence

### Project and release context

- Mini Program root: `healthy-pro-weapp/`.
- AppID in repo: `wx9f1d623ecc4ce4ae`.
- CloudBase environment in repo: `cloud1-d3g79qnvd808824c9`.
- CloudBase config: `cloudbaserc.json` points to `cloud1-d3g79qnvd808824c9`.
- `PROJECT_CONTEXT.md` confirms Healthy Pro is Mini Program + CloudBase backend, not a CloudBase static H5 site.
- `/Users/bytedance/Documents/Codex/cloudbase-deployment-registry.md` confirms Healthy Pro has no `/healthy/`, `/apps/healthy/`, `/rocky/`, or `/apps/rocky/` static hosting entry today.

### Local code isolation

- `healthy-pro-weapp/utils/cloud.js` initializes CloudBase with `cloud1-d3g79qnvd808824c9`.
- Local storage is scoped by openid via `healthyProStore:user:<openid>` in `healthy-pro-weapp/app.js`.
- Cloud document IDs are owner-scoped:
  - `user_<openid>`
  - `plan_<openid>`
  - `log_<openid>_<logId>`
  - `feedback_<openid>_<feedbackId>`
- Normal app sync reads only `users.doc(user_<openid>)` for the current user.
- Normal app sync writes only owner-scoped `users`, `plans`, `training_logs`, and `feedbacks` documents.
- Friend lookup, requests, response/removal, and leaderboard reads route through the `social` cloud function.
- The `social` cloud function derives caller identity from `cloud.getWXContext().OPENID`.
- `respondFriendship` allows only the recipient to accept/decline.
- `removeFriendship` allows only requester or recipient to remove a friendship.
- `getSocial` returns friend summary fields, not full private store, full plans, training weights, notes, or feedback content.

### CloudBase environment

Read-only CLI command: `cloudbase env:list`

- Environment: `cloud1-d3g79qnvd808824c9`.
- Package: personal version.
- Status: `Normal`.
- Created: `2026-06-18 16:54:26`.
- Expiration: `2026-12-18 23:59:59`.

### Cloud functions

Read-only CLI command: `cloudbase functions:list`

Healthy Pro functions found:

| Function | Runtime | Created | Modified | Status |
| --- | --- | --- | --- | --- |
| `login` | Nodejs16.13 | 2026-06-18 17:38:03 | 2026-06-18 17:38:03 | Deployment completed |
| `social` | Nodejs16.13 | 2026-07-02 16:01:21 | 2026-07-02 16:01:21 | Deployment completed |

Note: function list confirms deployed function names and status, but does not prove live source hash equals local source.

### CloudBase permissions

Read-only CLI command: `cloudbase permission get collection -e cloud1-d3g79qnvd808824c9`

Healthy-related collections found with `private` permission:

| Collection | Permission |
| --- | --- |
| `users` | private |
| `plans` | private |
| `training_logs` | private |
| `feedback` | private |

Other related collections expected by the app:

- `feedbacks`: not present in the legacy permission list output, but count command works and returned 0.
- `friendships`: not present in the legacy permission list output, but count command works and returned 0.

Read-only CLI command: `cloudbase permission get function -e cloud1-d3g79qnvd808824c9`

- Function gateway permission: `custom`.

Read-only CLI commands:

- `cloudbase policy list -e cloud1-d3g79qnvd808824c9`
- `cloudbase policy get -e cloud1-d3g79qnvd808824c9`

Result:

- No user-configured gateway policy content returned by the new policy command.
- Legacy permission command still reports function permission as `custom`.

Risk interpretation: collection privacy looks correct for core Healthy collections; the function custom-policy source is not fully evidenced by CLI output and should remain a documented verification gap.

### Collection counts

Read-only CLI command: `cloudbase db nosql execute --json -c <count commands>`

Counts only; no record content read.

| Collection | Count |
| --- | ---: |
| `users` | 2 |
| `plans` | 2 |
| `training_logs` | 13 |
| `feedback` | 0 |
| `feedbacks` | 0 |
| `friendships` | 0 |

### Local validation

- `npm run check`: passed.
- `node --check healthy-pro-weapp/app.js`: passed.
- `node --check healthy-pro-weapp/utils/cloud.js`: passed.
- `node --check healthy-pro-weapp/cloudfunctions/login/index.js`: passed.
- `node --check healthy-pro-weapp/cloudfunctions/social/index.js`: passed.

### User-device validation

Reported by user after the metadata/code check:

- Two-user isolation verification: passed.
- Same-account backup/restore drill: passed.
- Result: P0 is closed for a small, known-friend trial.

## Not Yet Verified

Remaining evidence or product work:

1. Current experience version and `我的 > 更新公告` should still be spot-checked after the next upload.
2. v0.5.2 edit-plan UI remains `awaiting_user` and should not be promoted until real-device confirmation.
3. Before expanding beyond known friends, repeat two-user isolation and restore checks on the exact release candidate version.

P1 privacy-minimization follow-up:

- `social` currently builds public user summaries with `friendCode`. The UI does not need another user's friend code after a friendship is established, so this should be removed from friend summary payloads in a later code change. It is not changed in this documentation-only pass.

## Minimal Two-User Verification Script

Use two real WeChat users: A and B.

1. Confirm both open the same Mini Program experience version.
2. A completes assessment, generates plan, records one training session, and optionally submits feedback.
3. B completes assessment, generates plan, records a different training session, and optionally submits feedback.
4. A checks Home, Plan, Log, Profile. Expected: only A's own private plan/log/profile data appears.
5. B checks Home, Plan, Log, Profile. Expected: only B's own private plan/log/profile data appears.
6. A adds B by friend code; B accepts.
7. A and B check friends/ranking. Expected: only nickname and training summary metrics appear.
8. Confirm neither side sees the other's body data, full plan details, action weights, notes, or feedback content.
9. Remove the friendship. Expected: summary visibility stops after refresh/sync.
10. Record tester devices, WeChat users, version number, test time, pass/fail notes, and redacted screenshots.

## Minimal Backup/Restore Drill

Use one real WeChat user.

1. Complete assessment, generate plan, and save at least one training log.
2. Tap sync from Profile if available.
3. On the same phone, clear Mini Program local storage, or use another phone with the same WeChat account.
4. Reopen the Mini Program.
5. Expected: assessment, current plan, training logs, profile, and current week status restore from CloudBase.
6. Expected: demo seed data does not overwrite the cloud-restored user data.
7. Record device, account, version, test time, restored fields, and failure notes.

## Gate Decision

Decision: `closed_for_small_trial`.

Meaning:

- Allow a small known-friend trial, roughly 5-10 trusted users.
- Keep the trial controlled: share only the experience version, collect issues, and avoid broad public distribution.
- Do not submit for formal public release until update announcement, privacy copy, and any post-trial fixes are checked on the release candidate.

## Owners

| Item | Owner |
| --- | --- |
| Static code and CloudBase metadata evidence | Project |
| Experience version setting and tester distribution | User |
| Two-user privacy test | Completed by User |
| Backup/restore drill | Completed by User |
| Acceptance of small-trial risk | CTO/User |
| v0.5.2 edit-plan UI confirmation | User |

## Follow-Up: 2026-07-13

- v0.5.4 was uploaded after the historical evidence pass above; the earlier v0.5.2 `awaiting_user` note is superseded.
- Two-user isolation and same-account restore remain passed by user report.
- Repository `social` code now removes `friendCode` from internal friend/ranking summaries while preserving the current user's own code in their private profile response. WeChat DevTools deployment was attempted twice but failed at `getCloudAPISignedHeader` with platform error `41002`; the online function is therefore not claimed as updated.
- Core collection permissions were recorded as private during the P0 evidence pass. Platform rules remain CloudBase-managed and should be rechecked on the exact formal release candidate.
- Remaining user evidence: one short v0.5.4 real-device UI and `我的 > 更新公告` spot-check.
- Small known-friend trial remains allowed; formal public release remains a separate privacy, data-rights, and release-candidate gate.

## Git / Experience / User-Visible State

- Git branch at check time: `main`.
- Dirty worktree existed before this evidence pass:
  - `docs/friend-trial-p0-checklist.md`
  - `healthy-pro-weapp/pages/plan-editor/plan-editor.wxml`
  - `healthy-pro-weapp/pages/plan-editor/plan-editor.wxss`
  - `healthy-pro-weapp/pages/profile/profile.js`
- This evidence pass adds this file and links it from `docs/friend-trial-p0-checklist.md`.
- No commit was created.
- No Git push was performed.
- No Mini Program upload or release was performed.
- User-visible experience version status was not changed in this pass.
