const crypto = require("node:crypto");
const https = require("node:https");
const { Readable } = require("node:stream");
const { URL, URLSearchParams } = require("node:url");

const ROCKY_IDENTITY_APP_ID = "healthy";
const ROCKY_IDENTITY_COOKIE = "__Host-rocky_session";
const ROCKY_IDENTITY_SESSION_URL = "https://rocky4ai.com/account/api/identity/session?appId=healthy";
const ROCKY_REQUIRED_SCOPE = "healthy:data:read";
const ROCKY_CANONICAL_ORIGIN = "https://rocky4ai.com";
const ROCKY_USER_ID_PATTERN = /^ru_[a-z0-9]{16,64}$/;
const OPENID_PATTERN = /^[A-Za-z0-9_-]{10,128}$/;
const HEALTHY_APP_ID = "wx9f1d623ecc4ce4ae";
const APP_PATH_PREFIX = "/apps/healthy/api";
const COLLECTIONS = Object.freeze({
  bindingCodes: "rocky_healthy_binding_codes",
  bindingCodeOwners: "rocky_healthy_binding_code_owners",
  bindings: "rocky_healthy_bindings",
  users: "users"
});
const BINDING_CODE_TTL_MS = 5 * 60 * 1000;
const BINDING_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/;
const OMITTED_KEYS = new Set([
  "_id",
  "_openid",
  "openid",
  "rockyUserId",
  "ownerId",
  "friendCode",
  "friendships",
  "leaderboard",
  "social",
  "cloud",
  "feedbacks",
  "releaseReads"
]);

class HttpError extends Error {
  constructor(statusCode, code, message = code) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

let cloudSdk = null;
let cloudInitialized = false;

function getCloud() {
  if (cloudSdk !== null) return cloudSdk;
  try {
    cloudSdk = require("wx-server-sdk");
  } catch {
    cloudSdk = false;
  }
  return cloudSdk;
}

function getDb() {
  const cloud = getCloud();
  if (!cloud) throw new HttpError(503, "CLOUD_DATABASE_UNAVAILABLE");
  if (!cloudInitialized) {
    cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
    cloudInitialized = true;
  }
  return cloud.database();
}

function isEnabled(name) {
  return String(process.env[name] || "").toLowerCase() === "true";
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value), "utf8").digest("hex");
}

function createReadableCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(8);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function bindingDocumentId(rockyUserId) {
  return `rhb_owner_${sha256(rockyUserId)}`;
}

function bindingCodeOwnerId(rockyUserId) {
  return `rhbc_owner_${sha256(rockyUserId)}`;
}

function readCookie(cookieHeader, name) {
  for (const part of String(cookieHeader || "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    if (part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return "";
}

function normalizeRockyIdentitySession(payload) {
  const rockyUserId = String(payload?.rockyUserId || "");
  const appId = String(payload?.appId || "");
  const scopes = Array.isArray(payload?.scopes) ? payload.scopes.map(String) : [];
  const expiresAt = Date.parse(String(payload?.expiresAt || ""));
  if (
    payload?.ok !== true
    || !ROCKY_USER_ID_PATTERN.test(rockyUserId)
    || appId !== ROCKY_IDENTITY_APP_ID
    || !scopes.includes("session:read")
    || !scopes.includes(ROCKY_REQUIRED_SCOPE)
    || !Number.isFinite(expiresAt)
    || expiresAt <= Date.now()
  ) {
    throw new HttpError(502, "IDENTITY_CONTRACT_INVALID");
  }
  return { rockyUserId, appId, scopes, expiresAt: new Date(expiresAt).toISOString() };
}

async function verifyRockyIdentitySession(req) {
  const cookieValue = readCookie(req.headers.cookie, ROCKY_IDENTITY_COOKIE);
  if (!cookieValue) throw new HttpError(401, "AUTH_REQUIRED");

  const url = new URL(ROCKY_IDENTITY_SESSION_URL);
  const response = await requestJson({
    hostname: url.hostname,
    path: `${url.pathname}${url.search}`,
    headers: {
      accept: "application/json",
      cookie: `${ROCKY_IDENTITY_COOKIE}=${cookieValue}`
    }
  });
  if (response.statusCode === 401) throw new HttpError(401, "AUTH_REQUIRED");
  if (response.statusCode === 403) throw new HttpError(403, "APP_ACCESS_DENIED");
  if (response.statusCode !== 200) throw new HttpError(502, "IDENTITY_UNAVAILABLE");
  return normalizeRockyIdentitySession({
    ok: response.payload?.ok === true,
    rockyUserId: response.headers["x-rocky-user-id"],
    appId: response.headers["x-rocky-app-id"],
    scopes: String(response.headers["x-rocky-scopes"] || "").split(",").map((scope) => scope.trim()).filter(Boolean),
    expiresAt: response.headers["x-rocky-expires-at"]
  });
}

function requestJson(options) {
  return new Promise((resolve, reject) => {
    const request = https.request({ method: "GET", timeout: 5000, ...options }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      response.on("end", () => {
        let payload = {};
        try {
          payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
          payload = {};
        }
        resolve({ statusCode: response.statusCode, headers: response.headers, payload });
      });
    });
    request.on("timeout", () => request.destroy(new Error("identity timeout")));
    request.on("error", reject);
    request.end();
  }).catch(() => {
    throw new HttpError(502, "IDENTITY_UNAVAILABLE");
  });
}

async function readBinding(db, rockyUserId) {
  let result;
  try {
    result = await db.collection(COLLECTIONS.bindings).doc(bindingDocumentId(rockyUserId)).get();
  } catch (error) {
    if (String(error?.errMsg || error?.message || "").includes("does not exist")) {
      throw new HttpError(428, "WECHAT_BINDING_REQUIRED");
    }
    throw error;
  }
  const binding = firstDocument(result);
  if (!binding) throw new HttpError(428, "WECHAT_BINDING_REQUIRED");
  if (
    binding.rockyUserId !== rockyUserId
    || binding.appId !== ROCKY_IDENTITY_APP_ID
    || binding.status !== "active"
    || !OPENID_PATTERN.test(String(binding.openid || ""))
  ) {
    throw new HttpError(409, "WECHAT_BINDING_CONFLICT");
  }
  return { openid: String(binding.openid) };
}

async function createBindingCode(db, rockyUserId) {
  const now = Date.now();
  const expiresAt = new Date(now + BINDING_CODE_TTL_MS).toISOString();
  const code = createReadableCode();
  const codeHash = sha256(code);
  const documentId = `rhbc_${codeHash}`;
  const codeDocument = {
    appId: ROCKY_IDENTITY_APP_ID,
    rockyUserId,
    codeHash,
    status: "active",
    createdAt: new Date(now).toISOString(),
    expiresAt,
    consumedAt: null
  };
  const ownerDocument = {
    appId: ROCKY_IDENTITY_APP_ID,
    rockyUserId,
    codeHash,
    status: "active",
    createdAt: new Date(now).toISOString(),
    expiresAt,
    consumedAt: null
  };
  await db.runTransaction(async (transaction) => {
    await transaction.collection(COLLECTIONS.bindingCodes).doc(documentId).set(codeDocument);
    await transaction.collection(COLLECTIONS.bindingCodeOwners).doc(bindingCodeOwnerId(rockyUserId)).set(ownerDocument);
  });
  return { code, expiresAt };
}

async function readHealthyStore(db, openid) {
  let result;
  try {
    result = await db.collection(COLLECTIONS.users).doc(`user_${openid}`).get();
  } catch (error) {
    if (String(error?.errMsg || error?.message || "").includes("does not exist")) {
      throw new HttpError(404, "HEALTHY_PROFILE_NOT_FOUND");
    }
    throw error;
  }
  const record = firstDocument(result);
  if (!record || record.appId !== HEALTHY_APP_ID || record.openid !== openid || !record.store) {
    throw new HttpError(404, "HEALTHY_PROFILE_NOT_FOUND");
  }
  return record;
}

function firstDocument(result) {
  const data = result?.data;
  if (Array.isArray(data)) return data[0] || null;
  return data || null;
}

function sanitizeHealthyRecord(record) {
  const store = record?.store || {};
  const user = store.user || {};
  const profile = store.profile || {};
  const logs = Array.isArray(store.logs) ? store.logs.slice(-100) : [];
  const bodyLogs = Array.isArray(store.bodyLogs) ? store.bodyLogs.slice(-100) : [];
  return {
    schemaVersion: 1,
    source: {
      kind: "healthy-weapp-cloudbase",
      syncedAt: String(record?.updatedAt || profile.lastSyncedAt || "")
    },
    profile: { nickname: cleanText(profile.nickname, 40) || "微信用户" },
    assessment: sanitizeValue(user.assessment || null),
    plan: sanitizeValue(user.plan || null),
    trainingExecution: sanitizeValue(store.trainingExecution || null),
    logs: sanitizeValue(logs),
    bodyLogs: sanitizeValue(bodyLogs)
  };
}

function sanitizeValue(value, depth = 0) {
  if (depth > 12) return null;
  if (value === null || value === undefined) return value ?? null;
  if (["string", "number", "boolean"].includes(typeof value)) {
    return typeof value === "string" ? value.slice(0, 2000) : value;
  }
  if (Array.isArray(value)) return value.slice(0, 500).map((item) => sanitizeValue(item, depth + 1));
  if (typeof value !== "object") return null;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !OMITTED_KEYS.has(key))
    .map(([key, item]) => [key, sanitizeValue(item, depth + 1)]));
}

function cleanText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("content-security-policy", "default-src 'none'; frame-ancestors 'none'");
  res.setHeader("permissions-policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("x-frame-options", "DENY");
  res.setHeader("referrer-policy", "no-referrer");
  res.end(JSON.stringify(payload));
}

function normalizePath(urlValue) {
  const parsed = new URL(String(urlValue || "/"), "https://rocky4ai.com");
  const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
  return pathname.startsWith(APP_PATH_PREFIX) ? pathname.slice(APP_PATH_PREFIX.length) || "/" : pathname;
}

function requireSameOriginMutation(req, expectedOrigin = ROCKY_CANONICAL_ORIGIN) {
  const headers = normalizeHeaders(req.headers);
  if (headers.origin !== expectedOrigin) throw new HttpError(403, "UNTRUSTED_ORIGIN");
  if (!String(headers["content-type"] || "").toLowerCase().startsWith("application/json")) {
    throw new HttpError(415, "JSON_REQUIRED");
  }
}

async function handleHttpRequest(req, res, dependencies = {}) {
  try {
    const path = normalizePath(req.url);
    if (req.method === "GET" && path === "/health") {
      sendJson(res, 200, {
        ok: true,
        enabled: dependencies.enabled ?? isEnabled("HEALTHY_WEB_ENABLED"),
        bindingReadEnabled: dependencies.bindingReadEnabled ?? isEnabled("HEALTHY_WEB_BINDING_READ_ENABLED")
      });
      return;
    }
    if (!((req.method === "GET" && path === "/bootstrap") || (req.method === "POST" && path === "/binding-code"))) {
      throw new HttpError(404, "NOT_FOUND");
    }
    if (req.method === "POST") {
      requireSameOriginMutation(req, dependencies.expectedOrigin || ROCKY_CANONICAL_ORIGIN);
    }

    const enabled = dependencies.enabled ?? isEnabled("HEALTHY_WEB_ENABLED");
    const bindingReadEnabled = dependencies.bindingReadEnabled ?? isEnabled("HEALTHY_WEB_BINDING_READ_ENABLED");
    if (!enabled) throw new HttpError(503, "HEALTHY_WEB_NOT_ENABLED");

    const verifySession = dependencies.verifySession || verifyRockyIdentitySession;
    // Bootstrap is a read path. Authenticate and authorize before considering
    // the binding feature gate, so anonymous and non-granted callers fail with
    // their real identity status and cannot infer or touch binding/health data.
    const session = await verifySession(req);
    if (!bindingReadEnabled) throw new HttpError(403, "HEALTHY_BINDING_READ_DISABLED");
    const needsDatabase = path === "/binding-code"
      ? !dependencies.createBindingCode
      : !dependencies.readBinding || !dependencies.readHealthyStore;
    const db = dependencies.db || (needsDatabase ? getDb() : null);
    if (path === "/binding-code") {
      const bindingCode = dependencies.createBindingCode
        ? await dependencies.createBindingCode(session.rockyUserId)
        : await createBindingCode(db, session.rockyUserId);
      if (!BINDING_CODE_PATTERN.test(String(bindingCode?.code || ""))) {
        throw new HttpError(500, "BINDING_CODE_GENERATION_FAILED");
      }
      sendJson(res, 201, { ok: true, data: bindingCode });
      return;
    }
    const binding = dependencies.readBinding
      ? await dependencies.readBinding(session.rockyUserId)
      : await readBinding(db, session.rockyUserId);
    const record = dependencies.readHealthyStore
      ? await dependencies.readHealthyStore(binding.openid)
      : await readHealthyStore(db, binding.openid);
    sendJson(res, 200, { ok: true, data: sanitizeHealthyRecord(record) });
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;
    const code = error instanceof HttpError ? error.code : "INTERNAL_ERROR";
    sendJson(res, statusCode, { ok: false, code });
  }
}

function normalizeHeaders(headers = {}) {
  return Object.fromEntries(Object.entries(headers || {}).map(([key, value]) => [String(key).toLowerCase(), value]));
}

function queryStringFromEvent(event = {}) {
  if (event.rawQueryString) return String(event.rawQueryString);
  if (event.queryStringParameters && typeof event.queryStringParameters === "object") {
    const params = new URLSearchParams();
    Object.entries(event.queryStringParameters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.append(key, String(value));
    });
    return params.toString();
  }
  return "";
}

function requestFromEvent(event = {}) {
  const headers = normalizeHeaders(event.headers || event.headerParameters);
  const method = event.httpMethod || event.requestContext?.httpMethod || event.method || "GET";
  const rawPath = event.path || event.Path || event.requestContext?.path || "/";
  const query = queryStringFromEvent(event);
  const req = Readable.from([]);
  req.method = String(method).toUpperCase();
  req.url = `${rawPath}${query ? `?${query}` : ""}`;
  req.headers = headers;
  return req;
}

function responseForHandler() {
  const chunks = [];
  const headers = {};
  let resolveFinished;
  const finished = new Promise((resolve) => { resolveFinished = resolve; });
  const res = {
    statusCode: 200,
    setHeader(key, value) { headers[String(key).toLowerCase()] = value; },
    end(chunk) {
      if (chunk !== undefined) chunks.push(Buffer.from(String(chunk)));
      resolveFinished({
        statusCode: this.statusCode,
        headers,
        body: Buffer.concat(chunks).toString("utf8"),
        isBase64Encoded: false
      });
    }
  };
  return { res, finished };
}

async function main(event = {}) {
  const req = requestFromEvent(event);
  const { res, finished } = responseForHandler();
  await handleHttpRequest(req, res);
  return finished;
}

module.exports = {
  HttpError,
  bindingCodeOwnerId,
  bindingDocumentId,
  handleHttpRequest,
  main,
  createBindingCode,
  firstDocument,
  normalizeRockyIdentitySession,
  readBinding,
  readHealthyStore,
  sha256,
  sanitizeHealthyRecord
};
