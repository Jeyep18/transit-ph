import type { FareMatrix } from "@/types/fareMatrix";

/**
 * Implements BR-FCM-02:
 * fare = base_fare + max(0, distance_km − base_km) × incremental_rate
 * Rounded to 2 decimal places (BR-FCM-06).
 */
export function computeFare(
  distanceKm: number,
  matrix: Pick<FareMatrix, "base_fare" | "base_km" | "incremental_rate">,
): number {
  const extra = Math.max(0, distanceKm - matrix.base_km);
  const raw = matrix.base_fare + extra * matrix.incremental_rate;
  return Math.round(raw * 100) / 100;
}

// ── Fallback constants ────────────────────────────────────────────────────────
// Used ONLY when the backend is unreachable.
// Values must match the seed data inserted in Phase 1.
export const FALLBACK_JEEPNEY_MATRIX: Pick<
  FareMatrix,
  "base_fare" | "base_km" | "incremental_rate"
> = {
  base_fare: 13.0,
  base_km: 4,
  incremental_rate: 1.8,
};

// Convenience helpers used by the UI -------------------------------------------------
// These provide the simple, app-level fare calculators expected by components.
export function computeJeepneyFare(distanceKm: number): number {
  return computeFare(distanceKm, FALLBACK_JEEPNEY_MATRIX);
}

// Tricycle: advisory estimate (not LTFRB regulated)
const TRICYCLE_BASE_FARE = 15.0;
const TRICYCLE_RATE_PER_KM = 2.0;

export function computeTricycleFare(distanceKm: number): number {
  const raw = TRICYCLE_BASE_FARE + distanceKm * TRICYCLE_RATE_PER_KM;
  return Math.round(raw * 100) / 100;
}

// Re-export formatting utilities so callers can import them from the same module.
export { formatFare, formatDistance, formatDuration } from "@/lib/formatters";
