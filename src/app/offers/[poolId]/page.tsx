import type { Metadata } from "next";
import { supabase } from "@/integrations/supabase/client";
import { dateTime, money, savings } from "@/lib/format";
import { OG_IMAGE } from "@/lib/site";
import { POOL_STATUS } from "@/lib/status";
import { Offer } from "@/views/offer";

type Props = { params: Promise<{ poolId: string }> };

const fallback: Metadata = {
  title: "Deal details",
  description: "See price, pool progress and closing time, then join the pool.",
  openGraph: {
    title: "Join this KasiPool deal",
    description: "Pool with other local businesses to get a better bulk price.",
    images: [OG_IMAGE],
  },
};

// The deal renders in the browser, so link previews (WhatsApp) only see what is fetched here.
async function getDeal(poolId: string) {
  try {
    const { data } = await supabase
      .from("pools")
      .select("price, reference_price, unit, status, closes_at, products(name, image_url)")
      .eq("id", poolId)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { poolId } = await params;
  const pool = await getDeal(poolId);
  const name = pool?.products?.name;
  if (!pool || !name) return { ...fallback, alternates: { canonical: `/offers/${poolId}` } };

  const s = savings(Number(pool.price), pool.reference_price ? Number(pool.reference_price) : null);
  const save = s ? ` (save ${money(s.amount)})` : "";
  const title = `${name}: ${money(pool.price)} per ${pool.unit}${save}`;
  const when =
    pool.status === "open"
      ? `Closes ${dateTime(pool.closes_at)}.`
      : `${POOL_STATUS[pool.status]?.customer ?? "Deal"}.`;
  const description = `${when} Pool with other local businesses to get the bulk price.`;
  const image = pool.products?.image_url;

  return {
    title,
    description,
    alternates: { canonical: `/offers/${poolId}` },
    openGraph: {
      title: `${title} | KasiPool`,
      description,
      type: "website",
      images: image ? [{ url: image, alt: name }] : [OG_IMAGE],
    },
  };
}

export default function Page() {
  return <Offer />;
}
