import { api, normalizePaginatedResponse } from "./api";
import { ENDPOINTS } from "@/constants/api";
import type {
  Route,
  RouteListItem,
  RouteFormData,
  RouteStation,
  RouteStationFormData,
} from "@/types/route";

// ── Public ────────────────────────────────────────────────────────────────────

export async function getRoutes(params?: {
  is_active?: boolean;
}): Promise<RouteListItem[]> {
  const qs = new URLSearchParams();
  if (params?.is_active !== undefined)
    qs.set("is_active", String(params.is_active));

  const query = qs.toString() ? `?${qs}` : "";
  const data = await api.get<RouteListItem[] | { results: RouteListItem[] }>(
    `${ENDPOINTS.ROUTES}${query}`,
  );
  return normalizePaginatedResponse(data);
}

export async function getRoute(id: number): Promise<Route> {
  return api.get<Route>(ENDPOINTS.ROUTE(id));
}

// ── Admin only ────────────────────────────────────────────────────────────────

export async function createRoute(data: RouteFormData): Promise<Route> {
  return api.post<Route>(ENDPOINTS.ROUTES, data, true);
}

export async function updateRoute(
  id: number,
  data: Partial<RouteFormData>,
): Promise<Route> {
  return api.patch<Route>(ENDPOINTS.ROUTE(id), data, true);
}

export async function deactivateRoute(id: number): Promise<Route> {
  return api.patch<Route>(ENDPOINTS.ROUTE(id), { is_active: false }, true);
}

// ── Route-Station sequence management ────────────────────────────────────────

export async function getRouteStations(
  routeId: number,
): Promise<RouteStation[]> {
  const data = await api.get<RouteStation[] | { results: RouteStation[] }>(
    ENDPOINTS.ROUTE_STATIONS(routeId),
    true,
  );
  return normalizePaginatedResponse(data);
}

export async function addRouteStation(
  routeId: number,
  data: RouteStationFormData,
): Promise<RouteStation> {
  return api.post<RouteStation>(ENDPOINTS.ROUTE_STATIONS(routeId), data, true);
}

export async function updateRouteStation(
  routeId: number,
  routeStationId: number,
  data: Partial<RouteStationFormData>,
): Promise<RouteStation> {
  return api.patch<RouteStation>(
    ENDPOINTS.ROUTE_STATION(routeId, routeStationId),
    data,
    true,
  );
}

export async function removeRouteStation(
  routeId: number,
  routeStationId: number,
): Promise<void> {
  // Backend re-sequences remaining stations after deletion — BR-RSA-07
  return api.delete<void>(
    ENDPOINTS.ROUTE_STATION(routeId, routeStationId),
    true,
  );
}
