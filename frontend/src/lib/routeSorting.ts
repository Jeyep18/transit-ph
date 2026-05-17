import type { RouteResult } from "@/types/search";

export type SortMode = "fare" | "transfers" | "distance" | "time";

/**
 * Sorts route results without mutating the input array.
 * Matches the sort_by options accepted by the backend search API.
 */
export function sortRoutes(
  routes: RouteResult[],
  mode: SortMode,
): RouteResult[] {
  const copy = [...routes];

  switch (mode) {
    case "fare":
      // Null fares (tricycle-only, estimated) go last
      return copy.sort((a, b) => {
        if (a.total_fare === null) return 1;
        if (b.total_fare === null) return -1;
        return a.total_fare - b.total_fare;
      });

    case "transfers":
      // Fewest transfers first; break ties by fare
      return copy.sort((a, b) =>
        a.transfer_count !== b.transfer_count
          ? a.transfer_count - b.transfer_count
          : (a.total_fare ?? Infinity) - (b.total_fare ?? Infinity),
      );

    case "distance":
      // Shortest road distance first; break ties by fare
      return copy.sort((a, b) =>
        a.total_distance_km !== b.total_distance_km
          ? a.total_distance_km - b.total_distance_km
          : (a.total_fare ?? Infinity) - (b.total_fare ?? Infinity),
      );

    case "time":
      // Shortest travel time first; break ties by fare
      return copy.sort((a, b) =>
        (a.total_duration_min ?? Infinity) !==
        (b.total_duration_min ?? Infinity)
          ? (a.total_duration_min ?? Infinity) -
            (b.total_duration_min ?? Infinity)
          : (a.total_fare ?? Infinity) - (b.total_fare ?? Infinity),
      );

    default:
      return copy;
  }
}
