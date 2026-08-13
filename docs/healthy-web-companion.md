# Healthy Web Companion

## Purpose

Healthy Web gives LifeMap users a calm place to review the training plan, weekly rhythm and history. The WeChat Mini Program remains the place for assessment, plan editing and gym-floor execution.

## Fixed Boundary

- Production URL: `https://rocky4ai.com/apps/healthy/`.
- Static source: `src/web/`; build output: `dist-cloudbase/apps/healthy/`.
- API prefix: `/apps/healthy/api/` on the same origin.
- Active data source: Mini Program CloudBase `users/user_<openid>` store.
- Browser identity: Rocky session cookie, verified server-side.
- Web capability: read only.
- Root `/`, DNS, certificates and LifeMap navigation remain owned by CTO / `app-factory`.
- Supabase and Vercel remain frozen history and are not fallback paths.
- LifeMap registry handoff: update `train` (`身体训练`) to `/apps/healthy/`; do not replace the separate `healthy` (`健康体检站`) entry.

## Security Flow

1. Browser requests Rocky session for `appId=healthy` and must have `session:read` plus `healthy:data:read`.
2. BFF independently verifies the same Rocky session from the secure cookie.
3. BFF resolves exactly one active `rockyUserId -> openid` binding from `rocky_healthy_bindings`.
4. BFF reads only `users/user_<openid>` and verifies the record's AppID and owner OpenID.
5. BFF removes ownership, social and internal cloud fields before returning a no-store response.

The browser cannot submit or override OpenID, Rocky user ID or owner. Missing, duplicate, expired or conflicting bindings fail closed.

### One-time binding

1. A logged-in Rocky user asks the same-origin BFF for an eight-character code. The POST requires exact `https://rocky4ai.com` origin and the current `healthy:data:read` session scope.
2. The BFF stores only the SHA-256 code hash plus a per-owner current-code pointer. Generating a replacement code invalidates the older code immediately; no raw code is stored.
3. In the Mini Program, `rockyBinding` derives AppID and OpenID only from `cloud.getWXContext()` and consumes the code in one database transaction.
4. The transaction rechecks the Rocky account, current allowlist and Healthy grant, enforces one active binding in both directions, writes both deterministic indexes, and consumes both the code and owner pointer.
5. Expiry, replay, a replaced code, account/allowlist/grant revocation, wrong WeChat AppID, or either ownership conflict returns no identity or health data.

Binding collections are `rocky_healthy_binding_codes`, `rocky_healthy_binding_code_owners`, `rocky_healthy_bindings`, and `rocky_healthy_binding_openids`. They must be inaccessible to ordinary database clients; only the two server runtimes may use them.

## Product States

- Loading: neutral skeleton; no stale data.
- Unauthenticated: Rocky login action.
- Access pending: Healthy grant is missing.
- Unbound: Rocky account is not safely linked to a WeChat archive.
- Empty: linked account has no training plan yet.
- Unavailable: identity or data service failed; no legacy fallback.
- Ready: overview, plan, history and data/privacy views.

Local fixture data is available only on `localhost` or `127.0.0.1` with `?fixture=1`. The unbound flow is available with `?fixture=unbound`; its preview code never writes to CloudBase.

## Activation Sequence

1. Identity owner registers `healthy` and scopes `session:read`, `healthy:data:read`; add `healthy` only to test users A/B allowlists and grants first.
2. Create all four binding collections with server/admin-only permissions. Do not seed real OpenIDs or copy existing Healthy data.
3. Deploy `rockyBinding` with `HEALTHY_ROCKY_BINDING_ENABLED=false`, and deploy the BFF with `HEALTHY_WEB_ENABLED=false` plus `HEALTHY_WEB_BINDING_READ_ENABLED=false`.
4. Enable binding only for the controlled test window. Run A/B positive tests plus wrong-user, replaced-code, expired-code, replay, revoked-allowlist, revoked-grant, missing-binding and both duplicate-binding negative tests. Confirm no raw OpenID, Cookie, raw binding code or health payload appears in logs.
5. Enable BFF read access for the same cohort, verify `/apps/healthy/api/health` and `/bootstrap`, then deploy the static package only to `/apps/healthy/`.
6. Ask `app-factory` to add the same-origin `/apps/healthy/` tile to LifeMap only after exact URL QA passes.
7. Update the central CloudBase registry and this `PROJECT_CONTEXT.md` with function versions, route, hashes and rollback point.

### Same-origin high-sensitivity gate

The `/apps/healthy/` path is a routing boundary, not a browser security boundary. A compromised sibling app on `rocky4ai.com` could run with the same origin and attempt requests using the current Rocky session. Server-side app scopes and owner binding remain mandatory, but they do not prove which same-origin UI initiated a request.

Production activation is therefore limited to a controlled A/B canary until one of these gates is satisfied:

1. every same-origin app and shared shell is included in a release-grade XSS/content-injection audit and CTO explicitly accepts the residual risk; or
2. Healthy moves to an independent origin with an app-specific session boundary.

This gate does not block the Mini Program and does not justify a Supabase fallback.

## Release Checks

- `npm run check` and `npm run build` pass.
- Built output contains no Supabase strings, runtime config or legacy PWA source.
- Desktop and mobile have no horizontal overflow, broken images or console errors.
- A sees only A data; B sees only B data; anonymous and unbound users see no health data.
- API responses are `no-store`; service worker excludes API requests.
- Mini Program behavior and data remain unchanged.

### Local evidence (2026-08-12)

- `npm run check`, `npm run build`, JavaScript syntax checks and `git diff --check` pass.
- At 320 px, overview, plan, history, data and generated binding-code states have no horizontal overflow; all visible controls meet the 44 px target and equipment images load.
- Product Design Director acceptance: pass, 4.7/5, no design blocker.
- Remaining integration evidence cannot be produced by a local fixture: a real controlled account must complete Rocky login -> code creation -> Mini Program consumption -> Web re-read after the server runtimes are deployed with scoped flags.

## Rollback

Disable `HEALTHY_WEB_ENABLED`, `HEALTHY_WEB_BINDING_READ_ENABLED`, and `HEALTHY_ROCKY_BINDING_ENABLED`; then remove the LifeMap tile and roll back only the Healthy route/functions/static package. Existing bindings can remain inert for diagnosis; do not delete or rewrite Mini Program data, root `/`, DNS, certificates, Supabase or other Apps.

No CloudBase command or production mutation is part of the local implementation phase.
