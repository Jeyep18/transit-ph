// ─── Search Types ─────────────────────────────────────────────────────────

/** A single stop in a route leg */
export interface RouteStop {
  station_id: number;
  station_name: string;
  sequence_order: number;
  latitude: number;
  longitude: number;
}

export interface GraphPoint {
  node_id: number | null;
  name: string | null;
  latitude: number;
  longitude: number;
}

/** A single leg of a route suggestion */
export interface RouteLeg {
  route_id?: number;
  route_code?: string;
  route_name?: string;
  transport_mode?: string;
  transport_mode_name?: string;
  origin_station_id?: number;
  origin_station_name?: string;
  destination_station_id?: number;
  destination_station_name?: string;
  mode?: "JEEPNEY" | "TRICYCLE" | "WALKING";
  loop_code?: string | null;
  loop_name?: string | null;
  from_node?: GraphPoint;
  to_node?: GraphPoint;
  distance_km: number;
  fare: number | null;
  estimated_duration_min: number | null;
  is_estimated: boolean;
  stops?: RouteStop[];
  geometry?: GraphPoint[];
  instruction?: string;
}

/** A complete route suggestion (may have multiple legs with transfers) */
export interface RouteResult {
  routing_model?: "GRAPH_DIJKSTRA" | string;
  legs: RouteLeg[];
  total_fare: number | null;
  total_distance_km: number;
  total_duration_min: number | null;
  transfer_count: number;
  is_estimated?: boolean;
  geometry?: GraphPoint[];
}

/** Request body for the search API */
export interface SearchQuery {
  origin_station_id?: number;
  destination_station_id?: number;
  origin_lat?: number;
  origin_lng?: number;
  dest_lat?: number;
  dest_lng?: number;
  sort_by?: "fare" | "transfers" | "distance" | "time";
}

/** Response from the search API */
export interface SearchResponse {
  origin_station_id?: number;
  destination_station_id?: number;
  origin_node?: GraphPoint;
  destination_node?: GraphPoint;
  sort_by?: string;
  result_count: number;
  results: RouteResult[];
}

export interface JeepneyLoopPolyline {
  loop_id: number;
  code: string;
  name: string;
  geometry: GraphPoint[];
  nodes?: GraphPoint[];
}
