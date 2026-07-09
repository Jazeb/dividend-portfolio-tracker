// Generic HTTP client built on top of fetch.
// Use `http.get/post/put/patch/delete` from any component, hook, or server fn.
//
// Configuration:
//   VITE_API_BASE_URL  – base URL of your backend (e.g. http://localhost:3000)
//
// Auth:
//   Call `setAuthTokenProvider(() => token)` once (e.g. after login) and
//   every request will include `Authorization: Bearer <token>` automatically.

export class HttpError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.data = data;
  }
}

type TokenProvider = () => string | null | undefined | Promise<string | null | undefined>;
let tokenProvider: TokenProvider | null = null;

export function setAuthTokenProvider(provider: TokenProvider | null) {
  tokenProvider = provider;
}

export interface RequestOptions extends Omit<RequestInit, "body" | "method"> {
  /** Query string params, appended to the URL. */
  params?: Record<string, string | number | boolean | null | undefined>;
  /** JSON body. Automatically stringified and sets Content-Type. */
  body?: unknown;
  /** Skip sending the Authorization header for this request. */
  skipAuth?: boolean;
  /** Request timeout in ms (default 20000). */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT = 20_000;

function getBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
  return raw.replace(/\/+$/, "");
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const base = getBaseUrl();
  const url = /^https?:\/\//i.test(path)
    ? path
    : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  if (!params) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    qs.append(k, String(v));
  }
  const s = qs.toString();
  const u = s ? `${url}${url.includes("?") ? "&" : "?"}${s}` : url;
  console.log("=====> ", url);
  return u;
}

async function parseBody(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") ?? "";
  if (res.status === 204) return null;
  if (ct.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  const text = await res.text();
  return text || null;
}

export async function request<T = unknown>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, body, headers, skipAuth, timeoutMs, signal, ...rest } = options;

  const finalHeaders = new Headers(headers ?? {});
  const hasJsonBody = body !== undefined && !(body instanceof FormData);
  if (hasJsonBody && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (!finalHeaders.has("Accept")) finalHeaders.set("Accept", "application/json");

  if (!skipAuth && tokenProvider) {
    try {
      const token = await tokenProvider();
      if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
    } catch {
      /* ignore token errors */
    }
  }

  finalHeaders.set("UserId", "1");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs ?? DEFAULT_TIMEOUT);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, params), {
      ...rest,
      method,
      headers: finalHeaders,
      body: hasJsonBody ? JSON.stringify(body) : (body as BodyInit | null | undefined),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if ((err as Error)?.name === "AbortError") {
      throw new HttpError(0, "Request timed out or was aborted");
    }
    throw new HttpError(0, (err as Error)?.message || "Network error");
  }
  clearTimeout(timeout);

  const data = await parseBody(res);
  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : null) ||
      res.statusText ||
      `HTTP ${res.status}`;
    throw new HttpError(res.status, message, data);
  }
  return data as T;
}

export const http = {
  get: <T = unknown>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
  post: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),
  put: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body }),
  patch: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T = unknown>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, options),
};
