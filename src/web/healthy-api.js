export class HealthyApiError extends Error {
  constructor(status, code, message = "") {
    super(message || code || `HTTP_${status}`);
    this.name = "HealthyApiError";
    this.status = status;
    this.code = code || `HTTP_${status}`;
  }
}

export function createHealthyApiClient({
  basePath = "/apps/healthy/api",
  fetchImpl = globalThis.fetch,
  timeoutMs = 10000
} = {}) {
  if (typeof fetchImpl !== "function") throw new TypeError("fetchImpl is required");
  if (basePath !== "/apps/healthy/api") throw new TypeError("Healthy API must be same-origin");

  async function request(path, options = {}) {
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeoutId = setTimeout(() => controller?.abort(), timeoutMs);
    let response;
    try {
      response = await fetchImpl(`${basePath}${path}`, {
        method: options.method || "GET",
        credentials: "include",
        headers: {
          accept: "application/json",
          ...(options.method === "POST" ? { "content-type": "application/json" } : {})
        },
        cache: "no-store",
        ...(options.method === "POST" ? { body: "{}" } : {}),
        ...(controller ? { signal: controller.signal } : {})
      });
    } catch (error) {
      throw new HealthyApiError(0, error?.name === "AbortError" ? "REQUEST_TIMEOUT" : "NETWORK_UNAVAILABLE");
    } finally {
      clearTimeout(timeoutId);
    }

    let payload = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }
    if (!response.ok) throw new HealthyApiError(response.status, payload.code, payload.message);
    return payload;
  }

  return Object.freeze({
    health: () => request("/health"),
    bootstrap: () => request("/bootstrap"),
    createBindingCode: () => request("/binding-code", { method: "POST" })
  });
}
