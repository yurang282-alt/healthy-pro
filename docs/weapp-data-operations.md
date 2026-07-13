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

## User Data Deletion

- The current in-app reset is not an account-deletion guarantee and must not be described as one.
- During the controlled trial, deletion requests are operator-assisted. Confirm the requesting WeChat identity, list the owner-scoped documents to be removed across `users`, `plans`, `training_logs`, `feedbacks`, and `friendships`, take a rollback backup, then request explicit final confirmation.
- Formal public release requires a clear in-app or documented self-service deletion path and matching privacy-policy wording.

## Evidence

For backup or deletion operations, retain only metadata: operator, time, environment, affected collections, counts, result, and rollback reference. Do not retain private record contents as routine evidence.
