import type { Tables } from "@/integrations/supabase/types";

type BusinessAddress = Pick<Tables<"businesses">, "deliver_to" | "zone_id" | "delivery_zone_id">;

/** The delivery zone a business's stock goes to (matches private.business_delivery) */
export function shopZoneId(b: BusinessAddress | null | undefined): string | null {
  if (!b) return null;
  return b.deliver_to === "other" ? b.delivery_zone_id : b.zone_id;
}

/** Google Maps link for a map pin (opens the app on phones), or null when there is no pin */
export function mapsUrl(lat: number | null | undefined, lon: number | null | undefined) {
  if (lat == null || lon == null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lon.toFixed(6)}`;
}
