# Healthy Pro Friend Trial P0 Checklist

Updated: 2026-07-11

Latest evidence record: `docs/friend-trial-p0-evidence-2026-07-10.md`.

## CTO Priority Plan: Friend Trial Before New Features

Healthy Pro / Rocky is the current high-priority Exercise app. The goal is not to add more features now, but to prove that the Mini Program is safe enough for a small friend trial.

### P0 Confirmations Required

1. **CloudBase permissions**
   - Confirm `users`, `plans`, `training_logs`, `feedback`, `feedbacks`, and `friendships` are private by default.
   - Confirm client-side code cannot directly read another user's private training/body data.
   - Confirm friend/ranking data is exposed only through the `social` cloud function and only returns summary fields.

2. **openid and user isolation**
   - Confirm every user's local storage key is scoped by openid.
   - Confirm CloudBase document IDs remain owner-scoped, for example `user_<openid>`, `plan_<openid>`, and `log_<openid>_<logId>`.
   - Confirm no fallback/demo data can overwrite a real user's cloud data after login.

3. **Two-user verification**
   - Test with two real WeChat users on the current experience version.
   - User A and User B each create assessment, plan, logs, and feedback.
   - A/B must not see each other's private plans, logs, body data, notes, or feedback.
   - After adding friends, each side should see only allowed friend summary data.

4. **Backup and restore**
   - Clear local data or switch device for the same WeChat user.
   - Confirm cloud data restores assessment, current plan, training logs, and profile state.
   - Define the operator recovery path before changing schema, permissions, or cloud functions.

5. **Experience-version release path**
   - Upload a Mini Program development version.
   - Set or confirm it as the experience version.
   - Verify on a real phone through the Mini Program experience entrance.
   - Confirm `我的 > 更新公告` shows the latest release note.

### Current State

Already available:

- Mini Program is the priority product surface.
- CloudBase environment is known: `cloud1-d3g79qnvd808824c9`.
- `login` and `social` cloud functions belong to Healthy Pro.
- Code uses openid-scoped local storage and openid-scoped document IDs.
- Friend lookup/ranking is designed to go through `social`, not direct full-user reads.
- The app already has assessment, plan generation, plan editing, training logging, equipment, profile, friends, feedback, and update announcements.

Still missing or not formally evidenced:

- CloudBase database permission-rule evidence.
- Live function-version evidence for `social`.
- Written two-user trial record with pass/fail notes.
- Backup/restore runbook and proof.
- Experience-version verification record tied to a version number and update announcement.

### Minimal Next Actions

1. Capture CloudBase permission and live-function evidence without inspecting private record contents.
2. Run the two-user real-device privacy and restore script on the current experience version.
3. Record the release evidence: AppID, CloudBase env, version, tester devices, update announcement, pass/fail result.

### Do Not Do Now

- Do not add new training features before the P0 gate is closed.
- Do not do broad UI redesign during this readiness pass.
- Do not edit or clean production CloudBase data unless there is an explicit recovery plan.
- Do not deploy Healthy Pro as a CloudBase H5 entry or to root `/`.
- Do not connect PWA/Supabase data to Mini Program/CloudBase yet.

### Evidence To Report Back To CTO

- CloudBase env and Mini Program AppID used for the check.
- Experience version number and upload/experience status.
- Permission-rule screenshots or exported rule text.
- Confirmation that `login` and `social` live versions match the repo intent.
- Two-user matrix: A sees A data, B sees B data, friend summary only, no private cross-user visibility.
- Restore result after clearing local storage or switching device.
- Latest update announcement screenshot or manual verification note.
- Remaining P0/P1/P2 risks.

## One-Line Gate

Healthy Pro is cleared for a small known-friend trial after CloudBase metadata checks, two-user isolation verification, and backup/restore verification. The product should still avoid broad public release until release-candidate checks and post-trial fixes are complete.

1. Small known-friend trial is allowed.
2. Formal public release is still blocked by privacy copy, export/delete expectations, and final release-candidate evidence.
3. v0.5.2 edit-plan UI remains `awaiting_user` until real-device confirmation.

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
| Two users cannot see each other's data | Satisfied by user report | Recheck on the next release candidate before public release |
| Training/body data privacy | Not ready | Data exists in CloudBase and should be treated as private health/body/training data |
| Friend sharing privacy | Code fixed, live version needs confirmation | `social` cloud function removes direct cross-user `users` reads from the client; must verify the deployed version before trial |
| Backup/export/restore | Restore satisfied by user report | Export/delete expectations remain P1 |
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

- Remove `friendCode` from friend summary responses returned by the `social` cloud function. A user's friend code should only be visible to themselves, not included in other friends' summary payloads.
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
