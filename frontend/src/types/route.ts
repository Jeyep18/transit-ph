// ─── Route Types ──────────────────────────────────────────────────────────

export interface RouteStation {
  route_station_id: number;
  route: number;
  station: number;
  station_name: string;
  station_type: string;
  latitude: number;
  longitude: number;
  sequence_order: number;
  distance_from_prev_km: number | null;
  updated_by?: number | null;
}

export interface Route {
  route_id: number;
  route_code: string;
  name: string;
  transport_mode: number;
  transport_mode_name: string;
  origin_station: number;
  origin_station_name: string;
  terminal_station: number;
  terminal_station_name: string;
  estimated_duration_min: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  updated_by?: number | null;
  station_count: number;
  stations: RouteStation[];
}

/** Lightweight version for route listings */
export interface RouteListItem {
  route_id: number;
  route_code: string;
  name: string;
  transport_mode_name: string;
  origin_station_name: string;
  terminal_station_name: string;
  estimated_duration_min: number | null;
  is_active: boolean;
  station_count: number;
}

/** Form data for creating/updating a route */
export interface RouteFormData {
  route_code: string;
  name: string;
  transport_mode: number;
  origin_station: number;
  terminal_station: number;
  estimated_duration_min?: number | null;
  is_active?: boolean;
}

/** For creating/updating route-station associations */
export interface RouteStationFormData {
  station: number;
  sequence_order: number;
  distance_from_prev_km?: number | null;
}
