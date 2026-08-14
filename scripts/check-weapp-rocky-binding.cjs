const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  buildBindingMutation,
  bindingCodeOwnerId,
  codeDocumentId,
  ownerBindingId,
  rockyGrantId,
  sha256,
  wechatBindingId
} = require("../healthy-pro-weapp/cloudfunctions/rockyBinding/binding-core");

const now = Date.parse("2026-08-12T12:00:00.000Z");
const code = "ABCD2345";
const rockyUserId = "ru_aaaaaaaaaaaaaaaa";
const openid = "openid_user_a_123";
const appid = "wx9f1d623ecc4ce4ae";
const codeRecord = {
  _id: `rhbc_${sha256(code)}`,
  appId: "healthy",
  rockyUserId,
  codeHash: sha256(code),
  status: "active",
  createdAt: new Date(now - 1000).toISOString(),
  expiresAt: new Date(now + 5 * 60 * 1000).toISOString(),
  consumedAt: null
};
const allowlistId = "ria_healthy_test_owner";
const rockyAccount = { rockyUserId, status: "active", allowlistId };
const rockyAllowlist = {
  rockyUserId,
  status: "active",
  approvedAppIds: ["lifemap", "healthy"],
  expiresAt: new Date(now + 60 * 60 * 1000).toISOString()
};
const rockyGrant = {
  rockyUserId,
  appId: "healthy",
  status: "active",
  allowlistId,
  scopes: ["session:read", "healthy:data:read"]
};
const codeOwner = {
  _id: bindingCodeOwnerId(rockyUserId),
  appId: "healthy",
  rockyUserId,
  codeHash: sha256(code),
  status: "active",
  expiresAt: new Date(now + 5 * 60 * 1000).toISOString(),
  consumedAt: null
};

const mutation = buildBindingMutation({
  code,
  codeRecord,
  codeOwner,
  rockyAccount,
  rockyAllowlist,
  rockyGrant,
  ownerBinding: null,
  wechatBinding: null,
  openid,
  appid,
  now
});
assert.equal(mutation.ownerId, ownerBindingId(rockyUserId));
assert.equal(mutation.wechatId, wechatBindingId(openid));
assert.equal(mutation.ownerDocument.openid, openid);
assert.equal(mutation.codeDocument.status, "consumed");
assert.equal(Object.prototype.hasOwnProperty.call(mutation.codeDocument, "_id"), false);
assert.equal(mutation.codeOwnerId, bindingCodeOwnerId(rockyUserId));
assert.equal(mutation.codeOwnerDocument.status, "consumed");
assert.equal(Object.prototype.hasOwnProperty.call(mutation.codeOwnerDocument, "_id"), false);
assert.equal(codeDocumentId(code), `rhbc_${sha256(code)}`);
assert.equal(rockyGrantId(rockyUserId), `rag_${sha256(`${rockyUserId}:healthy`)}`);

expectCode("BINDING_CODE_INVALID_OR_EXPIRED", { codeRecord: { ...codeRecord, status: "consumed", consumedAt: new Date(now).toISOString() } });
expectCode("BINDING_CODE_INVALID_OR_EXPIRED", { codeRecord: { ...codeRecord, expiresAt: new Date(now - 1).toISOString() } });
expectCode("BINDING_CODE_INVALID_OR_EXPIRED", { codeOwner: { ...codeOwner, codeHash: sha256("WXYZ6789") } });
expectCode("BINDING_CODE_INVALID_OR_EXPIRED", { codeOwner: { ...codeOwner, expiresAt: new Date(now - 1).toISOString() } });
expectCode("BINDING_CODE_INVALID_OR_EXPIRED", { codeRecord: { ...codeRecord, appId: "other" } });
expectCode("HEALTHY_ACCESS_REVOKED", { rockyGrant: null });
expectCode("HEALTHY_ACCESS_REVOKED", { rockyGrant: { ...rockyGrant, status: "revoked" } });
expectCode("HEALTHY_ACCESS_REVOKED", { rockyGrant: { ...rockyGrant, scopes: ["session:read"] } });
expectCode("HEALTHY_ACCESS_REVOKED", { rockyAllowlist: { ...rockyAllowlist, status: "revoked" } });
expectCode("HEALTHY_ACCESS_REVOKED", { rockyAllowlist: { ...rockyAllowlist, approvedAppIds: ["lifemap"] } });
expectCode("HEALTHY_ACCESS_REVOKED", { rockyAllowlist: { ...rockyAllowlist, expiresAt: new Date(now - 1).toISOString() } });
expectCode("HEALTHY_ACCESS_REVOKED", { rockyGrant: { ...rockyGrant, allowlistId: "ria_other" } });
expectCode("ROCKY_ACCOUNT_UNAVAILABLE", { rockyAccount: { ...rockyAccount, status: "blocked" } });
expectCode("ROCKY_ACCOUNT_UNAVAILABLE", { rockyAccount: { ...rockyAccount, rockyUserId: "ru_bbbbbbbbbbbbbbbb" } });
expectCode("ROCKY_ACCOUNT_ALREADY_BOUND", {
  ownerBinding: { appId: "healthy", rockyUserId, openid: "openid_other_456", status: "active" }
});
expectCode("WECHAT_ACCOUNT_ALREADY_BOUND", {
  wechatBinding: { appId: "healthy", rockyUserId: "ru_bbbbbbbbbbbbbbbb", openid, status: "active" }
});
expectCode("WECHAT_IDENTITY_INVALID", { appid: "wx_wrong_app" });

const functionSource = fs.readFileSync(path.join(__dirname, "../healthy-pro-weapp/cloudfunctions/rockyBinding/index.js"), "utf8");
const consumeSource = functionSource.slice(
  functionSource.indexOf("async function consumeCode"),
  functionSource.indexOf("exports.main")
);
assert.match(functionSource, /cloud\.getWXContext\(\)/);
assert.doesNotMatch(functionSource, /event\.(?:openid|rockyUserId|ownerId)/);
assert.match(functionSource, /HEALTHY_ROCKY_BINDING_ENABLED/);
assert.match(functionSource, /rocky_identity_allowlist/);
assert.match(functionSource, /runTransaction/);
assert.equal((consumeSource.match(/\.set\(\{ data:/g) || []).length, 4);
assert.doesNotMatch(consumeSource, /Promise\.all/, "transaction reads must remain serialized");
assert.doesNotMatch(
  functionSource,
  /Object\.keys\(event\)\.every/,
  "platform-injected event metadata must not invalidate otherwise valid actions"
);

const originalModuleLoad = require("node:module")._load;
require("node:module")._load = function loadWithMock(request, parent, isMain) {
  if (request !== "wx-server-sdk") return originalModuleLoad(request, parent, isMain);
  const emptyDocument = { get: async () => ({ data: null }) };
  return {
    DYNAMIC_CURRENT_ENV: Symbol("dynamic-current-env"),
    init() {},
    getWXContext() {
      return { OPENID: openid, APPID: appid };
    },
    database() {
      return {
        collection() {
          return { doc() { return emptyDocument; } };
        }
      };
    }
  };
};

const rockyBindingFunction = require("../healthy-pro-weapp/cloudfunctions/rockyBinding/index");
process.env.HEALTHY_ROCKY_BINDING_ENABLED = "true";

Promise.resolve()
  .then(() => rockyBindingFunction.main({
    action: "status",
    userInfo: { appId: appid },
    wxCloudContext: { source: "ide-runtime" }
  }))
  .then((result) => {
    assert.deepEqual(result, { ok: true, data: { bound: false } });
    console.log("Healthy Rocky binding checks passed: one-time code, live allowlist/grant, replay, two-way ownership conflicts, and platform metadata tolerance.");
  })
  .finally(() => {
    require("node:module")._load = originalModuleLoad;
    delete process.env.HEALTHY_ROCKY_BINDING_ENABLED;
  });

function expectCode(expected, overrides) {
  assert.throws(() => buildBindingMutation({
    code,
    codeRecord,
    codeOwner,
    rockyAccount,
    rockyAllowlist,
    rockyGrant,
    ownerBinding: null,
    wechatBinding: null,
    openid,
    appid,
    now,
    ...overrides
  }), (error) => error && error.message === expected);
}
