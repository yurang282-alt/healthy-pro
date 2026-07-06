# Healthy Pro Friend Trial P0 Checklist

Updated: 2026-07-06

## One-Line Gate

Healthy Pro should not enter friend trial yet until the release and privacy verification below are completed. The product flow is close enough, and real CloudBase data exists, but friend trial is blocked by three production-readiness gaps:

1. CloudBase collection permissions and friend-data access boundaries are not documented or verified.
2. Two-user real-device isolation and restore are not verified.
3. Privacy defaults, backup/export/delete expectations, and experience-version release evidence are incomplete.

## Current Facts

- Primary trial surface: WeChat Mini Program in `healthy-pro-weapp/`.
- CloudBase environment: `cloud1-d3g79qnvd808824c9`.
- Default CloudBase domain: `https://cloud1-d3g79qnvd808824c9-1444897143.tcloudbaseapp.com`.
- Healthy Pro is not a CloudBase static H5 app today. No `/healthy/`, `/apps/healthy/`, `/rocky/`, or `/apps/rocky/` static path should be assumed.
- Cloud function `login` belongs to Healthy Pro.
- Read-only CloudBase metadata/count checks previously found real data traces: `users=2`, `plans=2`, `training_logs=12`; feedback/friendship collections were 0 at that check.
- Before any CloudBase work, read `/Users/bytedance/Documents/Codex/cloudbase-deployment-registry.md`.
- Do not deploy Healthy Pro to CloudBase root `/`. If an H5 entry is needed later, use `/apps/healthy/` and update both `PROJECT_CONTEXT.md` and the central registry.

## Evidence From Local Code

- `healthy-pro-weapp/utils/cloud.js` initializes CloudBase with the Healthy environment and AppID.
- `healthy-pro-weapp/cloudfunctions/login/index.js` returns `openid`, `appid`, and `unionid` through `wx-server-sdk`.
- Local storage is scoped with `healthyProStore:user:<openid>`.
- Cloud documents are named with openid-scoped IDs such as `user_<openid>`, `plan_<openid>`, `log_<openid>_<logId>`, and `feedback_<openid>_<feedbackId>`.
- Social/friend data is implemented through friend codes and `friendships`, but CloudBase collection permission rules are not present in this repo.
- The Mini Program code now routes friend lookup, friend requests, friend response/removal, and leaderboard reads through the `social` cloud function. The cloud function reads full user documents server-side but returns only minimal friend summary fields to the client.
- The registry records `social` as deployed, but the current local CLI cannot re-check the live function list. Before friend trial, verify the live `social` function matches this repository and run real-device verification.
- Existing docs state that CloudBase permission rules, two-user isolation, restore, real-device validation, and experience-version upload are still pending.

## P0 Checklist

| Area | Status | Decision |
| --- | --- | --- |
| Core flow: assess -> plan -> today -> log | Satisfied locally | Good enough for trial once data/release gates pass |
| WeChat identity | Partially satisfied | `login` cloud function exists and app binds to `openid`; needs real-device evidence |
| Local user isolation | Satisfied in code | Local store is openid-scoped |
| Cloud user isolation | Unverified | Code uses openid-scoped doc IDs, but platform collection permissions are not documented or tested |
| Two users cannot see each other's data | Unverified | Must test with two real WeChat users and CloudBase rules |
| Training/body data privacy | Not ready | Data exists in CloudBase and should be treated as private health/body/training data |
| Friend sharing privacy | Code fixed, live version needs confirmation | `social` cloud function removes direct cross-user `users` reads from the client; must verify the deployed version before trial |
| Backup/export/restore | Not ready | App can pull cloud store by openid, but user-level export, backup, delete, and recovery procedure are not defined |
| Experience version | Not ready | No evidence of Mini Program experience-version upload and real-device verification |
| Update announcements | Partially satisfied | In-app announcements exist; friend-trial release needs visible latest announcement verification |
| CloudBase static hosting | Not applicable | Healthy Pro has no H5 CloudBase entry today |

## Must Fix Before Friend Trial

1. CloudBase permissions
   - Document the intended permissions for `users`, `plans`, `training_logs`, `feedback`, `feedbacks`, and `friendships`.
   - Verify authenticated users can read/write only their own private documents.
   - Verify the deployed `social` cloud function matches this repository.
   - Confirm friend operations return only nickname, completion rate, current-week count, completed action count, streak weeks, and latest training time. The only friend code shown to a user should be their own code.
   - Confirm friend operations do not return full `store`, body records, full plans, training weights, notes, or feedback content.
   - Keep record-content inspection out of routine checks.

2. Two-user real-device verification
   - User A and User B both open the Mini Program with the formal AppID.
   - A creates assessment, plan, log, body record, and feedback.
   - B creates separate data and must not see A's private plan, logs, body records, or feedback.
   - A/B add each other by friend code; only accepted-friend summary fields should appear.
   - Reject/remove friend flows must stop future visibility.

3. Restore and release verification
   - Clear local storage or use a second device for the same WeChat user.
   - Confirm the cloud store restores the correct assessment, plan, logs, and profile.
   - Confirm stale demo seed data does not overwrite real cloud data.
   - Upload an experience version, install/open on real devices, and verify latest update announcement is visible.

## P1 Checklist

- Add a simple user data export path for self-backup.
- Define data deletion expectations for a friend trial: what can be deleted in app vs. what requires admin cleanup.
- Add an operator backup procedure before schema/permission changes.
- Decide whether `feedback` and `feedbacks` should both exist or whether one is legacy.
- Add a friend-trial script with tester names, devices, AppID, CloudBase env, test time, and pass/fail notes.
- Make privacy copy explicit in the app: what friends can see and what they cannot see.

## P2 Checklist

- Decide later whether PWA/Supabase and Mini Program/CloudBase accounts need linking.
- Add monitoring/logging only after the trial path is stable.
- Consider a CloudBase H5 entry under `/apps/healthy/` only if link-based access becomes necessary.
- Do not add AI chat, payment, public ranking, or health-device integration before the P0 trial gate passes.

## Minimal Next Step

The shortest path is not new features. Do this sequence:

1. Write and review CloudBase collection permission rules.
2. Run a two-user real-device isolation and restore test.
3. Upload a Mini Program experience version with a visible update announcement.

If any one of these fails, Healthy Pro is not ready for friend trial.

## Current Recommendation

For one-on-one owner testing, the current build is usable. For inviting friends, do not proceed until the `social` cloud function live version is confirmed, collection permissions are reviewed, and the two-user privacy test passes. The fastest safe product path is to keep `users`, `plans`, `training_logs`, `feedbacks`, and body data owner-only, and expose friend/ranking data only through the cloud function.
