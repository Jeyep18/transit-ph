import {
  api,
  normalizePaginatedResponse,
  setAuthState,
  clearAuthState,
} from "./api";
import { ENDPOINTS } from "@/constants/api";
import type { AdminUser, AuthToken, LoginCredentials } from "@/types/admin";
import type { FareMatrix, FareMatrixFormData } from "@/types/fareMatrix";

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(credentials: LoginCredentials): Promise<AuthToken> {
  const data = await api.post<AuthToken>(ENDPOINTS.LOGIN, credentials);
  // Persist token + admin info to localStorage
  setAuthState({ token: data.token, admin: data.admin });
  return data;
}

export async function logout(): Promise<void> {
  try {
    await api.post<void>(ENDPOINTS.LOGOUT, {}, true);
  } finally {
    clearAuthState(); // always clear locally even if server call fails
  }
}

export async function getMe(): Promise<AdminUser> {
  return api.get<AdminUser>(ENDPOINTS.ME, true);
}

// ── Fare Matrix ───────────────────────────────────────────────────────────────

export async function getFareMatrices(): Promise<FareMatrix[]> {
  const data = await api.get<FareMatrix[] | { results: FareMatrix[] }>(
    ENDPOINTS.FARE_MATRIX,
    true,
  );
  return normalizePaginatedResponse(data);
}

export async function getActiveFareMatrix(): Promise<FareMatrix | null> {
  const matrices = await getFareMatrices();
  return matrices.find((m) => m.is_active) ?? null;
}

export async function createFareMatrix(
  data: FareMatrixFormData,
): Promise<FareMatrix> {
  return api.post<FareMatrix>(ENDPOINTS.FARE_MATRIX, data, true);
}

// Activating a new matrix automatically deactivates the previous — BR-FAR-03
// Backend handles the swap; frontend just sends the PATCH
export async function activateFareMatrix(id: number): Promise<FareMatrix> {
  return api.patch<FareMatrix>(
    ENDPOINTS.FARE_MATRIX_ITEM(id),
    { is_active: true },
    true,
  );
}

export async function deactivateFareMatrix(id: number): Promise<FareMatrix> {
  return api.patch<FareMatrix>(
    ENDPOINTS.FARE_MATRIX_ITEM(id),
    { is_active: false },
    true,
  );
}
