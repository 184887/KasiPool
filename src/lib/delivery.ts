import type { PoolDistance } from "@/lib/queries";

/** Pools are joinable within this many km of their centre unless an admin changes it */
export const DEFAULT_RADIUS_KM = 10;

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

/** OpenStreetMap place search (free, no key). Used for map pins and to find an area's centre. */
export const NOMINATIM = "https://nominatim.openstreetmap.org";

/**
 * The centre of a township or area, e.g. "Khayelitsha, Cape Town". Only an approximate location:
 * good enough to work out distances to deals, never to deliver to. Null if it can't be found.
 */
export async function findArea(...parts: string[]) {
  const q = parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join(", ");
  if (!q) return null;
  try {
    const res = await fetch(
      `${NOMINATIM}/search?format=json&limit=1&countrycodes=za&q=${encodeURIComponent(q)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const [hit] = (await res.json()) as { lat: string; lon: string }[];
    return hit ? { latitude: +hit.lat, longitude: +hit.lon } : null;
  } catch {
    return null;
  }
}

type PinFields = {
  deliver_to: string;
  latitude: number | null;
  delivery_latitude: number | null;
};

/** Which address still needs its exact map pin before the business can confirm an order */
export function missingPin(b: PinFields | null | undefined): "business" | "other" | null {
  if (!b) return null;
  if (b.deliver_to === "other") return b.delivery_latitude == null ? "other" : null;
  return b.latitude == null ? "business" : null;
}
