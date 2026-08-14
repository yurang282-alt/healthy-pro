const cloud = require("wx-server-sdk");
const {
  CODE_PATTERN,
  HEALTHY_APP_ID,
  bindingCodeOwnerId,
  buildBindingMutation,
  codeDocumentId,
  normalizeCode,
  ownerBindingId,
  rockyGrantId,
  hasCurrentRockyAccess,
  wechatBindingId
} = require("./binding-core");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const COLLECTIONS = Object.freeze({
  codes: "rocky_healthy_binding_codes",
  codeOwners: "rocky_healthy_binding_code_owners",
  ownerBindings: "rocky_healthy_bindings",
  wechatBindings: "rocky_healthy_binding_openids",
  rockyAccounts: "rocky_identity_users",
  rockyAllowlist: "rocky_identity_allowlist",
  rockyGrants: "rocky_identity_app_grants"
});

function firstDocument(result) {
  if (!result) return null;
  if (Array.isArray(result.data)) return result.data[0] || null;
  return result.data || null;
}

async function readDocument(transaction, collection, id) {
  try {
    return firstDocument(await transaction.collection(collection).doc(id).get());
  } catch (error) {
    if (String(error && (error.errMsg || error.message) || "").includes("does not exist")) return null;
    throw error;
  }
}

function requireWechatContext() {
  const context = cloud.getWXContext();
  if (!context.OPENID || context.APPID !== HEALTHY_APP_ID) throw new Error("WECHAT_IDENTITY_INVALID");
  return { openid: context.OPENID, appid: context.APPID };
}

async function getStatus(openid) {
  const record = await readDocument(db, COLLECTIONS.wechatBindings, wechatBindingId(openid));
  const rockyUserId = String(record && record.rockyUserId || "");
  if (!rockyUserId) return { bound: false };
  const rockyAccount = await readDocument(db, COLLECTIONS.rockyAccounts, rockyUserId);
  const [rockyAllowlist, rockyGrant] = await Promise.all([
    rockyAccount && rockyAccount.allowlistId
      ? readDocument(db, COLLECTIONS.rockyAllowlist, rockyAccount.allowlistId)
      : null,
    readDocument(db, COLLECTIONS.rockyGrants, rockyGrantId(rockyUserId))
  ]);
  return {
    bound: Boolean(
      record
      && record.appId === "healthy"
      && record.openid === openid
      && record.status === "active"
      && hasCurrentRockyAccess(rockyAccount, rockyGrant, rockyAllowlist, rockyUserId)
    )
  };
}

async function consumeCode(code, identity) {
  const normalizedCode = normalizeCode(code);
  if (!CODE_PATTERN.test(normalizedCode)) throw new Error("BINDING_CODE_INVALID_OR_EXPIRED");
  const result = await db.runTransaction(async (transaction) => {
    const codeId = codeDocumentId(normalizedCode);
    const codeRecord = await readDocument(transaction, COLLECTIONS.codes, codeId);
    const rockyUserId = String(codeRecord && codeRecord.rockyUserId || "");
    const rockyAccount = rockyUserId
      ? await readDocument(transaction, COLLECTIONS.rockyAccounts, rockyUserId)
      : null;
    const codeOwner = rockyUserId
      ? await readDocument(transaction, COLLECTIONS.codeOwners, bindingCodeOwnerId(rockyUserId))
      : null;
    const rockyAllowlist = rockyAccount && rockyAccount.allowlistId
      ? await readDocument(transaction, COLLECTIONS.rockyAllowlist, rockyAccount.allowlistId)
      : null;
    const rockyGrant = rockyUserId
      ? await readDocument(transaction, COLLECTIONS.rockyGrants, rockyGrantId(rockyUserId))
      : null;
    const ownerBinding = rockyUserId
      ? await readDocument(transaction, COLLECTIONS.ownerBindings, ownerBindingId(rockyUserId))
      : null;
    const wechatBinding = await readDocument(
      transaction,
      COLLECTIONS.wechatBindings,
      wechatBindingId(identity.openid)
    );
    const mutation = buildBindingMutation({
      code: normalizedCode,
      codeRecord,
      codeOwner,
      rockyAccount,
      rockyAllowlist,
      rockyGrant,
      ownerBinding,
      wechatBinding,
      openid: identity.openid,
      appid: identity.appid
    });
    await transaction.collection(COLLECTIONS.ownerBindings).doc(mutation.ownerId).set({ data: mutation.ownerDocument });
    await transaction.collection(COLLECTIONS.wechatBindings).doc(mutation.wechatId).set({ data: mutation.wechatDocument });
    await transaction.collection(COLLECTIONS.codes).doc(codeId).set({ data: mutation.codeDocument });
    await transaction.collection(COLLECTIONS.codeOwners).doc(mutation.codeOwnerId).set({ data: mutation.codeOwnerDocument });
    return { bound: true };
  });
  return result && Object.prototype.hasOwnProperty.call(result, "result") ? result.result : result;
}

exports.main = async (event = {}) => {
  try {
    if (process.env.HEALTHY_ROCKY_BINDING_ENABLED !== "true") {
      return { ok: false, code: "FEATURE_DISABLED" };
    }
    const identity = requireWechatContext();
    const action = String(event.action || "");
    if (action === "status" && Object.keys(event).every((key) => key === "action" || key.startsWith("userInfo"))) {
      return { ok: true, data: await getStatus(identity.openid) };
    }
    if (action === "consume" && Object.keys(event).every((key) => ["action", "code"].includes(key) || key.startsWith("userInfo"))) {
      return { ok: true, data: await consumeCode(event.code, identity) };
    }
    return { ok: false, code: "INVALID_REQUEST" };
  } catch (error) {
    const code = [
      "BINDING_CODE_INVALID_OR_EXPIRED",
      "ROCKY_ACCOUNT_ALREADY_BOUND",
      "WECHAT_ACCOUNT_ALREADY_BOUND",
      "WECHAT_IDENTITY_INVALID",
      "ROCKY_ACCOUNT_UNAVAILABLE",
      "HEALTHY_ACCESS_REVOKED"
    ].includes(error && error.message) ? error.message : "BINDING_FAILED";
    return { ok: false, code };
  }
};
