"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, Truck, Share2, Info, PartyPopper, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Container } from "@/components/kp/AppShell";
import { whatsappShareUrl } from "@/components/kp/PoolCard";
import { PoolProgress, Countdown, QuantityStepper } from "@/components/kp/pool-bits";
import { Loading, EmptyState, StatusBadge, Section } from "@/components/kp/ui";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { poolQuery, errMsg } from "@/lib/queries";
import { money, savings, dateTime, date } from "@/lib/format";
import { POOL_STATUS } from "@/lib/status";
import { shopZoneId } from "@/lib/delivery";

const PENDING = "kp-pending-join";

export function Offer() {
  const { poolId } = useParams<{ poolId: string }>();
  const { data: pool, isLoading } = useQuery(poolQuery(poolId));
  const { user, business, businessLoading } = useAuth();
  const nav = useRouter();
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<{ qty: number; updated: boolean } | null>(null);

  const mine = useQuery({
    queryKey: ["my-participation", poolId, user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("participations")
          .select("*")
          .eq("pool_id", poolId)
          .eq("user_id", user!.id)
          .maybeSingle()
      ).data,
  });
  const active = mine.data?.status === "active" ? mine.data : null;
  // A converted participation means the shop already has an order in this pool
  const ordered = mine.data?.status === "converted";
  const activeQuantity = active?.quantity;

  useEffect(() => {
    if (pool) setQty((q) => Math.max(q, pool.min_per_customer));
  }, [pool]);
  useEffect(() => {
    if (activeQuantity !== undefined) setQty(activeQuantity);
  }, [activeQuantity]);
  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING);
    if (raw) {
      const p = JSON.parse(raw);
      if (p.poolId === poolId) setQty(p.qty);
    }
  }, [poolId]);

  if (isLoading) return <Loading />;
  if (!pool)
    return (
      <Container>
        <EmptyState
          title="Deal not found"
          action={
            <Button asChild>
              <Link href="/offers">See deals</Link>
            </Button>
          }
        />
      </Container>
    );

  const s = savings(Number(pool.price), pool.reference_price ? Number(pool.reference_price) : null);
  const st = POOL_STATUS[pool.status];
  const open = pool.status === "open" && !pool.is_sample;
  const maxQty = pool.max_per_customer ?? 999;
  const zones = pool.pool_zones.flatMap((pz) => (pz.delivery_zones ? [pz.delivery_zones] : []));
  const myZone = zones.find((z) => z.id === shopZoneId(business));
  const outOfArea = !!business && zones.length > 0 && !myZone;

  async function join() {
    if (!user) {
      sessionStorage.setItem(PENDING, JSON.stringify({ poolId, qty }));
      nav.push(`/auth?redirect=${encodeURIComponent(`/offers/${poolId}`)}`);
      return;
    }
    if (!business) {
      sessionStorage.setItem(PENDING, JSON.stringify({ poolId, qty }));
      nav.push(`/onboarding?redirect=${encodeURIComponent(`/offers/${poolId}`)}`);
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.rpc("join_pool", { _pool: poolId, _qty: qty });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    sessionStorage.removeItem(PENDING);
    const updated =
      typeof data === "object" && data !== null && !Array.isArray(data) && data.updated === true;
    setSuccess({ qty, updated });
    qc.invalidateQueries();
  }

  async function withdraw() {
    if (!confirm("Withdraw your interest from this pool?")) return;
    const { error } = await supabase.rpc("withdraw_from_pool", { _pool: poolId });
    if (error) return toast.error(errMsg(error));
    toast.success("You've withdrawn from this pool.");
    qc.invalidateQueries();
  }

  return (
    <Container className="max-w-5xl">
      <Link
        href="/offers"
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> All deals
      </Link>
      {pool.is_sample && (
        <div className="mb-4 rounded-md border-2 border-ink bg-sun p-4 text-ink">
          <p className="font-display text-lg font-bold">This is a sample deal</p>
          <p className="text-sm">
            It shows how KasiPool works. The prices and progress are examples, and you can&apos;t
            join it.
          </p>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
        <div>
          <div className="relative overflow-hidden rounded-md border-2 border-ink bg-muted">
            {pool.products?.image_url ? (
              <img
                src={pool.products.image_url}
                alt={pool.products.name}
                className="aspect-square w-full object-cover"
                width={816}
                height={816}
              />
            ) : (
              <div className="aspect-square w-full" />
            )}
            <StatusBadge className="absolute left-4 top-4" tone={st.tone}>
              {st.customer}
            </StatusBadge>
          </div>
          <div className="mt-4">
            {pool.campaigns?.name && (
              <p className="text-sm font-bold text-ember">{pool.campaigns.name}</p>
            )}
            <h1 className="font-headline text-4xl sm:text-5xl">{pool.products?.name}</h1>
            <p className="text-muted-foreground">
              {pool.products?.brand} · {pool.products?.pack_size} · sold per {pool.unit}
            </p>
            <p className="mt-2 text-sm">{pool.products?.description}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Section>
            <p className="text-sm text-muted-foreground">KasiPool price per {pool.unit}</p>
            {pool.price == null ? (
              <p className="font-display text-2xl font-bold">Price to be confirmed</p>
            ) : (
              <p className="font-headline text-6xl tabular">{money(pool.price)}</p>
            )}
            {s ? (
              <div className="mt-3 rounded-md bg-leaf-soft p-3 text-sm">
                <p>
                  Supplier list price: <b className="tabular">{money(pool.reference_price)}</b>
                </p>
                <p className="font-bold text-leaf">
                  Potential saving: {money(s.amount)} per {pool.unit} ({s.pct.toFixed(2)}%)
                </p>
                {pool.reference_source && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Source: {pool.reference_source}
                    {pool.reference_date && ` (${date(pool.reference_date)})`}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                No verified reference price available, so no saving is claimed.
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Fees: {pool.fee_note || "No additional fees"} · delivery fee depends on your area
            </p>
          </Section>

          <Section>
            <PoolProgress
              pledged={pool.pledged_qty}
              target={pool.min_qty}
              participants={pool.participant_count}
              unit={pool.unit}
              size="lg"
            />
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-muted p-3">
                <p className="text-muted-foreground">Minimum target</p>
                <p className="font-bold">
                  {pool.min_qty} {pool.unit}s
                </p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-muted-foreground">Closes</p>
                <p className="font-bold">{dateTime(pool.closes_at)}</p>
              </div>
            </div>
            {open && (
              <p className="mt-3 flex items-center gap-2 font-semibold">
                <Clock className="size-4" aria-hidden="true" />{" "}
                <Countdown to={pool.closes_at} className="text-lg" /> left (SAST)
              </p>
            )}
            {pool.pledged_qty >= pool.min_qty && (
              <p className="mt-3 flex items-start gap-2 rounded-md bg-gold-soft p-3 text-sm text-ink">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  {pool.status === "open"
                    ? "The requested quantity has reached the target. Joining is still interest, not a payment. KasiPool checks the deal when it closes."
                    : "The deal has closed at its target. KasiPool is checking the conditions. Nothing has been purchased or charged yet."}
                </span>
              </p>
            )}
            {open && pool.reopened_at && (
              <p className="mt-3 rounded-md bg-gold-soft p-3 text-sm text-ink">
                <b>Open again to fill the gap.</b> Some shops didn&apos;t pay, so this deal needs{" "}
                {Math.max(pool.min_qty - pool.pledged_qty, 0)} more {pool.unit}(s) by{" "}
                {dateTime(pool.closes_at)}.
              </p>
            )}
            {pool.status === "unsuccessful" && (
              <p className="mt-3 rounded-md bg-destructive-soft p-3 text-sm text-destructive">
                {pool.outcome_note ?? "This deal did not reach its target."} No payment is required.
              </p>
            )}
          </Section>

          {open && ordered && (
            <Section>
              <p className="text-sm">
                You already have an order in this deal.{" "}
                <Link href="/my-pools" className="font-semibold text-ember underline">
                  See My Pools
                </Link>
              </p>
            </Section>
          )}

          {open && !ordered && (
            <Section>
              {active && (
                <p className="mb-3 rounded-md bg-leaf-soft p-3 text-sm font-semibold text-leaf">
                  You're in this pool with {active.quantity} {pool.unit}(s). Change your quantity
                  below.
                </p>
              )}
              <p className="mb-2 font-display text-lg font-bold">How many {pool.unit}s?</p>
              <div className="flex flex-wrap items-center gap-4">
                <QuantityStepper
                  value={qty}
                  onChange={setQty}
                  min={pool.min_per_customer}
                  max={maxQty}
                />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {qty} × {money(pool.price)}
                  </p>
                  <p className="font-headline text-3xl tabular">
                    {money(qty * Number(pool.price))}
                  </p>
                  <p className="text-xs text-muted-foreground">Potential order value</p>
                </div>
              </div>
              {pool.max_per_customer && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Maximum {pool.max_per_customer} per business.
                </p>
              )}
              <Button
                size="xl"
                variant="gold"
                className="mt-4 w-full"
                onClick={join}
                disabled={busy || businessLoading || outOfArea}
              >
                {outOfArea
                  ? "Not delivered to your area"
                  : busy
                    ? "Saving…"
                    : active
                      ? "Update my quantity"
                      : "Join this pool"}
              </Button>
              {active && (
                <Button variant="ghost" className="mt-2 w-full text-destructive" onClick={withdraw}>
                  Withdraw my interest
                </Button>
              )}
              <p className="mt-3 flex gap-2 text-xs text-muted-foreground">
                <Info className="size-4 shrink-0" /> Joining only shows interest. No payment is
                required now. You'll be asked to confirm and pay only if the pool qualifies. Subject
                to the deal terms and supplier availability.
              </p>
            </Section>
          )}

          <Section title="Delivery">
            <p className="flex gap-2 text-sm">
              <Truck className="size-4 shrink-0" aria-hidden="true" />
              <span>
                Delivered to your shop by our courier partner once the stock arrives. Delivers to:{" "}
                <b>{zones.map((z) => z.name).join(", ") || "-"}</b>
              </span>
            </p>
            {myZone ? (
              <p className="mt-2 text-sm">
                Delivery fee to {myZone.name}: <b>{money(myZone.delivery_fee)}</b> per order, added
                when you confirm.
              </p>
            ) : (
              business &&
              zones.length > 0 && (
                <p className="mt-2 rounded-md bg-warning-soft p-3 text-sm text-warning">
                  This deal doesn&apos;t deliver to your area yet.{" "}
                  <Link href="/profile" className="font-semibold underline">
                    Check your delivery address
                  </Link>
                </p>
              )
            )}
            {pool.is_private && pool.invite_code && (
              <div className="mt-2 rounded-md bg-muted p-3 text-sm">
                <p className="font-semibold">Private group, invite code {pool.invite_code}</p>
                <p className="text-xs text-muted-foreground">
                  Share this link:{" "}
                  {`${typeof window !== "undefined" ? window.location.origin : ""}/join/${pool.invite_code}`}
                </p>
              </div>
            )}
          </Section>

          <Button asChild variant="outline" className="w-full" size="lg">
            <a href={whatsappShareUrl(pool)} target="_blank" rel="noopener noreferrer">
              <Share2 /> Share on WhatsApp
            </a>
          </Button>
        </div>
      </div>

      <Dialog open={!!success} onOpenChange={(o) => !o && setSuccess(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-gold animate-pop">
              <PartyPopper className="size-7 text-ink" />
            </div>
            <DialogTitle className="text-center font-headline text-3xl font-normal">
              {success?.updated ? "Quantity updated!" : "You've joined the pool!"}
            </DialogTitle>
            <DialogDescription className="text-center">
              You've registered interest in {success?.qty} {pool.unit}(s) of{" "}
              {pool.products?.name.toLowerCase()}. We'll let you know when the pool qualifies and
              it's time to confirm your order.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-center">
            <Button asChild size="lg">
              <Link href="/my-pools">Open My Pools</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/offers">See more deals</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
