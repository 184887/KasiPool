"use client";

import { Loading, PageHeader, MetricCard, Section } from "@/components/kp/ui";
import { money, pct } from "@/lib/format";
import { useAdminStats } from "@/views/admin/dashboard";

export function Reports() {
  const { data, isLoading } = useAdminStats();
  if (isLoading || !data) return <Loading />;
  const { pools, parts, orders, costs, pos } = data;
  const published = pools.filter((p) => p.status !== "draft");
  const funded = pools.filter((p) =>
    ["funded", "procurement", "stock_received", "ready_for_collection", "completed"].includes(
      p.status,
    ),
  );
  const failed = pools.filter((p) => ["unsuccessful", "refund_resolution"].includes(p.status));
  const interestQty = parts.filter((p) => p.status !== "withdrawn").length;
  const confirmedN = orders.filter((o) => o.status === "confirmed" || o.status === "failed").length;
  const offeredN = orders.length;
  const paid = orders.filter((o) => o.payment_status === "paid");
  const costMap = new Map(costs.map((c) => [c.pool_id, Number(c.supplier_cost)]));
  const gross = paid.reduce((s, o) => s + Number(o.total), 0);
  const spread = paid.reduce(
    (s, o) =>
      s + (Number(o.unit_price) - (costMap.get(o.pool_id) ?? Number(o.unit_price))) * o.quantity,
    0,
  );
  const volume = pos.reduce((s, p) => s + p.quantity, 0);
  const readyOrCollected = orders.filter((o) =>
    ["ready", "collected"].includes(o.fulfilment_status),
  );
  const collected = orders.filter((o) => o.fulfilment_status === "collected");
  const perUser = new Map<string, number>();
  orders
    .filter((o) => o.status === "confirmed")
    .forEach((o) => perUser.set(o.user_id, (perUser.get(o.user_id) ?? 0) + 1));
  const repeat = [...perUser.values()].filter((n) => n > 1).length;

  return (
    <>
      <PageHeader title="Reports" subtitle="Operational summary across all pools" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          label="Pools created"
          value={pools.length}
          hint={`${published.length} published`}
        />
        <MetricCard label="Pools funded" value={funded.length} />
        <MetricCard label="Pools unsuccessful" value={failed.length} />
        <MetricCard
          label="Funding success rate"
          value={`${pct(funded.length, funded.length + failed.length)}%`}
          hint="Of resolved pools"
        />
        <MetricCard
          label="Interest → confirmation"
          value={`${pct(confirmedN, offeredN)}%`}
          hint={`${confirmedN} of ${offeredN} qualified orders`}
        />
        <MetricCard
          label="Interest → payment"
          value={`${pct(paid.length, offeredN)}%`}
          hint={`${paid.length} paid · ${interestQty} interest records`}
        />
        <MetricCard label="Purchasing volume" value={volume} hint="Units on supplier orders" />
        <MetricCard
          label="Gross order value"
          value={money(gross)}
          hint="Fully paid customer orders"
          tone="success"
        />
        <MetricCard
          label="Gross purchasing spread"
          value={money(spread)}
          hint="Before costs, not profit"
          tone="gold"
        />
        <MetricCard
          label="Order fulfilment"
          value={`${pct(collected.length, readyOrCollected.length)}%`}
          hint={`${collected.length} of ${readyOrCollected.length} ready orders collected`}
        />
        <MetricCard
          label="Repeat customers"
          value={repeat}
          hint="Businesses with 2+ confirmed orders"
        />
      </div>
      <Section title="Notes" className="mt-6">
        <p className="text-sm text-muted-foreground">
          Gross spread = customer price minus agreed supplier cost on fully paid orders. It excludes
          transport, staff, payment fees and refunds, so it is not net profit.
        </p>
      </Section>
    </>
  );
}
