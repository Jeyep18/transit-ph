// ─── Fare Matrix Types ────────────────────────────────────────────────────

export interface FareMatrix {
  fare_matrix_id: number;
  transport_mode: number;
  transport_mode_name: string;
  base_fare: number;
  base_km: number;
  incremental_rate: number;
  effective_date: string;
  is_active: boolean;
  created_at?: string;
  updated_by?: number | null;
  updated_by_username?: string | null;
}

/** Form data for creating/updating a fare matrix */
export interface FareMatrixFormData {
  transport_mode: number;
  base_fare: number;
  base_km: number;
  incremental_rate: number;
  effective_date: string;
  is_active?: boolean;
}
