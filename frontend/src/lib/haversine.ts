const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Great-circle distance in km between two coordinates.
 * Used as fare computation fallback when road distance is unavailable (BR-FCM-03).
 * Always flag result with is_estimated: true (BR-FCM-04).
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
}

/**
 * Returns true if two points are within thresholdMeters of each other.
 * Used for the 50m station proximity check (BR-STA-07).
 */
export function isWithinMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  thresholdMeters: number,
): boolean {
  return haversineKm(lat1, lng1, lat2, lng2) * 1000 < thresholdMeters;
}
