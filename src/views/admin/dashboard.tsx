"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Loading, MetricCard, PageHeader, Section } from "@/components/kp/ui";
import { money } from "@/lib/format";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      await supabase.rpc("refresh_pool_states");
      const [pools, biz, parts, orders, costs, pos] = await Promise.all([
        supabase
          .from("pools")
          .select("id, status, min_qty, pledged_qty, paid_qty, price, created_at"),
        supabase.from("businesses").select("id, user_id"),
        supabase.from("participations").select("user_id, status, pool_id"),
        supabase
          .from("orders")
          .select(
            "id, user_id, pool_id, status, payment_status, fulfilment_status, quantity, total, amount_paid, unit_price",
          ),
        supabase.from("pool_costs").select("*"),
        supabase.from("purchase_orders").select("*"),
      ]);
      return {
        pools: pools.data ?? [],
        biz: biz.data ?? [],
        parts: parts.data ?? [],
        orders: orders.data ?? [],
        costs: costs.data ?? [],
        pos: pos.data ?? [],
      };
    },
  });
}

export function Dashboard() {
  const { data, isLoading } = useAdminStats();
  if (isLoading || !data) return <Loading />;
  const { pools, biz, parts, orders, costs } = data;
  const by = (s: string) => pools.filter((p) => p.status === s);
  const openPoolIds = new Set(by("open").map((p) => p.id));
  const activeBiz = new Set(
    parts.filter((p) => p.status === "active" && openPoolIds.has(p.pool_id)).map((p) => p.user_id),
  ).size;
  const paidOrders = orders.filter((o) => o.payment_status === "paid" && o.status === "confirmed");
  const paidValue = paidOrders.reduce((s, o) => s + Number(o.total), 0);
  const costMap = new Map(costs.map((c) => [c.pool_id, Number(c.supplier_cost)]));
  const spread = paidOrders.reduce(
    (s, o) =>
      s + (Number(o.unit_price) - (costMap.get(o.pool_id) ?? Number(o.unit_price))) * o.quantity,
    0,
  );
  const awaitingPay = orders.filter(
    (o) =>
      o.status === "confirmed" &&
      ["awaiting_payment", "under_review", "issue"].includes(o.payment_status),
  );
  const review = orders.filter((o) => o.payment_status === "under_review");
  const ready = orders.filter((o) => o.fulfilment_status === "ready");
  const completed = orders.filter((o) => o.fulfilment_status === "collected");

  const queue = [
    {
      n: by("awaiting_confirmation").filter((p) => p.paid_qty >= p.min_qty).length,
      text: "pool(s) have enough paid demand to finalise funding",
      to: "/admin/pools",
    },
    {
      n: review.length,
      text: "order(s) have partial payments under review",
      to: "/admin/payments",
    },
    {
      n: awaitingPay.length - review.length,
      text: "order(s) are awaiting payment verification",
      to: "/admin/payments",
    },
    {
      n: by("funded").length,
      text: "funded pool(s) need supplier procurement",
      to: "/admin/pools",
    },
    { n: by("procurement").length, text: "pool(s) are awaiting stock receipt", to: "/admin/pools" },
    {
      n: by("stock_received").length,
      text: "pool(s) need orders marked ready",
      to: "/admin/pools",
    },
    {
      n: ready.length,
      text: "customer order(s) are ready for collection",
      to: "/admin/collections",
    },
    {
      n: by("refund_resolution").length,
      text: "failed pool(s) need refund resolution",
      to: "/admin/payments",
    },
  ].filter((q) => q.n > 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Live operations overview"
        actions={
          <Link
            href="/admin/pools/new"
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            + New pool
          </Link>
        }
      />
      <Section title="Work queue" className="mb-6 border-gold/50">
        {queue.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing needs attention right now.</p>
        ) : (
          <ul className="divide-y">
            {queue.map((q) => (
              <li key={q.text}>
                <Link href={q.to} className="flex items-center gap-3 py-3 hover:text-primary">
                  <span className="grid size-9 place-items-center rounded-lg bg-gold font-display font-bold text-gold-foreground">
                    {q.n}
                  </span>
                  <span className="flex-1 text-sm font-medium">{q.text}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Active pools" value={by("open").length} />
        <MetricCard label="Registered businesses" value={biz.length} />
        <MetricCard label="Active participants" value={activeBiz} hint="In open pools" />
        <MetricCard
          label="Awaiting confirmation"
          value={by("awaiting_confirmation").length}
          hint="Pools"
        />
        <MetricCard
          label="Awaiting funding"
          value={by("awaiting_confirmation").filter((p) => p.paid_qty < p.min_qty).length}
          hint="Paid below minimum"
        />
        <MetricCard label="Funded, awaiting procurement" value={by("funded").length} />
        <MetricCard
          label="Outstanding payments"
          value={awaitingPay.length}
          hint={money(awaitingPay.reduce((s, o) => s + Number(o.total) - Number(o.amount_paid), 0))}
        />
        <MetricCard label="Awaiting collection" value={ready.length} />
        <MetricCard label="Completed orders" value={completed.length} />
        <MetricCard
          label="Total paid order value"
          value={money(paidValue)}
          hint="Customer revenue (gross)"
          tone="success"
        />
        <MetricCard
          label="Est. gross purchasing spread"
          value={money(spread)}
          hint="Price − supplier cost. Not profit."
          tone="gold"
        />
      </div>
    </>
  );
}
