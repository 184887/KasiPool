import { Link } from "@tanstack/react-router";
import { Clock, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { money, savings, dateTime } from "@/lib/format";
import { POOL_STATUS } from "@/lib/status";
import { StatusBadge } from "./ui";
import { PoolProgress, Countdown } from "./pool-bits";

export type PoolWithProduct = {
  id: string;
  status: string;
  unit: string;
  price: number;
  reference_price: number | null;
  min_qty: number;
  pledged_qty: number;
  participant_count: number;
  closes_at: string;
  products: { name: string; pack_size: string | null; image_url: string | null } | null;
};

export function whatsappShareUrl(p: PoolWithProduct) {
  const s = savings(p.price, p.reference_price);
  const link =
    typeof window !== "undefined" ? `${window.location.origin}/offers/${p.id}` : `/offers/${p.id}`;
  const msg = [
    `KasiPool offer: ${p.products?.name ?? ""}.`,
    `${money(p.price)} per ${p.unit}${s ? ` (potential saving ${money(s.amount)} vs reference price)` : ""}.`,
    `Pool closes ${dateTime(p.closes_at)}.`,
    `Pool with other local businesses to get a better bulk price. View the offer: ${link}`,
  ].join(" ");
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

export function PoolCard({ pool }: { pool: PoolWithProduct }) {
  const s = savings(Number(pool.price), pool.reference_price ? Number(pool.reference_price) : null);
  const st = POOL_STATUS[pool.status];
  const open = pool.status === "open";
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition-shadow hover:shadow-lift">
      <Link
        to="/offers/$poolId"
        params={{ poolId: pool.id }}
        className="relative block aspect-[4/3] overflow-hidden bg-muted"
      >
        {pool.products?.image_url && (
          <img
            src={pool.products.image_url}
            alt={pool.products.name}
            loading="lazy"
            width={816}
            height={816}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <StatusBadge className="absolute right-3 top-3" tone={st?.tone ?? "muted"}>
          {st?.customer}
        </StatusBadge>
        {s && (
          <span className="absolute bottom-3 right-3 rounded-lg bg-gold px-2 py-1 text-xs font-extrabold text-gold-foreground shadow">
            Potential saving {money(s.amount)}
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
          <span className="font-display text-[28px] font-extrabold leading-8 text-primary tabular">
            {money(pool.price)}
          </span>
          {s && (
            <span className="text-sm text-muted-foreground line-through tabular">
              {money(pool.reference_price)}
            </span>
          )}
          {s && <span className="text-xs font-semibold text-success">−{s.pct.toFixed(1)}%</span>}
        </div>
        <PoolProgress
          pledged={pool.pledged_qty}
          target={pool.min_qty}
          participants={pool.participant_count}
          unit={pool.unit}
          size="sm"
        />
        {open && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-4" aria-hidden="true" /> Closes in{" "}
            <Countdown to={pool.closes_at} className="font-semibold text-foreground" />
          </p>
        )}
        <div className="mt-auto flex gap-2 pt-1">
          <Button asChild className="flex-1" variant={open ? "default" : "outline"}>
            <Link to="/offers/$poolId" params={{ poolId: pool.id }}>
              {open ? "Join Pool" : "View offer"}
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon" aria-label="Share via WhatsApp">
            <a href={whatsappShareUrl(pool)} target="_blank" rel="noopener noreferrer">
              <Share2 />
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}
