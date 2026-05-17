import { API_BASE_URL, ENDPOINTS } from "@/constants/api";

export interface NominatimResult {
  display_name: string;
  lat: number;
  lon: number;
  importance?: number;
  source?: string;
}

const searchCache = new Map<string, NominatimResult[]>();

export async function nominatimSearch(
  query: string,
): Promise<NominatimResult[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 3) return [];
  const cacheKey = trimmedQuery.toLocaleLowerCase("en-PH");
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({ q: trimmedQuery });
  const response = await fetch(
    `${API_BASE_URL}${ENDPOINTS.GEOCODE_SEARCH}?${params}`,
    { headers: { Accept: "application/json" } },
  );

  if (!response.ok) {
    throw new Error("OSM lookup failed.");
  }

  const payload = (await response.json()) as { results: NominatimResult[] };
  const normalizedResults = payload.results ?? [];

  searchCache.set(cacheKey, normalizedResults);
  return normalizedResults;
}
