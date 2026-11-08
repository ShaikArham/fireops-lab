const DEMO_TOKEN_KEY = "fireops-demo-access-token";

export function demoRequestHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? window.sessionStorage.getItem(DEMO_TOKEN_KEY) : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { "X-FireOps-Demo": "1", ...demoRequestHeaders(), ...init?.headers },
      credentials: "same-origin",
      cache: "no-store",
      signal: init?.signal ?? AbortSignal.timeout(30_000),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new Error("The request timed out. Refresh the records before retrying a write action.");
    }
    throw new Error("Could not reach the demo service. Check your connection and try again.");
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload ? payload.detail : null;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail
              .map((item) => (typeof item?.msg === "string" ? item.msg : "Invalid input"))
              .join(". ")
          : `The service returned an error (${response.status}). Please try again.`;
    throw new Error(message);
  }
  if (payload === null)
    throw new Error("The service returned an unreadable response. Please try again.");
  if (
    url.endsWith("/api/v1/demo/session") &&
    init?.method === "POST" &&
    payload &&
    typeof payload === "object" &&
    "access_token" in payload &&
    typeof payload.access_token === "string" &&
    typeof window !== "undefined"
  ) {
    window.sessionStorage.setItem(DEMO_TOKEN_KEY, payload.access_token);
  }
  return payload as T;
}
