# Healthy Pro Mini Program Data Operations

Updated: 2026-07-13

This runbook is for the controlled friend trial. It avoids routine inspection of private body and training records.

## Backup Before Risky Changes

Before changing a schema, collection permission, or cloud function that writes data:

1. In CloudBase, export `users`, `plans`, `training_logs`, `feedbacks`, and `friendships` to a date-stamped owner-controlled archive.
2. Record the environment ID, export time, collection names, record counts, and operator. Do not paste record contents into project docs or chat.
3. Keep the archive outside the repository. Never commit exports containing openid, body data, notes, or training details.

`feedback` is treated as a legacy collection and `feedbacks` as the active Mini Program collection until a read-only migration audit proves otherwise. Do not delete either collection during the friend trial.

## Restore

- Normal user restore is automatic: the same WeChat account signs in, obtains the same openid, and reloads its owner-scoped CloudBase store.
- If an operator import is required, first restore to a non-production test collection and compare counts and document IDs. Import to production only with an explicit rollback point and user approval.
- Demo or local seed data must never overwrite a newer cloud store.

## User Data Export and Deletion

- v0.5.8 adds `我的 > 设置与反馈 > 数据与隐私`.
- Export is generated locally from the current user's store. It includes the user's assessment, plan, training/body logs, feedback, sharing settings, and sanitized friend summaries. It excludes raw own/friend OpenID and CloudBase configuration.
- Permanent deletion is implemented by the additive `dataRights` cloud function. The function derives identity only from `cloud.getWXContext()`; it never accepts an OpenID from the client.
- The user must pass two confirmation steps. The first explains the irreversible effect; the second fully paginates and previews exact owner-scoped record counts rather than silently stopping at 100 records.
- Deletion removes owner data from `users`, `plans`, `training_logs`, active `feedbacks`, legacy `feedback`, and both directions of `friendships`. Each collection step is idempotent: a retry safely treats records removed by an earlier partial attempt as already complete.
- A persistent OpenID-scoped deletion lock is written before the cloud call. A partial cloud result keeps the existing local store, reports remaining categories, and blocks store/log/feedback/social writes so local data cannot repopulate deleted cloud records.
- After the cloud confirms that every covered category is empty, the client first persists an explicit new empty profile, then clears legacy storage and training/body drafts. Any local storage failure retains the lock and keeps all cloud writes fail-closed until the user retries successfully.
- New health-data collections must be added to `dataRights` before they can ship. A collection omitted from the function is a release-blocking privacy defect.
- Automated checks cover a partial cloud attempt followed by an idempotent retry, more than 100 records, local `setStore`/`removeStorageSync` failures, blocked write paths, and restart behavior while the lock exists.
- Deploy and validate `dataRights` using a disposable account. Never test irreversible deletion with an existing primary tester account.

## Evidence

For backup or deletion operations, retain only metadata: operator, time, environment, affected collections, counts, result, and rollback reference. Do not retain private record contents as routine evidence.
