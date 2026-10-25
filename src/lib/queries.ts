import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

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
};

export const POOL_SELECT =
  "*, products(*, categories(name, slug)), collection_points(*), campaigns(name)";

export const PUBLIC_STATUSES = ["open", "scheduled"];

async function refresh() {
  // Idempotent lifecycle check (closes due pools). Also runs hourly on the backend.
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

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => (await supabase.from("categories").select("*").order("sort")).data ?? [],
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

export function errMsg(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) return String(e.message);
  return "Something went wrong. Please try again.";
}
