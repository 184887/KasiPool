import { isUuid } from "./utils";

/** The public address, for share previews, the sitemap and canonical links */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kasipool.co.za";

export type PublicPool = {
  id: string;
  status: string;
  price: number;
  reference_price: number | null;
  unit: string;
  closes_at: string;
  is_private: boolean;
  is_test: boolean;
  products: { name: string; image_url: string | null; pack_size: string | null } | null;
};

/** Reads public pool data on the server (no session), for metadata and the sitemap */
async function rest<T>(query: string): Promise<T | undefined> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return undefined;
  try {
    const res = await fetch(`${url}/rest/v1/${query}`, {
      headers: { apikey: key },
      next: { revalidate: 300 },
    });
    return res.ok ? ((await res.json()) as T) : undefined;
  } catch {
    return undefined;
  }
}

const PUBLIC_POOL =
  "id,status,price,reference_price,unit,closes_at,is_private,is_test,products(name,image_url,pack_size)";

/** A deal anyone can see, or undefined (not found, private, test, or the database is down) */
export async function getPublicPool(id: string): Promise<PublicPool | undefined> {
  if (!isUuid(id)) return undefined;
  const rows = await rest<PublicPool[]>(`pools?id=eq.${id}&select=${PUBLIC_POOL}`);
  return rows?.[0];
}

/** Public deals shops can join now or soon, for the sitemap */
export async function getOpenPools() {
  return (
    (await rest<{ id: string; created_at: string }[]>(
      "pools?status=in.(open,scheduled)&is_private=eq.false&is_test=eq.false&select=id,created_at",
    )) ?? []
  );
}
