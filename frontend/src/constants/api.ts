export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:8000");

export const ENDPOINTS = {
  // Auth
  LOGIN: "/api/auth/login/",
  LOGOUT: "/api/auth/logout/",
  ME: "/api/auth/me/",

  // Stations
  STATIONS: "/api/stations/",
  STATION: (id: number) => `/api/stations/${id}/`,
  STATIONS_NEARBY: "/api/stations/nearby/",

  // Routes
  ROUTES: "/api/routes/",
  ROUTE: (id: number) => `/api/routes/${id}/`,
  ROUTE_STATIONS: (routeId: number) => `/api/routes/${routeId}/stations/`,
  ROUTE_STATION: (routeId: number, rsId: number) =>
    `/api/routes/${routeId}/stations/${rsId}/`,

  // Fare Matrix
  FARE_MATRIX: "/api/fare-matrix/",
  FARE_MATRIX_ITEM: (id: number) => `/api/fare-matrix/${id}/`,

  // Transport Modes
  TRANSPORT_MODES: "/api/transport-modes/",

  // Public Search
  GEOCODE_SEARCH: "/api/geocode/search/",
  SEARCH: "/api/search/",
  JEEPNEY_LOOPS: "/api/jeepney-loops/",
} as const;

export const TOKEN_STORAGE_KEY = "transitph_admin_token";
