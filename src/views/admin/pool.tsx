"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loading, PageHeader, StatusBadge, Section, MetricCard } from "@/components/kp/ui";
import { DataTable, Td, Field, inputCls } from "@/components/kp/admin";
import { PoolProgress } from "@/components/kp/pool-bits";
import { PaymentDialog, type PaymentDialogOrder } from "@/components/kp/PaymentDialog";
import { errMsg, settingsQuery } from "@/lib/queries";
import { discountSplit } from "@/lib/pricing";
import { money, dateTime, date, sastLocalToIso, isoToSastLocal } from "@/lib/format";
import { POOL_STATUS, PAYMENT_STATUS, ORDER_STATUS, FULFIL_STATUS } from "@/lib/status";

export function PoolAdmin() {
  const { poolId } = useParams<{ poolId: string }>();
  const qc = useQueryClient();
  const settings = useQuery(settingsQuery);
  const suppliers = useQuery({
    queryKey: ["admin-suppliers-active"],
    queryFn: async () =>
      (await supabase.from("suppliers").select("id, name").eq("active", true).order("name")).data ??
      [],
  });
  const { data, isLoading } = useQuery({
    queryKey: ["admin-pool", poolId],
    queryFn: async () => {
      await supabase.rpc("refresh_pool_states");
      const [p, c, parts, orders, po] = await Promise.all([
        supabase
          .from("pools")
          .select("*, products(*), suppliers(name), campaigns(name), collection_points(name)")
          .eq("id", poolId)
          .single(),
        supabase.from("pool_costs").select("*").eq("pool_id", poolId).maybeSingle(),
        supabase
          .from("participations")
          .select("*, businesses(trading_name, township, mobile)")
          .eq("pool_id", poolId)
          .order("created_at"),
        supabase
          .from("orders")
          .select("*, businesses(trading_name)")
          .eq("pool_id", poolId)
          .order("created_at"),
        supabase.from("purchase_orders").select("*").eq("pool_id", poolId).maybeSingle(),
      ]);
      return {
        pool: p.data!,
        cost: c.data,
        parts: parts.data ?? [],
        orders: orders.data ?? [],
        po: po.data,
      };
    },
  });
  const [filter, setFilter] = useState("");
  const [payOrder, setPayOrder] = useState<PaymentDialogOrder | null>(null);
  const [poForm, setPoForm] = useState({
    ref: "",
    order_date: new Date().toISOString().slice(0, 10),
    expected: "",
  });
  const [recv, setRecv] = useState({ qty: "", note: "" });
  const [draft, setDraft] = useState<Record<string, string> | null>(null);

  if (isLoading || !data) return <Loading />;
  const { pool, cost, parts, orders, po } = data;
  const st = POOL_STATUS[pool.status];
  const call = async (fn: () => PromiseLike<{ error: unknown }>, ok: string) => {
    const { error } = await fn();
    if (error) return toast.error(errMsg(error));
    toast.success(ok);
    qc.invalidateQueries();
  };
  const orderByPart = new Map(orders.map((o) => [o.participation_id, o]));
  const rows = parts.filter((p) => {
    const o = orderByPart.get(p.id);
    if (!filter) return true;
    if (filter === "interest") return p.status === "active";
    if (filter === "withdrawn") return p.status === "withdrawn";
    if (filter === "confirmed") return o?.status === "confirmed";
    if (filter === "awaiting") return o?.status === "awaiting_confirmation";
    if (filter === "paid") return o?.payment_status === "paid";
    if (filter === "unpaid") return o?.status === "confirmed" && o.payment_status !== "paid";
    return true;
  });
  const d = draft ?? {
    supplier_id: pool.supplier_id ?? "",
    list: pool.reference_price == null ? "" : String(pool.reference_price),
    min_qty: String(pool.min_qty),
    closes_at: isoToSastLocal(pool.closes_at),
    cost: String(cost?.supplier_cost ?? ""),
  };
  // Drafts show the price they would get if published now
  const share = settings.data?.pricing?.discount_share_pct ?? 0;
  const preview =
    pool.status === "draft" && d.list !== "" && d.cost !== ""
      ? discountSplit(+d.list, +d.cost, share)
      : null;
  const shownPrice = pool.price ?? preview?.price ?? null;

  return (
    <>
      <Link
        href="/admin/pools"
        className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Pools
      </Link>
      <PageHeader
        title={pool.products?.name ?? "Pool"}
        subtitle={`${pool.campaigns?.name ?? "No campaign"} · Supplier: ${pool.suppliers?.name ?? "-"} · ${pool.collection_points?.name ?? ""}`}
        actions={<StatusBadge tone={st.tone}>{st.admin}</StatusBadge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Interested (pledged)"
          value={`${pool.pledged_qty} / ${pool.min_qty}`}
          hint={`${pool.participant_count} businesses`}
        />
        <MetricCard label="Confirmed" value={pool.confirmed_qty} hint="units" />
        <MetricCard
          label="Fully paid"
          value={pool.paid_qty}
          hint={
            pool.paid_qty >= pool.min_qty
              ? "Meets minimum ✓"
              : `Need ${pool.min_qty - pool.paid_qty} more`
          }
          tone={pool.paid_qty >= pool.min_qty ? "success" : undefined}
        />
        <MetricCard
          label={pool.status === "draft" ? "Price if published now" : "Price / bulk cost"}
          value={shownPrice == null ? "-" : money(shownPrice)}
          hint={`List ${money(pool.reference_price)} · bulk ${money(cost?.supplier_cost)} · KasiPool ${money(Number(shownPrice ?? 0) - Number(cost?.supplier_cost ?? 0))}/unit${pool.discount_share_pct != null ? ` (${pool.discount_share_pct}%)` : ""}`}
        />
        <MetricCard
          label={pool.status === "open" ? "Closes" : "Payment deadline"}
          value={
            <span className="text-base">
              {dateTime(
                pool.status === "open" ? pool.closes_at : (pool.payment_deadline ?? pool.closes_at),
              )}
            </span>
          }
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_380px]">
        <Section
          title="Participants & orders"
          action={
            <select
              className={inputCls + " w-auto"}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="interest">Active interest</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="awaiting">Awaiting confirmation</option>
              <option value="confirmed">Confirmed</option>
              <option value="unpaid">Confirmed, unpaid</option>
              <option value="paid">Paid</option>
            </select>
          }
        >
          <DataTable
            head={["Business", "Qty", "Joined", "Order", "Payment", "Fulfilment", ""]}
            empty={!rows.length}
          >
            {rows.map((p) => {
              const o = orderByPart.get(p.id);
              return (
                <tr key={p.id}>
                  <Td>
                    <p className="font-medium">{p.businesses?.trading_name}</p>
                    <p className="text-xs text-muted-foreground">{p.businesses?.township}</p>
                  </Td>
                  <Td className="tabular">
                    {p.quantity}
                    {p.status === "withdrawn" && (
                      <span className="ml-1 text-xs text-muted-foreground">(withdrawn)</span>
                    )}
                  </Td>
                  <Td>{date(p.created_at)}</Td>
                  <Td>
                    {o ? (
                      <>
                        <StatusBadge tone={ORDER_STATUS[o.status].tone}>
                          {ORDER_STATUS[o.status].label}
                        </StatusBadge>
                        <p className="text-xs text-muted-foreground">{o.ref}</p>
                      </>
                    ) : (
                      "-"
                    )}
                  </Td>
                  <Td>
                    {o ? (
                      <StatusBadge tone={PAYMENT_STATUS[o.payment_status].tone}>
                        {PAYMENT_STATUS[o.payment_status].label}
                      </StatusBadge>
                    ) : (
                      "-"
                    )}
                  </Td>
                  <Td>
                    {o && o.fulfilment_status !== "none"
                      ? `${FULFIL_STATUS[o.fulfilment_status].label}${o.allocated_qty ? ` (${o.allocated_qty})` : ""}`
                      : "-"}
                  </Td>
                  <Td>
                    {o?.status === "confirmed" && o.payment_status !== "paid" && (
                      <Button size="sm" variant="outline" onClick={() => setPayOrder(o)}>
                        Record payment
                      </Button>
                    )}
                  </Td>
                </tr>
              );
            })}
          </DataTable>
        </Section>

        <div className="space-y-4">
          <Section title="Pool progress">
            <PoolProgress
              pledged={pool.pledged_qty}
              target={pool.min_qty}
              participants={pool.participant_count}
              unit={pool.unit}
            />
          </Section>

          <Section title="Next step">
            {pool.status === "draft" && (
              <div className="space-y-3">
                <Field label="Supplier">
                  <select
                    className={inputCls}
                    value={d.supplier_id}
                    onChange={(e) => setDraft({ ...d, supplier_id: e.target.value })}
                  >
                    <option value="">Select…</option>
                    {(suppliers.data ?? []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="List price (R)">
                    <input
                      className={inputCls}
                      type="number"
                      value={d.list}
                      onChange={(e) => setDraft({ ...d, list: e.target.value })}
                    />
                  </Field>
                  <Field label="Bulk price (R)">
                    <input
                      className={inputCls}
                      type="number"
                      value={d.cost}
                      onChange={(e) => setDraft({ ...d, cost: e.target.value })}
                    />
                  </Field>
                  <Field label="Min qty">
                    <input
                      className={inputCls}
                      type="number"
                      value={d.min_qty}
                      onChange={(e) => setDraft({ ...d, min_qty: e.target.value })}
                    />
                  </Field>
                  <Field label="Closes (SAST)">
                    <input
                      className={inputCls}
                      type="datetime-local"
                      value={d.closes_at}
                      onChange={(e) => setDraft({ ...d, closes_at: e.target.value })}
                    />
                  </Field>
                </div>
                {preview && (
                  <p className="text-sm text-muted-foreground">
                    Shops would pay <b className="text-ink">{money(preview.price)}</b> and save{" "}
                    {money(preview.shopSaving)}; KasiPool keeps {money(preview.kasipool)} per unit (
                    {share}% of the discount).
                  </p>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    call(async () => {
                      const r = await supabase
                        .from("pools")
                        .update({
                          supplier_id: d.supplier_id || null,
                          reference_price: d.list === "" ? null : +d.list,
                          min_qty: +d.min_qty,
                          closes_at: sastLocalToIso(d.closes_at),
                        })
                        .eq("id", poolId);
                      if (r.error) return r;
                      if (d.cost === "") return r;
                      return supabase
                        .from("pool_costs")
                        .upsert({ pool_id: poolId, supplier_cost: +d.cost });
                    }, "Draft updated")
                  }
                >
                  Save draft changes
                </Button>
                <Button
                  className="w-full"
                  onClick={() =>
                    call(() => supabase.rpc("admin_publish_pool", { _pool: poolId }), "Published")
                  }
                >
                  Publish pool
                </Button>
              </div>
            )}
            {pool.status === "open" && (
              <div className="space-y-2 text-sm">
                <p>
                  Customers are registering interest. The pool closes automatically when the target
                  or deadline is reached.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    confirm(
                      "Close this pool now? It will qualify only if the minimum is reached.",
                    ) &&
                    call(() => supabase.rpc("admin_close_now", { _pool: poolId }), "Pool closed")
                  }
                >
                  Close pool now
                </Button>
              </div>
            )}
            {pool.status === "awaiting_confirmation" && (
              <div className="space-y-2 text-sm">
                <p>
                  Customers are confirming and paying. Deadline:{" "}
                  <b>{dateTime(pool.payment_deadline)}</b>. At the deadline the system checks paid
                  quantity against the minimum automatically.
                </p>
                <Button
                  className="w-full"
                  disabled={pool.paid_qty < pool.min_qty}
                  onClick={() =>
                    confirm("Finalise funding now? All unpaid orders will expire.") &&
                    call(
                      () => supabase.rpc("admin_finalise_funding", { _pool: poolId }),
                      "Funding finalised",
                    )
                  }
                >
                  Finalise funding now ({pool.paid_qty}/{pool.min_qty} paid)
                </Button>
                {pool.paid_qty < pool.min_qty && (
                  <p className="text-xs text-muted-foreground">
                    Available once paid quantity meets the minimum.
                  </p>
                )}
              </div>
            )}
            {pool.status === "funded" && (
              <div className="space-y-2">
                <p className="text-sm">
                  Generate the consolidated supplier order for{" "}
                  <b>
                    {pool.paid_qty} {pool.unit}s
                  </b>{" "}
                  at {money(cost?.supplier_cost)} ={" "}
                  <b>{money(pool.paid_qty * Number(cost?.supplier_cost ?? 0))}</b>.
                </p>
                <Field label="Supplier order reference">
                  <input
                    className={inputCls}
                    value={poForm.ref}
                    onChange={(e) => setPoForm({ ...poForm, ref: e.target.value })}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Order date">
                    <input
                      type="date"
                      className={inputCls}
                      value={poForm.order_date}
                      onChange={(e) => setPoForm({ ...poForm, order_date: e.target.value })}
                    />
                  </Field>
                  <Field label="Expected delivery">
                    <input
                      type="date"
                      className={inputCls}
                      value={poForm.expected}
                      onChange={(e) => setPoForm({ ...poForm, expected: e.target.value })}
                    />
                  </Field>
                </div>
                <Button
                  className="w-full"
                  onClick={() =>
                    call(
                      () =>
                        supabase.rpc("admin_create_po", {
                          _pool: poolId,
                          _supplier_ref: poForm.ref,
                          _order_date: poForm.order_date,
                          _expected: poForm.expected || null,
                        }),
                      "Purchase order created",
                    )
                  }
                >
                  Authorise purchase order
                </Button>
              </div>
            )}
            {pool.status === "procurement" && (
              <div className="space-y-2">
                <p className="text-sm">
                  Record what the supplier delivered. Stock is allocated to paid orders in payment
                  order; shortfalls create refunds.
                </p>
                <Field label={`Quantity received (ordered ${po?.quantity})`}>
                  <input
                    type="number"
                    className={inputCls}
                    value={recv.qty}
                    onChange={(e) => setRecv({ ...recv, qty: e.target.value })}
                  />
                </Field>
                <Field label="Discrepancy note">
                  <input
                    className={inputCls}
                    value={recv.note}
                    onChange={(e) => setRecv({ ...recv, note: e.target.value })}
                  />
                </Field>
                <Button
                  className="w-full"
                  disabled={recv.qty === ""}
                  onClick={() =>
                    call(
                      () =>
                        supabase.rpc("admin_receive_stock", {
                          _pool: poolId,
                          _received: +recv.qty,
                          _note: recv.note,
                        }),
                      "Stock received & allocated",
                    )
                  }
                >
                  Record receipt & allocate
                </Button>
              </div>
            )}
            {pool.status === "stock_received" && (
              <Button
                className="w-full"
                onClick={() =>
                  call(
                    () => supabase.rpc("admin_mark_ready", { _pool: poolId }),
                    "Orders marked ready; customers notified",
                  )
                }
              >
                Mark allocated orders ready for collection
              </Button>
            )}
            {pool.status === "ready_for_collection" && (
              <Button asChild className="w-full">
                <Link href="/admin/collections">Go to collections</Link>
              </Button>
            )}
            {pool.status === "refund_resolution" && (
              <div className="space-y-2 text-sm">
                <p>{pool.outcome_note}</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/payments">Process refunds</Link>
                </Button>
                <Button
                  className="w-full"
                  onClick={() =>
                    call(
                      () =>
                        supabase.rpc("admin_resolve_failed_pool", {
                          _pool: poolId,
                          _note: "Refunds completed",
                        }),
                      "Pool resolved",
                    )
                  }
                >
                  Mark resolved
                </Button>
              </div>
            )}
            {["completed", "unsuccessful", "cancelled"].includes(pool.status) && (
              <div className="space-y-2 text-sm">
                <p>{pool.outcome_note ?? "This pool is closed."}</p>
                {pool.status !== "completed" && (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/admin/pools/new">Relaunch as new deal</Link>
                  </Button>
                )}
                {pool.status !== "completed" && (
                  <p className="text-xs text-muted-foreground">
                    Customer commitments are not transferred to a new deal.
                  </p>
                )}
              </div>
            )}
            {["draft", "scheduled", "open", "awaiting_confirmation"].includes(pool.status) && (
              <Button
                variant="ghost"
                className="mt-3 w-full text-destructive"
                onClick={() => {
                  const r = prompt("Reason for cancelling?");
                  if (r)
                    call(
                      () => supabase.rpc("admin_cancel_pool", { _pool: poolId, _reason: r }),
                      "Pool cancelled",
                    );
                }}
              >
                Cancel pool
              </Button>
            )}
          </Section>

          {po && (
            <Section title="Supplier purchase order">
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Reference</dt>
                  <dd>{po.supplier_ref || "-"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Quantity</dt>
                  <dd>
                    {po.quantity} {pool.unit}s
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Unit cost</dt>
                  <dd>{money(po.unit_cost)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Total est. cost</dt>
                  <dd className="font-bold">{money(po.total)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Ordered / expected</dt>
                  <dd>
                    {date(po.order_date)} / {date(po.expected_date)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    {po.status.replace("_", " ")}
                    {po.received_qty != null && ` (${po.received_qty} received)`}
                  </dd>
                </div>
                {po.discrepancy_note && (
                  <p className="text-xs text-warning">{po.discrepancy_note}</p>
                )}
              </dl>
            </Section>
          )}
        </div>
      </div>
      <PaymentDialog order={payOrder} onClose={() => setPayOrder(null)} />
    </>
  );
}
