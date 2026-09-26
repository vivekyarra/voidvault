const rawBaseUrl = (import.meta.env.VITE_API_URL ?? "").trim();
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 15_000;

function buildUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (!normalizedBaseUrl) {
    return cleanPath;
  }
  return `${normalizedBaseUrl}${cleanPath}`;
}

function readCookie(name: string): string | null {
  const cookies = document.cookie ? document.cookie.split(";") : [];
  for (const cookie of cookies) {
    const [rawName, ...rest] = cookie.trim().split("=");
    if (rawName !== name) {
      continue;
    }
    try {
      return decodeURIComponent(rest.join("="));
    } catch {
      return rest.join("=");
    }
  }
  return null;
}

function readSessionToken(): string | null {
  try {
    return window.localStorage.getItem("vv_session_token");
  } catch {
    return null;
  }
}

export function persistSessionToken(token: string | null): void {
  try {
    if (!token) {
      window.localStorage.removeItem("vv_session_token");
      return;
    }
    window.localStorage.setItem("vv_session_token", token);
  } catch {
    // Ignore storage failures in restricted browser modes.
  }
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function requestJson<TResponse>(
  path: string,
  init?: Omit<RequestInit, "body"> & { body?: unknown },
): Promise<TResponse> {
  const headers = new Headers(init?.headers);
  const method = (init?.method ?? "GET").toUpperCase();
  const isMutatingMethod =
    method === "POST" || method === "PATCH" || method === "PUT" || method === "DELETE";
  const hasBody = init?.body !== undefined;
  if (hasBody) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  if (isMutatingMethod) {
    const csrfToken = readCookie("csrf_token");
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }

  const sessionToken = readSessionToken();
  if (sessionToken) {
    headers.set("Authorization", `Bearer ${sessionToken}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildUrl(path), {
      ...init,
      method,
      credentials: "include",
      headers,
      body: hasBody ? JSON.stringify(init!.body) : undefined,
      signal: controller.signal,
    });

    const payload = await parseJsonSafely(response);
    if (!response.ok) {
      const fallbackMessage = `Request failed (${response.status})`;
      const errorMessage =
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof (payload as { error: unknown }).error === "string"
          ? (payload as { error: string }).error
          : fallbackMessage;
      throw new Error(errorMessage);
    }

    return payload as TResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
