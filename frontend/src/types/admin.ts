// ─── Admin Types ──────────────────────────────────────────────────────────

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface AuthToken {
  token: string;
  admin: AdminUser;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

/** Stored in localStorage after successful login */
export interface AuthState {
  token: string;
  admin: AdminUser;
}
