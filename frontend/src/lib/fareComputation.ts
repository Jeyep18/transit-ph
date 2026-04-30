// LTFRB regulated jeepney fare matrix
const JEEPNEY_BASE_FARE = 13.0; // PHP — covers first 4 km
const JEEPNEY_BASE_KM = 4;
const JEEPNEY_RATE_PER_KM = 1.8; // PHP per km beyond base distance

// Tricycle — advisory estimate only (locally negotiated, not LTFRB regulated)
const TRICYCLE_BASE_FARE = 15.0;
const TRICYCLE_RATE_PER_KM = 2.0;

export function computeJeepneyFare(distanceKm: number): number {
  const extra = Math.max(0, distanceKm - JEEPNEY_BASE_KM);
  return (
    Math.round((JEEPNEY_BASE_FARE + extra * JEEPNEY_RATE_PER_KM) * 100) / 100
  );
}

export function computeTricycleFare(distanceKm: number): number {
  return (
    Math.round((TRICYCLE_BASE_FARE + distanceKm * TRICYCLE_RATE_PER_KM) * 100) /
    100
  );
}

export function formatFare(amount: number): string {
  return `Php ${amount.toFixed(2)}`;
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
}
