const crypto = require("node:crypto");

const HEALTHY_APP_ID = "wx9f1d623ecc4ce4ae";
const ROCKY_APP_ID = "healthy";
const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/;
const ROCKY_USER_ID_PATTERN = /^ru_[a-z0-9]{16,64}$/;
const OPENID_PATTERN = /^[A-Za-z0-9_-]{10,128}$/;

function sha256(value) {
  return crypto.createHash("sha256").update(String(value), "utf8").digest("hex");
}

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}

function ownerBindingId(rockyUserId) {
  return `rhb_owner_${sha256(rockyUserId)}`;
}

function wechatBindingId(openid) {
  return `rhb_wechat_${sha256(openid)}`;
}

function codeDocumentId(code) {
  return `rhbc_${sha256(normalizeCode(code))}`;
}

function bindingCodeOwnerId(rockyUserId) {
  return `rhbc_owner_${sha256(rockyUserId)}`;
}

function withoutDocumentId(record) {
  if (!record || typeof record !== "object") return {};
  const { _id: _documentId, ...data } = record;
  return data;
}

function rockyGrantId(rockyUserId) {
  return `rag_${sha256(`${rockyUserId}:${ROCKY_APP_ID}`)}`;
}

function buildBindingMutation({
  code,
  codeRecord,
  codeOwner,
  rockyAccount,
  rockyAllowlist,
  rockyGrant,
  ownerBinding,
  wechatBinding,
  openid,
  appid,
  now = Date.now()
}) {
  const normalizedCode = normalizeCode(code);
  const expiresAt = Date.parse(String(codeRecord && codeRecord.expiresAt || ""));
  const rockyUserId = String(codeRecord && codeRecord.rockyUserId || "");
  if (!CODE_PATTERN.test(normalizedCode)) throw bindingError();
  if (
    !codeRecord
    || codeRecord.appId !== ROCKY_APP_ID
    || codeRecord.codeHash !== sha256(normalizedCode)
    || codeRecord.status !== "active"
    || codeRecord.consumedAt
    || !Number.isFinite(expiresAt)
    || expiresAt <= now
    || !ROCKY_USER_ID_PATTERN.test(rockyUserId)
  ) {
    throw bindingError();
  }
  if (
    !codeOwner
    || codeOwner.appId !== ROCKY_APP_ID
    || codeOwner.rockyUserId !== rockyUserId
    || codeOwner.codeHash !== sha256(normalizedCode)
    || codeOwner.status !== "active"
    || codeOwner.consumedAt
    || Date.parse(String(codeOwner.expiresAt || "")) <= now
  ) {
    throw bindingError();
  }
  if (appid !== HEALTHY_APP_ID || !OPENID_PATTERN.test(String(openid || ""))) {
    throw new Error("WECHAT_IDENTITY_INVALID");
  }
  if (!rockyAccount || rockyAccount.rockyUserId !== rockyUserId || rockyAccount.status !== "active") {
    throw new Error("ROCKY_ACCOUNT_UNAVAILABLE");
  }
  if (!hasCurrentRockyAccess(rockyAccount, rockyGrant, rockyAllowlist, rockyUserId, now)) {
    throw new Error("HEALTHY_ACCESS_REVOKED");
  }
  if (ownerBinding && !sameBinding(ownerBinding, rockyUserId, openid)) {
    throw new Error("ROCKY_ACCOUNT_ALREADY_BOUND");
  }
  if (wechatBinding && !sameBinding(wechatBinding, rockyUserId, openid)) {
    throw new Error("WECHAT_ACCOUNT_ALREADY_BOUND");
  }

  const timestamp = new Date(now).toISOString();
  const binding = {
    appId: ROCKY_APP_ID,
    rockyUserId,
    openid,
    status: "active",
    createdAt: ownerBinding && ownerBinding.createdAt || wechatBinding && wechatBinding.createdAt || timestamp,
    updatedAt: timestamp
  };
  return {
    ownerId: ownerBindingId(rockyUserId),
    ownerDocument: binding,
    wechatId: wechatBindingId(openid),
    wechatDocument: binding,
    codeDocument: {
      ...withoutDocumentId(codeRecord),
      status: "consumed",
      consumedAt: timestamp,
      updatedAt: timestamp
    },
    codeOwnerId: bindingCodeOwnerId(rockyUserId),
    codeOwnerDocument: {
      ...withoutDocumentId(codeOwner),
      status: "consumed",
      consumedAt: timestamp,
      updatedAt: timestamp
    }
  };
}

function hasCurrentRockyAccess(rockyAccount, rockyGrant, rockyAllowlist, rockyUserId, now = Date.now()) {
  const grantScopes = Array.isArray(rockyGrant && rockyGrant.scopes) ? rockyGrant.scopes : [];
  const approvedAppIds = Array.isArray(rockyAllowlist && rockyAllowlist.approvedAppIds)
    ? rockyAllowlist.approvedAppIds
    : [];
  const allowlistExpiresAt = rockyAllowlist && rockyAllowlist.expiresAt
    ? Date.parse(String(rockyAllowlist.expiresAt))
    : null;
  return Boolean(
    rockyAccount
    && rockyAccount.rockyUserId === rockyUserId
    && rockyAccount.status === "active"
    && rockyAccount.allowlistId
    && rockyAllowlist
    && rockyAllowlist.rockyUserId === rockyUserId
    && rockyAllowlist.status === "active"
    && approvedAppIds.includes(ROCKY_APP_ID)
    && (allowlistExpiresAt === null || (Number.isFinite(allowlistExpiresAt) && allowlistExpiresAt > now))
    && rockyGrant
    && rockyGrant.rockyUserId === rockyUserId
    && rockyGrant.appId === ROCKY_APP_ID
    && rockyGrant.status === "active"
    && rockyGrant.allowlistId === rockyAccount.allowlistId
    && grantScopes.includes("session:read")
    && grantScopes.includes("healthy:data:read")
  );
}

function sameBinding(record, rockyUserId, openid) {
  return record.appId === ROCKY_APP_ID
    && record.status === "active"
    && record.rockyUserId === rockyUserId
    && record.openid === openid;
}

function bindingError() {
  return new Error("BINDING_CODE_INVALID_OR_EXPIRED");
}

module.exports = {
  CODE_PATTERN,
  HEALTHY_APP_ID,
  ROCKY_APP_ID,
  bindingCodeOwnerId,
  buildBindingMutation,
  codeDocumentId,
  normalizeCode,
  ownerBindingId,
  rockyGrantId,
  hasCurrentRockyAccess,
  sha256,
  wechatBindingId
};
