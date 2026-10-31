import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Offer } from "@/views/offer";
import { money, savings } from "@/lib/format";
import { isUuid } from "@/lib/utils";
import { getPublicPool, OG_IMAGE } from "@/lib/site";

type Props = { params: Promise<{ poolId: string }> };

const FALLBACK: Metadata = {
  title: "Deal details",
  description: "See price, pool progress and closing time, then join the pool.",
  openGraph: {
    title: "Join this KasiPool deal",
    description: "Pool with other local businesses to get a better bulk price.",
    images: [OG_IMAGE],
  },
};

const closes = (v: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg",
    day: "numeric",
    month: "long",
  }).format(new Date(v));

/** The deal's name, price and picture, so a link shared on WhatsApp shows them */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { poolId } = await params;
  const pool = await getPublicPool(poolId);
  const name = pool?.products?.name;
  // Private, test and draft deals can't be read without a session: the page still opens for
  // shops allowed to see them, but search engines should not keep it
  if (!pool || !name) return { ...FALLBACK, robots: { index: false } };
  const s = savings(Number(pool.price), pool.reference_price ? Number(pool.reference_price) : null);
  const title = `${name}: ${money(pool.price)} a ${pool.unit}${s ? ` (save ${money(s.amount)})` : ""}`;
  const description =
    pool.status === "open" || pool.status === "scheduled"
      ? `Pool with other local businesses for a better price. Join before ${closes(pool.closes_at)}.`
      : "Pool with other local businesses to get a better bulk price.";
  const image = pool.products?.image_url;
  return {
    title,
    description,
    alternates: { canonical: `/offers/${pool.id}` },
    robots: pool.is_private || pool.is_test ? { index: false } : undefined,
    openGraph: {
      title,
      description,
      type: "website",
      url: `/offers/${pool.id}`,
      images: image ? [{ url: image, alt: name }] : [OG_IMAGE],
    },
  };
}

export default async function Page({ params }: Props) {
  // A link cut short in a chat: a real 404 instead of an empty deal page
  if (!isUuid((await params).poolId)) notFound();
  return <Offer />;
}
