# Healthy Web -> LifeMap Handoff

## Exact Product Mapping

- LifeMap registry key: `train`.
- Existing LifeMap label: `身体训练`.
- Candidate path: `/apps/healthy/`.
- Candidate canonical URL: `https://rocky4ai.com/apps/healthy/`.
- Return path from Healthy: `/apps/lifemap/`.
- Do not change the separate `healthy` / `健康体检站` registry item as part of this release.

The project-local machine-readable source is `release/healthy-web-app-factory-manifest.json`.

## App-factory Patch

After the static package and BFF pass the canary gates, the central LifeMap owner can replace only the current pending entry:

```js
train: liveWebApp("身体训练", "/apps/healthy/"),
```

Do not edit CloudBase root `/`, DNS, certificates or unrelated LifeMap entries from this repository.

## Central Identity Patch

The Rocky identity owner must register this exact app scope set before enabling Healthy Web:

```js
healthy: Object.freeze([
  "session:read",
  "healthy:data:read",
]),
```

The grant must initially be limited to controlled test users A/B. A shared Rocky domain or session does not create a health-data grant automatically.

## CloudBase Package

1. Build locally with `npm run build`; use only `dist-cloudbase/apps/healthy/` as the static source.
2. Route `/apps/healthy/api/*` to the `healthy-pro-web-api` source.
3. Create the four binding collections documented in `docs/healthy-web-companion.md` with server/admin-only permissions.
4. Deploy the Mini Program `rockyBinding` source with its feature flag off.
5. Keep all three flags off until central identity, collection permissions and controlled negative tests pass.
6. Never publish the static source to `/`; root ownership stays with `app-factory`.

Supabase and Vercel are frozen historical resources. They are not deployment, preview, synchronization or rollback targets for this package.

## Activation Order

1. Register central scopes and controlled grants.
2. Create locked binding collections.
3. Deploy BFF and binding function with flags off.
4. Enable binding for A/B, then run expiry, replay, replacement, revocation and ownership-conflict tests.
5. Enable read-only bootstrap for A/B and confirm A can never read B.
6. Publish the static package to exactly `/apps/healthy/` and verify the exact URL.
7. Activate the LifeMap `train` registry entry.
8. Record deployed hashes, function versions, route and rollback point in the central deployment registry and `PROJECT_CONTEXT.md`.

## High-sensitivity Browser Gate

`/apps/healthy/` is same-origin with sibling Rocky apps. URL paths do not isolate JavaScript privileges. Before access expands beyond controlled A/B testing, either:

- the full `rocky4ai.com` origin, shared shell and sibling apps pass a release-grade XSS/content-injection audit and CTO accepts the residual risk; or
- Healthy moves to an independent origin with an app-specific session boundary.

This is a Web activation gate only. It does not block the existing Mini Program.

## Acceptance Evidence

- `npm run check` and `npm run build` pass.
- Built assets contain no Supabase code or configuration.
- Anonymous, unauthorized, unbound and service-error states expose no health payload.
- A/B plan and history data stay isolated.
- API responses use `no-store`; service worker ignores `/apps/healthy/api/`.
- Desktop and 320 px mobile layouts have no horizontal overflow or broken equipment images.
- Healthy's visible LifeMap return link resolves to `/apps/lifemap/`.
- The LifeMap `train` entry resolves to `/apps/healthy/`; the `healthy` entry remains unchanged.

## Rollback

Disable the three Healthy flags, restore the previous `train` pending entry, and roll back only the Healthy BFF/function/static revisions. Do not delete bindings, rewrite Mini Program data, alter root `/`, or revive Supabase as a fallback.
