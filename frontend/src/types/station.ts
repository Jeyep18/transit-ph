// ─── Station Types ─────────────────────────────────────────────────────────

export type StationType = "JEEPNEY_STOP" | "TRICYCLE_TERMINAL";

export interface Station {
  station_id: number;
  name: string;
  station_type: StationType;
  latitude: number;
  longitude: number;
  address?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  updated_by?: number | null;
  updated_by_username?: string | null;
}

/** Lightweight version used in dropdowns and lists */
export interface StationListItem {
  station_id: number;
  name: string;
  station_type: StationType;
  latitude: number;
  longitude: number;
  is_active: boolean;
}

/** For nearby-stations API response */
export interface NearbyStation {
  station_id: number;
  name: string;
  station_type: StationType;
  latitude: number;
  longitude: number;
  distance_km: number;
}

/** Form data for creating/updating a station */
export interface StationFormData {
  name: string;
  station_type: StationType;
  latitude: number;
  longitude: number;
  address?: string;
  is_active?: boolean;
}
