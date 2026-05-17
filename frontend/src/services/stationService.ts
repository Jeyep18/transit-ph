import { api, normalizePaginatedResponse } from "./api";
import { ENDPOINTS } from "@/constants/api";
import type {
  Station,
  StationListItem,
  StationFormData,
  NearbyStation,
} from "@/types/station";

type StationListResponseItem = Omit<
  StationListItem,
  "latitude" | "longitude"
> & {
  latitude: string | number;
  longitude: string | number;
};

function parseStationListItem(item: StationListResponseItem): StationListItem {
  return {
    ...item,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
  };
}

// ── Public (no auth) ──────────────────────────────────────────────────────────

export async function getStations(params?: {
  search?: string;
  station_type?: string;
  is_active?: boolean;
}): Promise<StationListItem[]> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.station_type) qs.set("station_type", params.station_type);
  if (params?.is_active !== undefined)
    qs.set("is_active", String(params.is_active));

  const query = qs.toString() ? `?${qs}` : "";
  const data = await api.get<
    StationListResponseItem[] | { results: StationListResponseItem[] }
  >(`${ENDPOINTS.STATIONS}${query}`);
  return normalizePaginatedResponse(data).map(parseStationListItem);
}

export async function getStation(id: number): Promise<Station> {
  return api.get<Station>(ENDPOINTS.STATION(id));
}

export async function getNearbyStations(
  lat: number,
  lng: number,
  radiusKm = 0.5,
): Promise<NearbyStation[]> {
  const qs = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius: String(radiusKm),
  });
  const data = await api.get<{ stations: NearbyStation[] }>(
    `${ENDPOINTS.STATIONS_NEARBY}?${qs}`,
  );
  return data.stations;
}

// Used by SearchBarContainer — returns active stations matching the query
export async function searchStations(
  query: string,
): Promise<StationListItem[]> {
  if (!query.trim() || query.length < 2) return [];
  return getStations({ search: query, is_active: true });
}

// ── Admin only (auth required) ────────────────────────────────────────────────

export async function createStation(data: StationFormData): Promise<Station> {
  return api.post<Station>(ENDPOINTS.STATIONS, data, true);
}

export async function updateStation(
  id: number,
  data: Partial<StationFormData>,
): Promise<Station> {
  return api.patch<Station>(ENDPOINTS.STATION(id), data, true);
}

// Soft delete — BR-SYS-08
export async function deactivateStation(id: number): Promise<Station> {
  return api.patch<Station>(ENDPOINTS.STATION(id), { is_active: false }, true);
}
