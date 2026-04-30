const RAILWAY_DEFAULT = "https://function-bun-production-37b5.up.railway.app";

function pickBaseUrl(): string {
  const override = process.env.EXPO_PUBLIC_RELWORX_BACKEND_URL;
  if (override && override.trim()) return override.replace(/\/+$/, "");
  return RAILWAY_DEFAULT;
}

export const API_BASE_URL = pickBaseUrl();

export class ApiError extends Error {
  status: number;
  details: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  timeoutMs?: number;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { body, query, timeoutMs = 30000, headers, ...rest } = options;

  const url = new URL(
    path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
  );
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      ...rest,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(headers || {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeoutId);
    if ((e as Error).name === "AbortError") {
      throw new ApiError(0, "Request timed out. Please try again.");
    }
    throw new ApiError(0, "Network error. Check your connection.");
  }
  clearTimeout(timeoutId);

  let payload: any = null;
  const text = await res.text();
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = text; }
  }

  if (!res.ok || (payload && typeof payload === "object" && payload.success === false)) {
    const msg =
      (payload && typeof payload === "object" && (payload.error || payload?.details?.message || payload.message)) ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, String(msg), payload);
  }

  return payload as T;
}
