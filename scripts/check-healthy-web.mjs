import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createHealthyFixture } from "../src/web/fixture.js";
import { buildHealthyViewModel, getEquipmentImage, WEB_EQUIPMENT_IDS } from "../src/web/view-model.js";

const require = createRequire(import.meta.url);
const {
  HttpError,
  bindingCodeOwnerId,
  bindingDocumentId,
  createBindingCode,
  handleHttpRequest,
  normalizeRockyIdentitySession,
  sanitizeHealthyRecord,
  sha256
} = require("../healthy-pro-web-api/index.js");
const ROOT = new URL("../", import.meta.url).pathname;
const APP_OUTPUT = join(ROOT, "dist-cloudbase", "apps", "healthy");
const EXPECTED_EQUIPMENT_IDS = [
  "treadmill",
  "elliptical",
  "recumbent-bike",
  "rower",
  "chest-back-press",
  "high-row",
  "seated-row",
  "leg-press",
  "leg-extension-curl",
  "shoulder-press",
  "rear-delt",
  "assisted-pullup",
  "hack-squat",
  "smith-machine",
  "cable-station",
  "hip-thrust",
  "dumbbell-rack"
];

const requiredFiles = [
  "index.html",
  "sw.js",
  "src/web/app.js",
  "src/web/fixture.js",
  "src/web/healthy-api.js",
  "src/web/rocky-platform-client.js",
  "src/web/styles.css",
  "src/web/view-model.js",
  "healthy-pro-web-api/index.js",
  "healthy-pro-web-api/package.json",
  "healthy-pro-weapp/cloudfunctions/rockyBinding/index.js",
  "healthy-pro-weapp/cloudfunctions/rockyBinding/binding-core.js",
  "release/healthy-web-app-factory-manifest.json",
  "docs/healthy-lifemap-handoff.md",
  "public/manifest.webmanifest",
  "public/assets/web/smith-machine.jpg"
];
requiredFiles.forEach((file) => assert.ok(existsSync(join(ROOT, file)), `Missing ${file}`));

const indexSource = readFileSync(join(ROOT, "index.html"), "utf8");
const manifestSource = readFileSync(join(ROOT, "public/manifest.webmanifest"), "utf8");
const swSource = readFileSync(join(ROOT, "sw.js"), "utf8");
const apiSource = readFileSync(join(ROOT, "healthy-pro-web-api/index.js"), "utf8");
const appSource = readFileSync(join(ROOT, "src/web/app.js"), "utf8");
const handoffManifest = JSON.parse(readFileSync(join(ROOT, "release/healthy-web-app-factory-manifest.json"), "utf8"));

assert.match(indexSource, /https:\/\/rocky4ai\.com\/apps\/healthy\//);
assert.match(indexSource, /\/apps\/healthy\/src\/web\/app\.js/);
assert.match(manifestSource, /"scope": "\/apps\/healthy\/"/);
assert.match(swSource, /healthy-pro-web-/);
assert.match(swSource, /key\.startsWith\("healthy-pro-web-"\) && key !== CACHE_NAME/);
assert.doesNotMatch(swSource, /\.filter\(\(key\) => key !== CACHE_NAME\)/);
assert.match(apiSource, /ROCKY_IDENTITY_COOKIE/);
assert.match(apiSource, /healthy:data:read/);
assert.match(apiSource, /HEALTHY_WEB_BINDING_READ_ENABLED/);
assert.match(apiSource, /UNTRUSTED_ORIGIN/);
assert.doesNotMatch(apiSource, /event\.(openid|rockyUserId)|body\.(openid|rockyUserId)/);
assert.doesNotMatch(appSource, /localStorage|sessionStorage|indexedDB/, "Healthy Web must not persist health payloads in browser storage");
assert.match(swSource, /requestUrl\.pathname\.startsWith\(`\$\{APP_SCOPE\}api\/`\)\) return;/, "Service worker must bypass Healthy API responses");
assert.match(appSource, /const LIFEMAP_PATH = "\/apps\/lifemap\/"/);
assert.doesNotMatch(appSource, /href="\/"/);
assert.equal(handoffManifest.appId, "healthy");
assert.equal(handoffManifest.canonicalPath, "/apps/healthy/");
assert.equal(handoffManifest.lifeMap.registryKey, "train");
assert.equal(handoffManifest.lifeMap.path, "/apps/healthy/");
assert.equal(handoffManifest.staticBuild.rootDeployAllowed, false);
assert.deepEqual(handoffManifest.identity.requiredScopes, ["session:read", "healthy:data:read"]);
assert.ok(handoffManifest.releaseGates.some((item) => /same-origin/i.test(item)));

const validIdentity = {
  ok: true,
  rockyUserId: "ru_aaaaaaaaaaaaaaaa",
  appId: "healthy",
  scopes: ["session:read", "healthy:data:read"],
  expiresAt: new Date(Date.now() + 60_000).toISOString()
};
assert.equal(normalizeRockyIdentitySession(validIdentity).rockyUserId, validIdentity.rockyUserId);
[
  { ...validIdentity, appId: "lifemap" },
  { ...validIdentity, scopes: ["session:read"] },
  { ...validIdentity, expiresAt: new Date(Date.now() - 1).toISOString() }
].forEach((identity) => {
  assert.throws(() => normalizeRockyIdentitySession(identity), (error) => error?.code === "IDENTITY_CONTRACT_INVALID");
});

const fixtureModel = buildHealthyViewModel(createHealthyFixture(), new Date("2026-08-12T12:00:00+08:00"));
assert.equal(fixtureModel.hasPlan, true);
assert.equal(fixtureModel.nextWorkout.id, "B");
assert.equal(fixtureModel.sessionsPerWeek, 3);
assert.equal(fixtureModel.totalSessions, 3);
assert.equal(fixtureModel.logs[0].title, "腿臀辅助");
assert.deepEqual([...WEB_EQUIPMENT_IDS].sort(), EXPECTED_EQUIPMENT_IDS.sort());
EXPECTED_EQUIPMENT_IDS.forEach((equipmentId) => {
  const image = getEquipmentImage(equipmentId);
  assert.ok(image, `Missing Web image mapping for ${equipmentId}`);
  assert.ok(existsSync(join(ROOT, image)), `Missing source image for ${equipmentId}: ${image}`);
});
assert.equal(getEquipmentImage("unknown-equipment"), "");

const fixture = createHealthyFixture();
const unsafeRecord = {
  appId: "wx9f1d623ecc4ce4ae",
  openid: "openid_secret_owner",
  updatedAt: fixture.source.syncedAt,
  friendCode: "HPSECRET",
  store: {
    user: { assessment: fixture.assessment, plan: fixture.plan, openid: "leak" },
    profile: { nickname: "A 用户", openid: "leak" },
    trainingExecution: fixture.trainingExecution,
    logs: fixture.logs,
    bodyLogs: fixture.bodyLogs,
    cloud: { openid: "leak" },
    social: { friendCode: "HPSECRET", leaderboard: [{ openid: "other" }] }
  }
};
const safeRecord = sanitizeHealthyRecord(unsafeRecord);
const serializedSafeRecord = JSON.stringify(safeRecord);
assert.doesNotMatch(serializedSafeRecord, /openid_secret_owner|HPSECRET|"openid"|"rockyUserId"/);
assert.equal(safeRecord.plan.id, "fixture-plan");

const responseA = await invokeBootstrap({ nickname: "A 用户", planId: "plan-a", owner: "ru_aaaaaaaaaaaaaaaa", openid: "openid_user_a_123" });
const responseB = await invokeBootstrap({ nickname: "B 用户", planId: "plan-b", owner: "ru_bbbbbbbbbbbbbbbb", openid: "openid_user_b_456" });
assert.equal(responseA.statusCode, 200);
assert.equal(responseB.statusCode, 200);
assert.equal(responseA.payload.data.profile.nickname, "A 用户");
assert.equal(responseB.payload.data.profile.nickname, "B 用户");
assert.equal(responseA.payload.data.plan.id, "plan-a");
assert.equal(responseB.payload.data.plan.id, "plan-b");
assert.notDeepEqual(responseA.payload.data, responseB.payload.data);

const unbound = await invoke({
  enabled: true,
  bindingReadEnabled: true,
  verifySession: async () => ({ rockyUserId: "ru_cccccccccccccccc" }),
  readBinding: async () => { throw new HttpError(428, "WECHAT_BINDING_REQUIRED"); },
  readHealthyStore: async () => { throw new Error("must not read store without binding"); }
});
assert.equal(unbound.statusCode, 428);
assert.equal(unbound.payload.code, "WECHAT_BINDING_REQUIRED");

let deniedStoreRead = false;
const scopeDenied = await invoke({
  enabled: true,
  bindingReadEnabled: true,
  verifySession: async () => { throw new HttpError(403, "APP_ACCESS_DENIED"); },
  readBinding: async () => { deniedStoreRead = true; throw new Error("must not read binding without grant"); },
  readHealthyStore: async () => { deniedStoreRead = true; throw new Error("must not read store without grant"); }
});
assert.equal(scopeDenied.statusCode, 403);
assert.equal(scopeDenied.payload.code, "APP_ACCESS_DENIED");
assert.equal(deniedStoreRead, false);

const disabled = await invoke({ enabled: false, bindingReadEnabled: false });
assert.equal(disabled.statusCode, 503);
assert.equal(disabled.payload.code, "HEALTHY_WEB_NOT_ENABLED");

let gatedRead = false;
const anonymousWhenBindingDisabled = await invoke({
  enabled: true,
  bindingReadEnabled: false,
  verifySession: async () => { throw new HttpError(401, "AUTH_REQUIRED"); },
  readBinding: async () => { gatedRead = true; },
  readHealthyStore: async () => { gatedRead = true; }
});
assert.equal(anonymousWhenBindingDisabled.statusCode, 401);
assert.equal(anonymousWhenBindingDisabled.payload.code, "AUTH_REQUIRED");
assert.equal(gatedRead, false);

const noHealthyGrantWhenBindingDisabled = await invoke({
  enabled: true,
  bindingReadEnabled: false,
  verifySession: async () => { throw new HttpError(403, "APP_ACCESS_DENIED"); },
  readBinding: async () => { gatedRead = true; },
  readHealthyStore: async () => { gatedRead = true; }
});
assert.equal(noHealthyGrantWhenBindingDisabled.statusCode, 403);
assert.equal(noHealthyGrantWhenBindingDisabled.payload.code, "APP_ACCESS_DENIED");
assert.equal(gatedRead, false);

const bindingReadDisabled = await invoke({
  enabled: true,
  bindingReadEnabled: false,
  verifySession: async () => ({ rockyUserId: "ru_eeeeeeeeeeeeeeee" }),
  readBinding: async () => { gatedRead = true; },
  readHealthyStore: async () => { gatedRead = true; }
});
assert.equal(bindingReadDisabled.statusCode, 403);
assert.equal(bindingReadDisabled.payload.code, "HEALTHY_BINDING_READ_DISABLED");
assert.equal(gatedRead, false);

let untrustedMutationCalled = false;
const untrustedMutation = await invoke({
  enabled: true,
  bindingReadEnabled: true,
  verifySession: async () => ({ rockyUserId: "ru_dddddddddddddddd" }),
  createBindingCode: async () => {
    untrustedMutationCalled = true;
    return { code: "ABCDEFG2", expiresAt: new Date(Date.now() + 300000).toISOString() };
  }
}, {
  method: "POST",
  url: "/apps/healthy/api/binding-code",
  headers: { origin: "https://attacker.example", "content-type": "application/json" }
});
assert.equal(untrustedMutation.statusCode, 403);
assert.equal(untrustedMutation.payload.code, "UNTRUSTED_ORIGIN");
assert.equal(untrustedMutationCalled, false);

const trustedMutation = await invoke({
  enabled: true,
  bindingReadEnabled: true,
  expectedOrigin: "https://rocky4ai.com",
  verifySession: async () => ({ rockyUserId: "ru_dddddddddddddddd" }),
  createBindingCode: async () => ({ code: "ABCDEFG2", expiresAt: new Date(Date.now() + 300000).toISOString() })
}, {
  method: "POST",
  url: "/apps/healthy/api/binding-code",
  headers: { origin: "https://rocky4ai.com", "content-type": "application/json; charset=utf-8" }
});
assert.equal(trustedMutation.statusCode, 201);
assert.equal(trustedMutation.payload.data.code, "ABCDEFG2");

let storedBindingCode = null;
const generatedCode = await createBindingCode({
  async runTransaction(callback) {
    return callback({
      collection(name) {
        return {
          doc(id) {
            return {
              async set(document) {
                storedBindingCode = storedBindingCode || {};
                storedBindingCode[name] = { id, document };
              }
            };
          }
        };
      }
    });
  }
}, "ru_eeeeeeeeeeeeeeee");
assert.match(generatedCode.code, /^[A-HJ-NP-Z2-9]{8}$/);
assert.equal(storedBindingCode.rocky_healthy_binding_codes.id, `rhbc_${sha256(generatedCode.code)}`);
assert.equal(storedBindingCode.rocky_healthy_binding_codes.document.codeHash, sha256(generatedCode.code));
assert.equal(storedBindingCode.rocky_healthy_binding_code_owners.id, bindingCodeOwnerId("ru_eeeeeeeeeeeeeeee"));
assert.equal(storedBindingCode.rocky_healthy_binding_code_owners.document.codeHash, sha256(generatedCode.code));
assert.doesNotMatch(JSON.stringify(storedBindingCode), new RegExp(generatedCode.code));
assert.equal(bindingDocumentId("ru_eeeeeeeeeeeeeeee"), `rhb_owner_${sha256("ru_eeeeeeeeeeeeeeee")}`);

const build = spawnSync(process.execPath, [join(ROOT, "scripts/build-static.mjs")], {
  cwd: ROOT,
  encoding: "utf8"
});
assert.equal(build.status, 0, build.stderr || build.stdout);
assert.ok(existsSync(join(APP_OUTPUT, "index.html")));
assert.ok(existsSync(join(APP_OUTPUT, "build-meta.json")));
const buildFiles = collectFiles(APP_OUTPUT);
const builtSource = buildFiles
  .filter((file) => /\.(?:html|js|css|webmanifest|json)$/.test(file))
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");
assert.doesNotMatch(builtSource, /supabase|SUPABASE_/i, "Official Healthy Web build must not contain Supabase code or config");
assert.doesNotMatch(builtSource, /__HEALTHY_PRO_BUILD_VERSION__/);
assert.ok(!existsSync(join(APP_OUTPUT, "src/cloud.js")));
assert.ok(!existsSync(join(APP_OUTPUT, "src/runtime-config.js")));
assert.ok(!existsSync(join(APP_OUTPUT, "docs/supabase-schema.sql")));
assert.ok(statSync(join(APP_OUTPUT, "public/assets/web/smith-machine.jpg")).size < 200 * 1024);
EXPECTED_EQUIPMENT_IDS.forEach((equipmentId) => {
  assert.ok(existsSync(join(APP_OUTPUT, getEquipmentImage(equipmentId))), `Missing built image for ${equipmentId}`);
});

console.log("Healthy Web checks passed: scoped build, fixture model, fail-closed API, A/B isolation, no Supabase payload.");

async function invokeBootstrap({ nickname, planId, owner, openid }) {
  return invoke({
    enabled: true,
    bindingReadEnabled: true,
    verifySession: async () => ({ rockyUserId: owner }),
    readBinding: async (requestedOwner) => {
      assert.equal(requestedOwner, owner);
      return { openid };
    },
    readHealthyStore: async (requestedOpenid) => {
      assert.equal(requestedOpenid, openid);
      const next = createHealthyFixture();
      next.profile.nickname = nickname;
      next.plan.id = planId;
      return {
        appId: "wx9f1d623ecc4ce4ae",
        openid,
        updatedAt: next.source.syncedAt,
        store: {
          user: { assessment: next.assessment, plan: next.plan },
          profile: next.profile,
          trainingExecution: next.trainingExecution,
          logs: next.logs,
          bodyLogs: next.bodyLogs
        }
      };
    }
  });
}

async function invoke(dependencies, request = {}) {
  const headers = {};
  let body = "";
  const req = {
    method: request.method || "GET",
    url: request.url || "/apps/healthy/api/bootstrap",
    headers: request.headers || {}
  };
  const res = {
    statusCode: 200,
    setHeader(key, value) { headers[String(key).toLowerCase()] = value; },
    end(value) { body = String(value || ""); }
  };
  await handleHttpRequest(req, res, dependencies);
  return { statusCode: res.statusCode, headers, payload: JSON.parse(body) };
}

function collectFiles(directory) {
  return readdirSync(directory).flatMap((child) => {
    const file = join(directory, child);
    return statSync(file).isDirectory() ? collectFiles(file) : [file];
  });
}
