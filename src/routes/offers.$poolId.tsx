import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, MapPin, Share2, Info, PartyPopper, ArrowLeft } from "lucide-react";
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

export const Route = createFileRoute("/offers/$poolId")({
  head: () => ({
    meta: [
      { title: "Offer details — KasiPool" },
      {
        name: "description",
        content: "See price, pool progress and closing time, then join the pool.",
      },
      { property: "og:title", content: "Join this KasiPool deal" },
      {
        property: "og:description",
        content: "Pool with other local businesses to get a better bulk price.",
      },
    ],
  }),
  component: Offer,
});

const PENDING = "kp-pending-join";

function Offer() {
  const { poolId } = Route.useParams();
  const { data: pool, isLoading } = useQuery(poolQuery(poolId));
  const { user, business, businessLoading } = useAuth();
  const nav = useNavigate();
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
          title="Offer not found"
          action={
            <Button asChild>
              <Link to="/offers">Browse offers</Link>
            </Button>
          }
        />
      </Container>
    );

  const s = savings(Number(pool.price), pool.reference_price ? Number(pool.reference_price) : null);
  const st = POOL_STATUS[pool.status];
  const open = pool.status === "open";
  const maxQty = pool.max_per_customer ?? 999;

  async function join() {
    if (!user) {
      sessionStorage.setItem(PENDING, JSON.stringify({ poolId, qty }));
      nav({ to: "/auth", search: { redirect: `/offers/${poolId}` } });
      return;
    }
    if (!business) {
      sessionStorage.setItem(PENDING, JSON.stringify({ poolId, qty }));
      nav({ to: "/onboarding", search: { redirect: `/offers/${poolId}` } });
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
        to="/offers"
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> All offers
      </Link>
      <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
        <div>
          <div className="relative overflow-hidden rounded-3xl bg-muted">
            <img
              src={pool.products?.image_url ?? ""}
              alt={pool.products?.name ?? ""}
              className="aspect-square w-full object-cover"
              width={816}
              height={816}
            />
            <StatusBadge className="absolute right-4 top-4" tone={st.tone}>
              {st.customer}
            </StatusBadge>
          </div>
          <div className="mt-4">
            {pool.campaigns?.name && (
              <p className="text-xs font-semibold uppercase tracking-wide text-gold-foreground">
                {pool.campaigns.name}
              </p>
            )}
            <h1 className="font-display text-3xl font-bold">{pool.products?.name}</h1>
            <p className="text-muted-foreground">
              {pool.products?.brand} · {pool.products?.pack_size} · sold per {pool.unit}
            </p>
            <p className="mt-2 text-sm">{pool.products?.description}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Section>
            <p className="text-sm text-muted-foreground">KasiPool price per {pool.unit}</p>
            <p className="font-display text-4xl font-extrabold text-primary tabular">
              {money(pool.price)}
            </p>
            {s ? (
              <div className="mt-3 rounded-xl bg-gold-soft p-3 text-sm">
                <p>
                  Reference price: <b className="tabular">{money(pool.reference_price)}</b>
                </p>
                <p className="font-bold text-gold-foreground">
                  Potential saving: {money(s.amount)} per {pool.unit} ({s.pct.toFixed(2)}%)
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Source: {pool.reference_source} ({date(pool.reference_date)})
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                No verified reference price available, so no saving is claimed.
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Fees: {pool.fee_note || "No additional fees"} · {pool.collection_points?.fee_note}
            </p>
          </Section>

          <Section className="border-primary/20">
            <PoolProgress
              pledged={pool.pledged_qty}
              target={pool.min_qty}
              participants={pool.participant_count}
              unit={pool.unit}
              size="lg"
            />
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-muted p-3">
                <p className="text-muted-foreground">Minimum target</p>
                <p className="font-bold">
                  {pool.min_qty} {pool.unit}s
                </p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-muted-foreground">Closes</p>
                <p className="font-bold">{dateTime(pool.closes_at)}</p>
              </div>
            </div>
            {open && (
              <p className="mt-3 flex items-center gap-2 font-semibold">
                <Clock className="size-4 text-primary" />{" "}
                <Countdown to={pool.closes_at} className="text-lg" /> left (SAST)
              </p>
            )}
            {pool.pledged_qty >= pool.min_qty && (
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-info-soft p-3 text-sm text-info">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  {pool.status === "open"
                    ? "The requested quantity has reached the target. Joining is still interest, not a payment. KasiPool checks the offer when it closes."
                    : "The offer has closed at its target. KasiPool is checking the conditions. Nothing has been purchased or charged yet."}
                </span>
              </p>
            )}
            {pool.status === "unsuccessful" && (
              <p className="mt-3 rounded-lg bg-destructive-soft p-2 text-sm text-destructive">
                {pool.outcome_note ?? "This offer did not reach its target."} No payment is
                required.
              </p>
            )}
          </Section>

          {open && (
            <Section>
              {active && (
                <p className="mb-3 rounded-lg bg-primary-soft p-2 text-sm font-semibold text-primary">
                  You're in this pool with {active.quantity} {pool.unit}(s). Change your quantity
                  below.
                </p>
              )}
              <p className="mb-2 text-sm font-semibold">How many {pool.unit}s?</p>
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
                  <p className="font-display text-2xl font-bold tabular">
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
                className="mt-4 w-full"
                onClick={join}
                disabled={busy || businessLoading}
              >
                {busy ? "Saving…" : active ? "Update My Quantity" : "Join This Pool"}
              </Button>
              {active && (
                <Button variant="ghost" className="mt-2 w-full text-destructive" onClick={withdraw}>
                  Withdraw my interest
                </Button>
              )}
              <p className="mt-3 flex gap-2 text-xs text-muted-foreground">
                <Info className="size-4 shrink-0" /> Joining only shows interest. No payment is
                required now. You'll be asked to confirm and pay only if the pool qualifies. Subject
                to the offer terms and supplier availability.
              </p>
            </Section>
          )}

          <Section title="Collection">
            <p className="flex gap-2 text-sm">
              <MapPin className="size-4 shrink-0 text-primary" />
              <span>
                <b>{pool.collection_points?.name}</b>
                <br />
                {pool.collection_points?.area}
              </span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {pool.collection_points?.instructions}
            </p>
            {pool.is_private && pool.invite_code && (
              <div className="mt-2 rounded-lg bg-primary-soft p-3 text-sm">
                <p className="font-semibold">Private group — invite code {pool.invite_code}</p>
                <p className="text-xs text-muted-foreground">
                  Share this link:{" "}
                  {`${typeof window !== "undefined" ? window.location.origin : ""}/join/${pool.invite_code}`}
                </p>
              </div>
            )}
            {pool.collection_points?.latitude != null && !pool.is_private && (
              <p className="mt-2 text-xs text-muted-foreground">
                Open to businesses within {pool.max_distance_km} km of this collection point.
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Collection dates will be confirmed once stock has arrived.
            </p>
          </Section>

          <Button asChild variant="outline" className="w-full" size="lg">
            <a href={whatsappShareUrl(pool)} target="_blank" rel="noopener noreferrer">
              <Share2 /> Share via WhatsApp
            </a>
          </Button>
        </div>
      </div>

      <Dialog open={!!success} onOpenChange={(o) => !o && setSuccess(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-gold animate-pop">
              <PartyPopper className="size-7 text-gold-foreground" />
            </div>
            <DialogTitle className="text-center font-display text-2xl">
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
              <Link to="/my-pools">View My Pools</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/offers">Browse More Offers</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
