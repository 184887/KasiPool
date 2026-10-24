"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Copy, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Container } from "@/components/kp/AppShell";
import { OrderTimeline, Countdown } from "@/components/kp/pool-bits";
import { Loading, EmptyState, StatusBadge, Section } from "@/components/kp/ui";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery, errMsg } from "@/lib/queries";
import { money, dateTime } from "@/lib/format";
import { PAYMENT_STATUS, ORDER_STATUS, timelineStep } from "@/lib/status";

export function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const qc = useQueryClient();
  const settings = useQuery(settingsQuery);
  const [paymentReturnStartedAt] = useState(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("payment") === "return"
      ? Date.now()
      : null,
  );
  const { data: o, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () =>
      (
        await supabase
          .from("orders")
          .select(
            "*, pools(*, products(name, image_url, pack_size), collection_points(*)), refunds(*)",
          )
          .eq("id", orderId)
          .maybeSingle()
      ).data,
    refetchInterval: (query) =>
      typeof window !== "undefined" &&
      paymentReturnStartedAt !== null &&
      Date.now() - paymentReturnStartedAt < 120_000 &&
      (query.state.data === undefined || query.state.data?.payment_status === "awaiting_payment")
        ? 2_000
        : false,
  });
  const [accept, setAccept] = useState(false);
  const [busy, setBusy] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);

  if (isLoading) return <Loading />;
  if (!o)
    return (
      <Container>
        <EmptyState title="Order not found" />
      </Container>
    );
  const pool = o.pools!;
  const pay = settings.data?.payment;
  const failed = ["declined", "expired", "cancelled", "failed"].includes(o.status)
    ? (o.failure_reason ?? ORDER_STATUS[o.status].label)
    : null;

  async function confirm() {
    setBusy(true);
    const { error } = await supabase.rpc("confirm_order", { _order: orderId, _accept: accept });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success("Order confirmed");
    qc.invalidateQueries();
  }
  async function decline() {
    if (!window.confirm("Decline this order? You won't be able to undo this.")) return;
    const { error } = await supabase.rpc("decline_order", { _order: orderId });
    if (error) return toast.error(errMsg(error));
    toast.success("Order declined");
    qc.invalidateQueries();
  }

  async function payOnline() {
    setPaymentBusy(true);
    const { data, error } = await supabase.functions.invoke("create-yoco-checkout", {
      body: { order_id: orderId },
    });
    setPaymentBusy(false);
    if (error) return toast.error(errMsg(error));
    if (typeof data?.redirect_url !== "string") {
      return toast.error("The payment provider did not return a checkout link");
    }
    window.location.assign(data.redirect_url);
  }

  return (
    <Container className="max-w-2xl space-y-4">
      <Link
        href="/my-pools"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> My Pools
      </Link>
      <div className="flex items-center gap-3">
        <img
          src={pool.products?.image_url ?? ""}
          alt=""
          className="size-16 rounded-xl object-cover"
          width={64}
          height={64}
        />
        <div>
          <h1 className="font-display text-2xl font-bold">{pool.products?.name}</h1>
          <p className="text-sm text-muted-foreground">
            {o.ref ? `Order ${o.ref}` : "Awaiting confirmation"}
          </p>
        </div>
      </div>

      {o.status === "awaiting_confirmation" && (
        <Section title="Confirm your order" className="border-2 border-gold">
          <p className="text-sm">The pool reached its target. Please review and confirm.</p>
          <dl className="mt-3 space-y-1.5 text-sm">
            <Row k="Product" v={`${pool.products?.name} (${pool.products?.pack_size})`} />
            <Row k="Quantity" v={`${o.quantity} ${pool.unit}(s)`} />
            <Row k="Final unit price" v={money(o.unit_price)} />
            <Row k="Order total" v={<b className="text-lg">{money(o.total)}</b>} />
            <Row k="Collection" v={pool.collection_points?.name ?? "—"} />
            <Row
              k="Confirm & pay by"
              v={
                <span>
                  {dateTime(pool.payment_deadline)} (<Countdown to={pool.payment_deadline!} />)
                </span>
              }
            />
          </dl>
          <p className="mt-3 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            By confirming you agree to buy this quantity at this price and to pay in full before the
            deadline. Stock is ordered only if enough businesses pay. If the pool is not funded, any
            payment is refunded. Your confirmed price will not change.
          </p>
          <label className="mt-3 flex items-start gap-3 text-sm">
            <Checkbox checked={accept} onCheckedChange={(v) => setAccept(!!v)} className="mt-0.5" />
            <span>
              I accept the{" "}
              <a href="/terms" target="_blank" className="font-semibold underline">
                purchase terms
              </a>{" "}
              ({settings.data?.terms?.version ?? "v0.1-draft"}).
            </span>
          </label>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="outline" size="lg" onClick={decline}>
              Decline
            </Button>
            <Button size="lg" onClick={confirm} disabled={!accept || busy}>
              {busy ? "Confirming…" : "Confirm My Order"}
            </Button>
          </div>
        </Section>
      )}

      {o.status === "confirmed" && o.payment_status !== "paid" && (
        <Section title="Payment">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <StatusBadge tone={PAYMENT_STATUS[o.payment_status].tone}>
              {PAYMENT_STATUS[o.payment_status].label}
            </StatusBadge>
          </div>
          <dl className="space-y-1.5 text-sm">
            <Row k="Order number" v={o.ref} />
            <Row
              k="Amount payable"
              v={<b className="text-lg">{money(Number(o.total) - Number(o.amount_paid))}</b>}
            />
            {Number(o.amount_paid) > 0 && <Row k="Verified so far" v={money(o.amount_paid)} />}
            <Row k="Payment deadline" v={dateTime(pool.payment_deadline)} />
          </dl>
          {pay?.online_enabled && (
            <div className="mt-4 rounded-xl border-2 border-primary/30 bg-primary-soft p-4">
              <p className="text-sm font-semibold">Pay securely online with Yoco</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your payment will be confirmed automatically after Yoco verifies it.
              </p>
              <Button className="mt-3 w-full" size="lg" onClick={payOnline} disabled={paymentBusy}>
                {paymentBusy
                  ? "Starting secure checkout…"
                  : `Pay ${money(Number(o.total) - Number(o.amount_paid))} with Yoco`}
              </Button>
            </div>
          )}
          {pay?.configured ? (
            <div className="mt-4 rounded-xl border-2 border-primary/30 bg-primary-soft p-4 text-sm">
              <p className="font-bold">{pay.method}</p>
              <dl className="mt-2 space-y-1">
                {pay.bank && <Row k="Bank" v={pay.bank} />}
                {pay.account_name && <Row k="Account name" v={pay.account_name} />}
                {pay.account_number && <Row k="Account number" v={pay.account_number} />}
                {pay.branch_code && <Row k="Branch code" v={pay.branch_code} />}
              </dl>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-card p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Use this payment reference</p>
                  <p className="font-display text-xl font-bold tabular">{o.payment_reference}</p>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Copy reference"
                  onClick={() => {
                    navigator.clipboard.writeText(o.payment_reference ?? "");
                    toast.success("Reference copied");
                  }}
                >
                  <Copy />
                </Button>
              </div>
              {pay.notes && <p className="mt-2 text-xs">{pay.notes}</p>}
              <p className="mt-2 text-xs text-muted-foreground">
                KasiPool staff verify every payment against our bank records. Your status will
                change to “Paid” once verified.
              </p>
            </div>
          ) : !pay?.online_enabled ? (
            <div className="mt-4 rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm text-warning">
              <b>Payment instructions are not yet available.</b> Please do not pay yet. KasiPool
              will notify you once official payment details have been set up.
            </div>
          ) : null}
        </Section>
      )}

      {o.fulfilment_status === "ready" && (
        <Section title="Ready for collection" className="border-2 border-success">
          <p className="text-sm">Show this code at the collection point:</p>
          <p className="my-3 rounded-xl bg-success-soft py-4 text-center font-display text-4xl font-extrabold tracking-[0.3em] text-success tabular">
            {o.collection_code}
          </p>
          <p className="text-sm">
            You'll collect{" "}
            <b>
              {o.allocated_qty} {pool.unit}(s)
            </b>{" "}
            of {pool.products?.name}.
          </p>
          <p className="mt-2 flex gap-2 text-sm">
            <MapPin className="size-4 shrink-0 text-primary" />
            <span>
              <b>{pool.collection_points?.name}</b>
              <br />
              {pool.collection_points?.area}
              <br />
              <span className="text-muted-foreground">{pool.collection_points?.instructions}</span>
            </span>
          </p>
        </Section>
      )}

      {o.fulfilment_status === "collected" && (
        <Section>
          <p className="font-display text-xl font-bold text-success">Completed ✓</p>
          <p className="text-sm text-muted-foreground">Collected {dateTime(o.collected_at)}.</p>
        </Section>
      )}

      <Section title="Order tracking">
        <OrderTimeline step={timelineStep(o)} failed={failed} />
      </Section>

      {(o.refunds ?? []).length > 0 && (
        <Section title="Refunds">
          {o.refunds!.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between border-b py-2 text-sm last:border-0"
            >
              <div>
                <p className="font-semibold">{money(r.amount)}</p>
                <p className="text-xs text-muted-foreground">{r.reason}</p>
              </div>
              <StatusBadge tone={r.status === "completed" ? "success" : "warning"}>
                {r.status === "completed" ? "Refunded" : "Refund due"}
              </StatusBadge>
            </div>
          ))}
          <p className="mt-2 text-xs text-muted-foreground">
            Refunds are paid back to the account you paid from. Contact KasiPool if you need help.
          </p>
        </Section>
      )}

      {o.confirmed_at && (
        <p className="text-center text-xs text-muted-foreground">
          Confirmed {dateTime(o.confirmed_at)} · terms {o.terms_version}
        </p>
      )}
    </Container>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
