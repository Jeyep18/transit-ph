/** "14.5" → "Php 14.50" */
export function formatFare(amount: number | string | null): string {
  if (amount === null || amount === undefined) return "Est. only";
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(value)) return "Est. only";
  return `Php ${value.toFixed(2)}`;
}

/** "0.3" → "300 m" | "3.7" → "3.7 km" */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** "45" → "~45 min" | "90" → "~1h 30m" */
export function formatDuration(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
}

/** "2024-01-15" → "January 15, 2024" */
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** ISO timestamp → "Jan 15, 2024, 02:30 PM" */
export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
