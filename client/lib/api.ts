import { API_BASE_URL } from "./env";

export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  meta?: ApiMeta;
  error?: { message: string; details?: unknown };
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; params?: Record<string, string | number | boolean | undefined> } = {}
): Promise<{ data: T; meta?: ApiMeta }> {
  const url = new URL(`${API_BASE_URL}/api/v1${path}`);
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "include", // send the better-auth session cookie
    cache: "no-store",
  });

  // 204 No Content (deletes)
  if (res.status === 204) {
    return { data: undefined as T };
  }

  let json: Envelope<T> | null = null;
  try {
    json = await res.json();
  } catch {
    // non-JSON error page (e.g. a gateway timeout) — fall through to generic error below
  }

  if (!res.ok || !json?.success) {
    const message = json?.error?.message ?? `Request failed with status ${res.status}`;
    throw new ApiClientError(res.status, message, json?.error?.details);
  }

  return { data: json.data as T, meta: json.meta };
}

export const api = {
  get: <T>(path: string, params?: Record<string, string | number | boolean | undefined>) =>
    request<T>(path, { params }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
