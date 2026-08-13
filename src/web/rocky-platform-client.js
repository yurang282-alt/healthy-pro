export class RockyPlatformError extends Error {
  constructor(status, code) {
    super(code || `HTTP_${status}`);
    this.name = "RockyPlatformError";
    this.status = status;
    this.code = code || `HTTP_${status}`;
  }
}

function responseHeader(response, name) {
  const headers = response?.headers;
  if (!headers) return "";
  if (typeof headers.get === "function") return String(headers.get(name) || "");
  const value = headers[String(name).toLowerCase()] ?? headers[name];
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}

function sessionFromHeaders(response, payload) {
  const rockyUserId = responseHeader(response, "x-rocky-user-id");
  const appId = responseHeader(response, "x-rocky-app-id");
  const scopes = responseHeader(response, "x-rocky-scopes")
    .split(",")
    .map((scope) => scope.trim())
    .filter((scope) => /^[a-z][a-z0-9:-]{1,99}$/.test(scope));

  if (payload?.ok !== true || !/^ru_[a-z0-9]{16,64}$/.test(rockyUserId) || !appId) {
    throw new RockyPlatformError(502, "IDENTITY_CONTRACT_INVALID");
  }

  return Object.freeze({
    ok: true,
    appId,
    scopes,
    expiresAt: responseHeader(response, "x-rocky-expires-at")
  });
}

export function createRockyPlatformClient({
  basePath = "/account/api/identity",
  fetchImpl = globalThis.fetch,
  timeoutMs = 8000
} = {}) {
  if (typeof fetchImpl !== "function") throw new TypeError("fetchImpl is required");
  if (basePath !== "/account/api/identity") {
    throw new TypeError("basePath must use the Rocky same-origin identity path");
  }

  async function session(appId) {
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeoutId = setTimeout(() => controller?.abort(), timeoutMs);
    let response;
    try {
      response = await fetchImpl(`${basePath}/session?appId=${encodeURIComponent(appId)}`, {
        method: "GET",
        credentials: "include",
        headers: { accept: "application/json" },
        cache: "no-store",
        ...(controller ? { signal: controller.signal } : {})
      });
    } catch (error) {
      throw new RockyPlatformError(0, error?.name === "AbortError" ? "REQUEST_TIMEOUT" : "NETWORK_UNAVAILABLE");
    } finally {
      clearTimeout(timeoutId);
    }

    let payload = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }
    if (!response.ok) throw new RockyPlatformError(response.status, payload.code);
    return sessionFromHeaders(response, payload);
  }

  return Object.freeze({ session });
}
