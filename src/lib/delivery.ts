import type { PoolDistance } from "@/lib/queries";

/** Pools are joinable within this many km of their centre unless an admin changes it */
export const DEFAULT_RADIUS_KM = 10;

/** "under 1 km", "4 km": for use inside a sentence */
export function distanceText(d: Pick<PoolDistance, "distance_km">) {
  return d.distance_km < 1 ? "under 1 km" : `${d.distance_km} km`;
}

/** "Under 1 km away", "4 km away": a label on its own */
export function distanceLabel(d: Pick<PoolDistance, "distance_km">) {
  const t = `${distanceText(d)} away`;
  return t[0].toUpperCase() + t.slice(1);
}

/** Nearest first; pools you can't join go last */
export function byDistance<T extends { id: string }>(list: T[], dist: Map<string, PoolDistance>) {
  const key = (p: T) => {
    const d = dist.get(p.id);
    return d ? (d.in_range ? d.distance_km : 10_000 + d.distance_km) : 5_000;
  };
  return [...list].sort((a, b) => key(a) - key(b));
}

/** Google Maps link for a map pin (opens the app on phones), or null when there is no pin */
export function mapsUrl(lat: number | null | undefined, lon: number | null | undefined) {
  if (lat == null || lon == null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lon.toFixed(6)}`;
}
