"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, Truck, Share2, Info, PartyPopper, ArrowLeft, MapPin, Copy } from "lucide-react";
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
import { useConfirm } from "@/components/kp/ConfirmDialog";
import { whatsappShareUrl } from "@/components/kp/PoolCard";
import { PoolProgress, Countdown, QuantityStepper, ProductImage } from "@/components/kp/pool-bits";
import { Loading, EmptyState, StatusBadge, Section } from "@/components/kp/ui";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { poolQuery, errMsg, poolDistancesQuery, settingsQuery } from "@/lib/queries";
import { money, savings, dateTime, date, plural } from "@/lib/format";
import { POOL_STATUS } from "@/lib/status";
import { DEFAULT_RADIUS_KM } from "@/lib/delivery";
import { useT } from "@/i18n";

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
  const distances = useQuery(poolDistancesQuery(user?.id));
  const settings = useQuery(settingsQuery);
  const [ask, confirmDialog] = useConfirm();
  const { t, rich, server, qty: qtyOf } = useT();

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
          title={t("Deal not found")}
          action={
            <Button asChild>
              <Link href="/offers">{t("See deals")}</Link>
            </Button>
          }
        />
      </Container>
    );

  const s = savings(Number(pool.price), pool.reference_price ? Number(pool.reference_price) : null);
  const st = POOL_STATUS[pool.status];
  const open = pool.status === "open" && !pool.is_sample;
  const maxQty = pool.max_per_customer ?? 999;
  const dist = distances.data?.get(pool.id);
  const tooFar = !!dist && !dist.in_range;
  // Joining needs to know roughly where the stock goes: the exact pin, or else the area's centre.
  // The exact pin is only needed to confirm an order.
  const noPin =
    !!business &&
    (business.deliver_to === "other"
      ? business.delivery_latitude == null && business.delivery_approx_latitude == null
      : business.latitude == null && business.approx_latitude == null);
  const fee = Number(settings.data?.delivery?.fee_per_order ?? 0);

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
    if (error) return toast.error(server(errMsg(error)));
    sessionStorage.removeItem(PENDING);
    const updated =
      typeof data === "object" && data !== null && !Array.isArray(data) && data.updated === true;
    setSuccess({ qty, updated });
    qc.invalidateQueries();
  }

  async function withdraw() {
    const ok = await ask({
      title: t("Leave this pool?"),
      body: t("Your place in the pool goes. You can join again while it is open."),
      confirmLabel: t("Leave pool"),
      cancelLabel: t("Stay in"),
      danger: true,
    });
    if (ok === false) return;
    const { error } = await supabase.rpc("withdraw_from_pool", { _pool: poolId });
    if (error) return toast.error(server(errMsg(error)));
    toast.success(t("You've left this pool."));
    qc.invalidateQueries();
  }

  return (
    <Container className="max-w-5xl">
      <Link
        href="/offers"
        className="mb-1 -ml-2 inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> {t("All deals")}
      </Link>
      {pool.is_sample && (
        <div className="mb-4 rounded-md border-2 border-ink bg-sun p-4 text-ink">
          <p className="font-display text-lg font-bold">{t("This is a sample deal")}</p>
          <p className="text-sm">
            {t("It shows how KasiPool works. The prices are examples. You can't join it.")}
          </p>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
        <div>
          <div className="relative overflow-hidden rounded-md border-2 border-ink bg-muted">
            <ProductImage
              src={pool.products?.image_url}
              name={pool.products?.name}
              className="aspect-square w-full object-cover"
              initialsClassName="text-8xl"
              width={816}
              height={816}
            />
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
              {pool.products?.brand} · {pool.products?.pack_size} ·{" "}
              {t("sold per {unit}", { unit: t(pool.unit) })}
            </p>
            <p className="mt-2 text-sm">{pool.products?.description}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Section>
            <p className="text-sm text-muted-foreground">
              {t("KasiPool price per {unit}", { unit: t(pool.unit) })}
            </p>
            {pool.price == null ? (
              <p className="font-display text-2xl font-bold">{t("Price to be confirmed")}</p>
            ) : (
              <p className="font-headline text-6xl tabular">{money(pool.price)}</p>
            )}
            {s ? (
              <div className="mt-3 rounded-md bg-leaf-soft p-3 text-sm">
                <p>
                  {t("Normal price:")} <b className="tabular">{money(pool.reference_price)}</b>
                </p>
                <p className="font-bold text-leaf">
                  {t("You save {amount} per {unit} ({pct}%)", {
                    amount: money(s.amount),
                    unit: t(pool.unit),
                    pct: Math.round(s.pct),
                  })}
                </p>
                {pool.reference_source && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("Source:")} {pool.reference_source}
                    {pool.reference_date && ` (${date(pool.reference_date)})`}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                {t("We don't know the normal price, so we can't show a saving.")}
              </p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              {t("Other fees:")}{" "}
              {!pool.fee_note || /^no (additional|other) fees$/i.test(pool.fee_note)
                ? t("none")
                : pool.fee_note}
              .
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
                <p className="text-muted-foreground">{t("Needed in total")}</p>
                <p className="font-bold">{qtyOf(pool.min_qty, pool.unit)}</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-muted-foreground">{t("Closes")}</p>
                <p className="font-bold">{dateTime(pool.closes_at)}</p>
              </div>
            </div>
            {open && (
              <p className="mt-3 flex items-center gap-2 font-semibold">
                <Clock className="size-4" aria-hidden="true" />{" "}
                <Countdown to={pool.closes_at} className="text-lg" /> {t("left")}
              </p>
            )}
            {pool.pledged_qty >= pool.min_qty && (
              <p className="mt-3 flex items-start gap-2 rounded-md bg-gold-soft p-3 text-sm text-ink">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  {pool.status === "open"
                    ? t("The pool is full. It is closing now.")
                    : t("The pool is full. Businesses are now confirming their orders.")}
                </span>
              </p>
            )}
            {open && pool.reopened_at && (
              <p className="mt-3 rounded-md bg-gold-soft p-3 text-sm text-ink">
                {rich(
                  "<b>Open again.</b> Some businesses did not confirm their orders. This deal needs {qty} more by {date}.",
                  { b: (c) => <b>{c}</b> },
                  {
                    qty: qtyOf(Math.max(pool.min_qty - pool.pledged_qty, 0), pool.unit),
                    date: dateTime(pool.closes_at),
                  },
                )}
              </p>
            )}
            {pool.status === "unsuccessful" && (
              <p className="mt-3 rounded-md bg-destructive-soft p-3 text-sm text-destructive">
                {t("Not enough businesses joined in time. You do not need to pay.")}
              </p>
            )}
          </Section>

          {open && ordered && (
            <Section>
              <p className="text-sm">
                {t("You already have an order in this deal.")}{" "}
                <Link href="/my-pools" className="font-semibold text-ember underline">
                  {t("See My Pools")}
                </Link>
              </p>
            </Section>
          )}

          {open && !ordered && (
            <Section>
              {active && (
                <p className="mb-3 rounded-md bg-leaf-soft p-3 text-sm font-semibold text-leaf">
                  {t("You are in this pool with {qty}. You can change the number below.", {
                    qty: qtyOf(active.quantity, pool.unit),
                  })}
                </p>
              )}
              <p className="mb-2 font-display text-lg font-bold">
                {t("How many {units}?", { units: t(plural(pool.unit)) })}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <QuantityStepper
                  value={qty}
                  onChange={setQty}
                  min={pool.min_per_customer}
                  max={maxQty}
                />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {qty} × {money(pool.price)}
                  </p>
                  <p className="font-headline text-3xl tabular">
                    {money(qty * Number(pool.price))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("Your total if the pool fills up")}
                  </p>
                </div>
              </div>
              {pool.max_per_customer && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("You can order up to {qty}.", {
                    qty: qtyOf(pool.max_per_customer, pool.unit),
                  })}
                </p>
              )}
              <Button
                size="xl"
                variant="gold"
                className="mt-4 w-full"
                onClick={join}
                disabled={busy || businessLoading || tooFar || noPin}
              >
                {tooFar
                  ? t("Too far for you")
                  : noPin
                    ? t("Add your area first")
                    : busy
                      ? t("Saving…")
                      : active
                        ? t("Change my order")
                        : t("Join this pool")}
              </Button>
              {active && (
                <Button variant="ghost" className="mt-2 w-full text-destructive" onClick={withdraw}>
                  {t("Leave this pool")}
                </Button>
              )}
              <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  {t(
                    "You do not pay now. When the pool is full, we ask you to confirm your order. You pay when your stock arrives. The deal also depends on the supplier having stock.",
                  )}
                </span>
              </p>
            </Section>
          )}

          <Section title={t("Delivery")}>
            <p className="flex gap-2 text-sm">
              <Truck className="size-4 shrink-0" aria-hidden="true" />
              <span>
                {t("A courier brings the stock to your business.")}{" "}
                {fee > 0 ? (
                  rich(
                    "Delivery costs <b>{fee}</b> per order. We add it to your total.",
                    { b: (c) => <b>{c}</b> },
                    { fee: money(fee) },
                  )
                ) : (
                  <b>{t("Delivery is free.")}</b>
                )}
              </span>
            </p>
            {!pool.is_private && (
              <p className="mt-2 flex gap-2 text-sm">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                <span>
                  {t(
                    "Only businesses close to each other can join, so the driver can deliver to all of them.",
                  )}{" "}
                  {dist
                    ? rich(
                        dist.distance_km < 1
                          ? "This deal is for businesses within <b>{radius} km</b>. You are <b>under 1 km</b> away."
                          : "This deal is for businesses within <b>{radius} km</b>. You are <b>{km} km</b> away.",
                        { b: (c) => <b>{c}</b> },
                        { radius: dist.radius_km, km: dist.distance_km },
                      )
                    : t("Most deals are for businesses within {km} km.", { km: DEFAULT_RADIUS_KM })}
                </span>
              </p>
            )}
            {tooFar && (
              <p className="mt-2 rounded-md bg-warning-soft p-3 text-sm text-warning">
                {t("This deal is too far from you.")}{" "}
                <Link href="/offers" className="font-semibold underline">
                  {t("See deals near you")}
                </Link>{" "}
                {t("or")}{" "}
                <Link
                  href={`/start-pool?product=${pool.product_id}`}
                  className="font-semibold underline"
                >
                  {t("ask for this deal near you")}
                </Link>
                .
              </p>
            )}
            {noPin && (
              <p className="mt-2 rounded-md bg-warning-soft p-3 text-sm text-warning">
                {t("Please add your township or area in your profile first.")}{" "}
                <Link href="/profile" className="font-semibold underline">
                  {t("Go to your profile")}
                </Link>
              </p>
            )}
            {pool.is_private && pool.invite_code && (
              <div className="mt-2 flex items-center gap-3 rounded-md bg-muted p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {t("Private group, code {code}", { code: pool.invite_code })}
                  </p>
                  <p className="break-all text-muted-foreground">
                    {`${typeof window !== "undefined" ? window.location.origin : ""}/join/${pool.invite_code}`}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label={t("Copy the invite link")}
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/join/${pool.invite_code}`,
                    );
                    toast.success(t("Link copied. Send it to the businesses in your group."));
                  }}
                >
                  <Copy />
                </Button>
              </div>
            )}
          </Section>

          <Button asChild variant="outline" className="w-full" size="lg">
            <a href={whatsappShareUrl(pool, t)} target="_blank" rel="noopener noreferrer">
              <Share2 /> {t("Share on WhatsApp")}
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
              {success?.updated ? t("Order changed!") : t("You joined the pool!")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t(
                "You are in for {qty} of {product}. When the pool is full, we will tell you. Then you confirm your order. You pay when your stock arrives.",
                { qty: qtyOf(success?.qty ?? 0, pool.unit), product: pool.products?.name ?? "" },
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-center">
            <Button asChild size="lg">
              <Link href="/my-pools">{t("Open My Pools")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/offers">{t("See more deals")}</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </Container>
  );
}
