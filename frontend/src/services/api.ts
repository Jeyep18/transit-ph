import { API_BASE_URL, TOKEN_STORAGE_KEY } from "@/constants/api";
import type { AuthState } from "@/types/admin";

// ── Token helpers ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthState(state: AuthState): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, state.token);
  // Store admin info separately for useAdminAuth
  localStorage.setItem("transitph_admin_user", JSON.stringify(state.admin));
}

export function getStoredAdmin(): AuthState["admin"] | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("transitph_admin_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuthState(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem("transitph_admin_user");
}

// ── Error class ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

interface FetchOptions extends Omit<RequestInit, "body"> {
  auth?: boolean;
  body?: unknown;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { auth = false, body, headers = {}, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (!token) throw new ApiError(401, "Not authenticated. Please log in.");
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content
  if (response.status === 204) return {} as T;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : typeof data?.message === "string"
          ? data.message
          : typeof data?.error === "string"
            ? data.error
            : Object.values(data ?? {})
                .flat()
                .filter((item): item is string => typeof item === "string")
                .join(" ") || `HTTP ${response.status}`;
    throw new ApiError(response.status, message, data);
  }

  return data as T;
}

// ── Method shortcuts ──────────────────────────────────────────────────────────

export function normalizePaginatedResponse<T>(data: T | { results: T }): T {
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "results" in data
  ) {
    return (data as { results: T }).results;
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, auth = false) =>
    apiFetch<T>(path, { method: "GET", auth }),

  post: <T>(path: string, body: unknown, auth = false) =>
    apiFetch<T>(path, { method: "POST", body, auth }),

  patch: <T>(path: string, body: unknown, auth = false) =>
    apiFetch<T>(path, { method: "PATCH", body, auth }),

  delete: <T>(path: string, auth = false) =>
    apiFetch<T>(path, { method: "DELETE", auth }),
};
