const DEFAULT_DEV_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN ?? "";

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (DEFAULT_DEV_DOMAIN
    ? `https://${DEFAULT_DEV_DOMAIN}/api`
    : "http://localhost:8080/api");

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch (err) {
    throw new ApiError(
      err instanceof Error
        ? `Network error: ${err.message}`
        : "Network error.",
      0,
    );
  }

  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: false, message: text };
    }
  }

  if (!res.ok || data?.success === false) {
    const msg =
      data?.message ?? `Request failed (${res.status})`;
    throw new ApiError(String(msg), res.status, data);
  }
  return data as T;
}

export function jsonBody(body: unknown): RequestInit {
  return { method: "POST", body: JSON.stringify(body) };
}
