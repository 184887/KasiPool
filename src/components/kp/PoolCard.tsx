"use client";

import Link from "next/link";
import { Clock, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { money, savings, dateTime } from "@/lib/format";
import { POOL_STATUS } from "@/lib/status";
import { StatusBadge } from "./ui";
import { PoolProgress, Countdown, ProductImage } from "./pool-bits";

export type PoolWithProduct = {
  id: string;
  status: string;
  unit: string;
  /** Null only for unpublished drafts */
  price: number | null;
  reference_price: number | null;
  min_qty: number;
  pledged_qty: number;
  participant_count: number;
  closes_at: string;
  /** Example deal restored from the prototype: shown with a badge, can't be joined. */
  is_sample?: boolean;
  products: { name: string; pack_size: string | null; image_url: string | null } | null;
};

export function whatsappShareUrl(p: PoolWithProduct) {
  const s = savings(Number(p.price), p.reference_price);
  const link =
    typeof window !== "undefined" ? `${window.location.origin}/offers/${p.id}` : `/offers/${p.id}`;
  const msg = [
    `KasiPool deal: ${p.products?.name ?? ""}.`,
    `${money(p.price)} per ${p.unit}${s ? ` (you save ${money(s.amount)})` : ""}.`,
    `Closes ${dateTime(p.closes_at)}.`,
    `Order together with other shops and pay the bulk price. See the deal: ${link}`,
  ].join(" ");
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

export function PoolCard({ pool }: { pool: PoolWithProduct }) {
  const s = savings(Number(pool.price), pool.reference_price ? Number(pool.reference_price) : null);
  const st = POOL_STATUS[pool.status];
  const open = pool.status === "open" && !pool.is_sample;
  return (
    <article className="flex flex-col overflow-hidden rounded-md border-2 border-ink bg-card">
      <Link
        href={`/offers/${pool.id}`}
        className="relative block aspect-[4/3] overflow-hidden border-b-2 border-ink bg-white"
      >
        <ProductImage
          src={pool.products?.image_url}
          name={pool.products?.name}
          loading="lazy"
          width={816}
          height={816}
          className={
            pool.products?.image_url ? "size-full object-contain px-4 pb-10 pt-12" : "size-full"
          }
          initialsClassName="text-7xl"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {pool.is_sample && <SampleBadge />}
          <StatusBadge tone={st?.tone ?? "muted"}>{st?.customer}</StatusBadge>
        </div>
        {s && (
          <span className="absolute bottom-3 left-3 rounded-sm bg-leaf px-2 py-1 text-sm font-bold text-paper">
            Save {money(s.amount)}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-lg font-bold leading-tight">{pool.products?.name}</h3>
          <p className="text-sm text-muted-foreground">
            {pool.products?.pack_size} · per {pool.unit}
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-headline text-4xl tabular">{money(pool.price)}</span>
          {s && (
            <>
              <span className="text-sm text-muted-foreground line-through tabular">
                {money(pool.reference_price)}
              </span>
              <span className="text-sm font-bold text-leaf">-{Math.round(s.pct)}%</span>
            </>
          )}
        </div>
        <PoolProgress
          pledged={pool.pledged_qty}
          target={pool.min_qty}
          participants={pool.participant_count}
          unit={pool.unit}
          size="sm"
        />
        {pool.status === "open" && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-4" aria-hidden="true" /> Closes in{" "}
            <Countdown to={pool.closes_at} className="font-semibold text-ink" />
          </p>
        )}
        <div className="mt-auto flex gap-2 pt-1">
          <Button asChild className="flex-1" variant={open ? "gold" : "outline"}>
            <Link href={`/offers/${pool.id}`}>
              {open ? "Join pool" : pool.is_sample ? "View sample" : "View deal"}
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon" aria-label="Share on WhatsApp">
            <a href={whatsappShareUrl(pool)} target="_blank" rel="noopener noreferrer">
              <Share2 />
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-[26px] items-center rounded-sm bg-sun px-2 text-xs font-bold text-ink ${className ?? ""}`}
    >
      Sample deal
    </span>
  );
}
