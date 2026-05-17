import { api } from "./api";
import { ENDPOINTS } from "@/constants/api";
import type {
  JeepneyLoopPolyline,
  SearchQuery,
  SearchResponse,
} from "@/types/search";

// No auth — public endpoint (BR-SCH-01)
// No data is stored server-side (BR-SCH-12, BR-SYS-05)
export async function searchRoutes(
  query: SearchQuery,
): Promise<SearchResponse> {
  return api.post<SearchResponse>(ENDPOINTS.SEARCH, query);
}

export async function getActiveJeepneyLoops(): Promise<JeepneyLoopPolyline[]> {
  const response = await api.get<{ loops: JeepneyLoopPolyline[] }>(
    ENDPOINTS.JEEPNEY_LOOPS,
  );
  return response.loops;
}
