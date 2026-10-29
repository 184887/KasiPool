"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, BadgeCheck, Banknote, Copy, Landmark, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Container } from "@/components/kp/AppShell";
import { useConfirm } from "@/components/kp/ConfirmDialog";
import { OrderTimeline, Countdown, ProductImage } from "@/components/kp/pool-bits";
import { Loading, EmptyState, StatusBadge, Section } from "@/components/kp/ui";
import { ProofUpload } from "@/components/kp/PaymentProof";
import { PinPrompt } from "@/components/kp/PinPrompt";
import { useAuth } from "@/lib/auth";
import { missingPin } from "@/lib/delivery";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery, errMsg } from "@/lib/queries";
import { money, dateTime, qty } from "@/lib/format";
import { PAYMENT_STATUS, PAYMENT_METHOD, ORDER_STATUS, timelineStep } from "@/lib/status";
import { cn } from "@/lib/utils";

type Method = "cash" | "eft";

export function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const qc = useQueryClient();
  const { business } = useAuth();
  const settings = useQuery(settingsQuery);
  const { data: o, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () =>
      (
        await supabase
          .from("orders")
          .select(
            "*, pools(*, products(name, image_url, pack_size)), refunds(*), payment_proofs(id, status, note, created_at)",
          )
          .eq("id", orderId)
          .maybeSingle()
      ).data,
  });
  const [accept, setAccept] = useState(false);
  const [method, setMethod] = useState<Method | null>(null);
  const [changing, setChanging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [ask, confirmDialog] = useConfirm();

  if (isLoading) return <Loading />;
  if (!o)
    return (
      <Container>
        <EmptyState title="Order not found" />
      </Container>
    );
  const pool = o.pools!;
  const pay = settings.data?.payment;
  const latestProof = [...(o.payment_proofs ?? [])].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )[0];
  const payMethod: Method = o.payment_method === "cash" ? "cash" : "eft";
  const failed = ["declined", "expired", "cancelled", "failed"].includes(o.status)
    ? (o.failure_reason ?? ORDER_STATUS[o.status].label)
    : null;

  async function confirm() {
    setBusy(true);
    const { error } = await supabase.rpc("confirm_order", {
      _order: orderId,
      _accept: accept,
      _method: method ?? undefined,
    });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success("Order confirmed");
    qc.invalidateQueries();
  }
  async function changeMethod(m: Method) {
    setBusy(true);
    const { error } = await supabase.rpc("choose_payment_method", { _order: orderId, _method: m });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    setChanging(false);
    qc.invalidateQueries();
  }
  async function received() {
    setBusy(true);
    const { error } = await supabase.rpc("confirm_delivery_received", { _order: orderId });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success("Thank you");
    qc.invalidateQueries();
  }
  async function reportProblem() {
    setBusy(true);
    const { error } = await supabase.rpc("report_delivery_problem", {
      _order: orderId,
      _note: problem ?? "",
    });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success("Sent. KasiPool will contact you soon.");
    setProblem(null);
    qc.invalidateQueries();
  }
  async function decline() {
    const ok = await ask({
      title: "Decline this order?",
      body: "You won't get this stock, and you can't undo this.",
      confirmLabel: "Decline order",
      cancelLabel: "Keep my order",
      danger: true,
    });
    if (ok === false) return;
    const { error } = await supabase.rpc("decline_order", { _order: orderId });
    if (error) return toast.error(errMsg(error));
    toast.success("Order cancelled");
    qc.invalidateQueries();
  }

  return (
    <Container className="max-w-2xl space-y-4">
      <Link
        href="/my-pools"
        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> My Pools
      </Link>
      <div className="flex items-center gap-3">
        <ProductImage
          src={pool.products?.image_url}
          name={pool.products?.name}
          alt=""
          className="size-16 shrink-0 rounded-sm border-2 border-ink object-cover"
          width={64}
          height={64}
        />
        <div>
          <h1 className="font-headline text-4xl sm:text-5xl">{pool.products?.name}</h1>
          <p className="text-sm text-muted-foreground">
            {o.ref ? `Order ${o.ref}` : "Please confirm"}
          </p>
        </div>
      </div>

      {o.status === "awaiting_confirmation" && (
        <Section title="Confirm your order" className="border-4">
          <p className="text-sm">The pool reached its target. Please review and confirm.</p>
          <dl className="mt-3 space-y-1.5 text-sm">
            <Row k="Product" v={`${pool.products?.name} (${pool.products?.pack_size})`} />
            <Row k="Quantity" v={qty(o.quantity, pool.unit)} />
            <Row k="Price for each" v={money(o.unit_price)} />
            <Row k="Goods" v={money(o.quantity * Number(o.unit_price))} />
            <Row k="Delivery" v={Number(o.delivery_fee) > 0 ? money(o.delivery_fee) : "Free"} />
            <Row k="Order total" v={<b className="text-lg">{money(o.total)}</b>} />
            <Row k="Deliver to" v={o.delivery_address ?? "-"} />
            <Row
              k="Confirm by"
              v={
                <span>
                  {dateTime(pool.payment_deadline)} (<Countdown to={pool.payment_deadline!} />)
                </span>
              }
            />
          </dl>
          <p className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">
            When you confirm, you agree to buy this amount at this price. KasiPool buys the stock
            first. You pay when your stock arrives. Your price will not change.
          </p>
          <PinPrompt business={business} className="mt-4" />
          <p className="mt-4 text-sm font-bold">How will you pay?</p>
          <MethodChoice value={method} onChange={setMethod} />
          <label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm">
            <Checkbox checked={accept} onCheckedChange={(v) => setAccept(!!v)} className="mt-0.5" />
            <span>
              I accept the{" "}
              <a href="/terms" target="_blank" className="font-semibold underline">
                purchase terms
              </a>{" "}
              ({settings.data?.terms?.version ?? "v0.2-draft"}).
            </span>
          </label>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="outline" size="lg" onClick={decline}>
              Decline
            </Button>
            <Button
              size="lg"
              variant="gold"
              onClick={confirm}
              disabled={!accept || !method || busy || !!missingPin(business)}
            >
              {busy ? "Please wait…" : "Confirm my order"}
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
              k="Amount to pay"
              v={<b className="text-lg">{money(Number(o.total) - Number(o.amount_paid))}</b>}
            />
            {Number(o.amount_paid) > 0 && <Row k="Paid so far" v={money(o.amount_paid)} />}
          </dl>
          <div className="mt-3 flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">How you pay</span>
            <span className="flex items-center gap-2 font-medium">
              {PAYMENT_METHOD[payMethod]}
              {o.payment_status !== "under_review" && !changing && (
                <Button size="sm" variant="ghost" onClick={() => setChanging(true)}>
                  Change
                </Button>
              )}
            </span>
          </div>
          {changing && (
            <div className="mt-2">
              <MethodChoice value={payMethod} onChange={changeMethod} disabled={busy} />
              <Button variant="ghost" className="mt-1 w-full" onClick={() => setChanging(false)}>
                Keep {PAYMENT_METHOD[payMethod].toLowerCase()}
              </Button>
            </div>
          )}
          {payMethod === "cash" ? (
            <div className="mt-4 rounded-md border-2 border-ink bg-muted p-4 text-sm">
              <p className="font-bold">
                Have {money(Number(o.total) - Number(o.amount_paid))} ready in cash when your stock
                arrives.
              </p>
              <p className="mt-2 text-muted-foreground">
                Count the stock first, then pay. KasiPool marks your order “Paid” when we get the
                money.
              </p>
            </div>
          ) : pay?.configured ? (
            <div className="mt-4 rounded-md border-2 border-ink bg-muted p-4 text-sm">
              <p className="font-bold">{pay.method}</p>
              <dl className="mt-2 space-y-1">
                {pay.bank && <Row k="Bank" v={pay.bank} />}
                {pay.account_name && <Row k="Account name" v={pay.account_name} />}
                {pay.account_number && <Row k="Account number" v={pay.account_number} />}
                {pay.branch_code && <Row k="Branch code" v={pay.branch_code} />}
              </dl>
              <div className="mt-3 flex items-center justify-between rounded-md border-2 border-ink bg-card p-3">
                <div>
                  <p className="text-sm text-muted-foreground">Use this payment reference</p>
                  <p className="font-headline text-3xl tabular">{o.payment_reference}</p>
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
              {pay.notes && <p className="mt-2 text-sm">{pay.notes}</p>}
              <p className="mt-2 text-sm text-muted-foreground">
                Pay before or when your stock arrives. Then send us your proof of payment. Your
                order shows “Paid” when we find the money in our bank account.
              </p>
              <ProofUpload orderId={o.id} latest={latestProof} />
            </div>
          ) : (
            <div className="mt-4 rounded-md border-2 border-warning/40 bg-warning-soft p-4 text-sm text-warning">
              <b>We don't have bank details for you yet.</b> Please do not pay by EFT yet. We will
              tell you when you can, or tap Change to pay in cash when your stock arrives.
            </div>
          )}
        </Section>
      )}

      {["out_for_delivery", "delivered", "received"].includes(o.fulfilment_status) && (
        <Section
          title={
            o.fulfilment_status === "received"
              ? "Received"
              : o.fulfilment_status === "delivered"
                ? "Delivered"
                : "Out for delivery"
          }
          className={o.fulfilment_status === "received" ? undefined : "border-4 border-leaf"}
        >
          {o.fulfilment_status === "received" ? (
            <p className="flex items-center gap-2 font-headline text-3xl text-leaf">
              <BadgeCheck className="size-7" aria-hidden="true" /> Completed
            </p>
          ) : (
            <p className="text-sm">
              {o.fulfilment_status === "delivered"
                ? "The courier says they delivered your stock. Did you get it?"
                : "Your stock is on its way."}
            </p>
          )}
          <dl className="mt-3 space-y-1.5 text-sm">
            <Row k="Quantity" v={qty(o.allocated_qty, pool.unit)} />
            <Row k="Deliver to" v={o.delivery_address ?? "-"} />
            {o.courier_ref && <Row k="Courier reference" v={o.courier_ref} />}
            {o.received_at && <Row k="Received" v={dateTime(o.received_at)} />}
          </dl>
          {o.fulfilment_status !== "received" && (
            <Button
              size="xl"
              variant="gold"
              className="mt-4 w-full"
              onClick={received}
              disabled={busy}
            >
              <PackageCheck /> I received my stock
            </Button>
          )}
          {o.problem_reported_at ? (
            <p className="mt-3 rounded-md bg-warning-soft p-3 text-sm text-warning">
              You reported a problem on {dateTime(o.problem_reported_at)}: {o.problem_note}.
              KasiPool will contact you.
            </p>
          ) : problem === null ? (
            <Button variant="ghost" className="mt-2 w-full" onClick={() => setProblem("")}>
              Report a problem with this delivery
            </Button>
          ) : (
            <div className="mt-3 space-y-2">
              <Label htmlFor="problem">What went wrong?</Label>
              <textarea
                id="problem"
                rows={3}
                className="w-full rounded-md border-2 border-input bg-card px-3 py-2 text-base"
                placeholder="e.g. 2 cases missing, or nothing arrived"
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
              />
              <Button variant="outline" className="w-full" onClick={reportProblem} disabled={busy}>
                Send to KasiPool
              </Button>
            </div>
          )}
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
              className="flex items-center justify-between border-b-2 border-ink/10 py-2 text-sm last:border-0"
            >
              <div>
                <p className="font-semibold">{money(r.amount)}</p>
                <p className="text-sm text-muted-foreground">{r.reason}</p>
              </div>
              <StatusBadge tone={r.status === "completed" ? "success" : "warning"}>
                {r.status === "completed" ? "Refunded" : "Refund due"}
              </StatusBadge>
            </div>
          ))}
          <p className="mt-2 text-sm text-muted-foreground">
            We pay refunds back to the account you paid from. Contact KasiPool if you need help.
          </p>
        </Section>
      )}

      {o.confirmed_at && (
        <p className="text-center text-sm text-muted-foreground">
          Confirmed {dateTime(o.confirmed_at)} · terms {o.terms_version}
        </p>
      )}
      {confirmDialog}
    </Container>
  );
}

function MethodChoice({
  value,
  onChange,
  disabled,
}: {
  value: Method | null;
  onChange: (m: Method) => void;
  disabled?: boolean;
}) {
  const options = [
    {
      id: "cash" as const,
      icon: Banknote,
      title: "Cash when it arrives",
      body: "Pay at the door.",
    },
    {
      id: "eft" as const,
      icon: Landmark,
      title: "Bank transfer (EFT)",
      body: "Pay into our bank account and send us proof.",
    },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="How will you pay?"
      className="mt-2 grid gap-2 sm:grid-cols-2"
    >
      {options.map(({ id, icon: Icon, title, body }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          disabled={disabled}
          onClick={() => onChange(id)}
          className={cn(
            "flex min-h-16 items-start gap-3 rounded-md border-2 p-3 text-left transition-colors disabled:opacity-60",
            value === id ? "border-ink bg-gold-soft" : "border-input bg-card hover:border-ink",
          )}
        >
          <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <span>
            <span className="block font-bold">{title}</span>
            <span className="block text-sm text-muted-foreground">{body}</span>
          </span>
        </button>
      ))}
    </div>
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
