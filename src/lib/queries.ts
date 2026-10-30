import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { isUuid } from "./utils";

export type PaymentSettings = {
  [key: string]: Json | undefined;
  configured: boolean;
  method: string;
  bank: string;
  account_name: string;
  account_number: string;
  branch_code: string;
  notes: string;
};

export type ContactSettings = {
  [key: string]: Json | undefined;
  phone?: string;
  email?: string;
  whatsapp?: string;
};

export type AppSettings = {
  payment?: PaymentSettings;
  terms?: { version: string };
  contact?: ContactSettings;
  /** KasiPool's share of each pool's discount, in percent */
  pricing?: { discount_share_pct: number };
  /** One flat delivery fee per order (0 = free delivery) */
  delivery?: { fee_per_order: number };
};

/** How far the signed-in business is from a pool (rounded km; the pool's centre stays private) */
export type PoolDistance = { distance_km: number; radius_km: number; in_range: boolean };

export const POOL_SELECT = "*, products(*, categories(name, slug)), campaigns(name)";

async function refresh() {
  // Idempotent lifecycle check (closes due pools). pg_cron also runs it every minute.
  await supabase.rpc("refresh_pool_states");
}

export const activePoolsQuery = queryOptions({
  queryKey: ["pools", "active"],
  queryFn: async () => {
    await refresh();
    const { data, error } = await supabase
      .from("pools")
      .select(POOL_SELECT)
      .in("status", ["open", "scheduled", "awaiting_confirmation"])
      .order("closes_at");
    if (error) throw error;
    return data;
  },
});

export const poolQuery = (id: string) =>
  queryOptions({
    queryKey: ["pool", id],
    queryFn: async () => {
      // A link cut short in a chat is not a deal id; the database would reject it
      if (!isUuid(id)) return null;
      await refresh();
      const { data, error } = await supabase
        .from("pools")
        .select(POOL_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const catalogueQuery = queryOptions({
  queryKey: ["catalogue"],
  queryFn: async () => {
    const [{ data: products, error }, { data: cats }, { data: pools }] = await Promise.all([
      supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("active", true)
        .order("name"),
      supabase.from("categories").select("*").order("sort"),
      supabase.from("pools").select("id, product_id, status").in("status", ["open", "scheduled"]),
    ]);
    if (error) throw error;
    return { products: products ?? [], categories: cats ?? [], pools: pools ?? [] };
  },
});

/** Distance to each public pool for the signed-in business, by pool id. Pools without a
 * centre (older ones) and private groups aren't in the map: anyone can join those. */
export const poolDistancesQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["pool-distances", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.rpc("my_pool_distances");
      return new Map<string, PoolDistance>(
        (data ?? []).map((d) => [
          d.pool_id,
          { distance_km: d.distance_km, radius_km: Number(d.radius_km), in_range: d.in_range },
        ]),
      );
    },
  });

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async () => {
    const { data } = await supabase.from("app_settings").select("*");
    const map: Record<string, Json> = {};
    (data ?? []).forEach((r) => (map[r.key] = r.value));
    return map as AppSettings;
  },
});

const MY_ORDER_POOL_SELECT =
  "pools(id, status, unit, price, min_qty, pledged_qty, participant_count, closes_at, payment_deadline, products(name, image_url, pack_size))";

async function getMyOrders(userId: string) {
  const { data } = await supabase
    .from("orders")
    .select(`*, ${MY_ORDER_POOL_SELECT}`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export type MyOrder = Awaited<ReturnType<typeof getMyOrders>>[number];

/** The signed-in shop's orders, newest first. Shared by Home (next step) and My Pools. */
export const myOrdersQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["my-orders", userId],
    enabled: !!userId,
    queryFn: () => getMyOrders(userId!),
  });

/** An error whose message is written for shops and safe to show as is. */
export class FriendlyError extends Error {}

/**
 * Text to show for an error. Only our own messages are shown: ones the database functions raise
 * on purpose (`raise exception`, code P0001) and FriendlyError. Anything else (constraint, table
 * or permission errors) would leak internal details, so it gets a plain message and goes to the
 * console instead.
 */
export function errMsg(e: unknown): string {
  if (e instanceof FriendlyError) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    if ("code" in e && e.code === "P0001") return String(e.message);
    if (e instanceof TypeError) return "No connection. Check your data and try again.";
  }
  console.error(e);
  return "Something went wrong. Please try again.";
}
