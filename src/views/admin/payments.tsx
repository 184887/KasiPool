"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loading, PageHeader, StatusBadge, Section } from "@/components/kp/ui";
import { DataTable, Td, inputCls } from "@/components/kp/admin";
import { PaymentDialog, type PaymentDialogOrder } from "@/components/kp/PaymentDialog";
import { errMsg } from "@/lib/queries";
import { money, dateTime } from "@/lib/format";
import { PAYMENT_STATUS } from "@/lib/status";

export function Payments() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const [o, r, a] = await Promise.all([
        supabase
          .from("orders")
          .select("*, businesses(trading_name), pools(unit, products(name)), payments(*)")
          .eq("status", "confirmed")
          .order("confirmed_at", { ascending: false }),
        supabase
          .from("refunds")
          .select("*, orders(ref, businesses(trading_name), pools(products(name)))")
          .order("created_at", { ascending: false }),
        supabase
          .from("audit_events")
          .select("*")
          .in("action", ["record_payment", "payment_issue", "refund_owed", "refund_completed"])
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      // include failed/expired orders that had payments, for refunds context
      return { orders: o.data ?? [], refunds: r.data ?? [], audit: a.data ?? [] };
    },
  });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [pay, setPay] = useState<PaymentDialogOrder | null>(null);
  if (isLoading || !data) return <Loading />;
  const list = data.orders.filter(
    (o) =>
      (!status || o.payment_status === status) &&
      (!q || `${o.ref} ${o.businesses?.trading_name}`.toLowerCase().includes(q.toLowerCase())),
  );

  async function completeRefund(id: string) {
    const ref = prompt("Bank reference of the refund transfer?");
    if (!ref) return;
    const { error } = await supabase.rpc("admin_complete_refund", { _refund: id, _reference: ref });
    if (error) return toast.error(errMsg(error));
    toast.success("Refund recorded");
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle="Reconcile against verified bank records only. Every action is audit logged."
      />
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          className={inputCls + " max-w-xs"}
          placeholder="Order ref or business"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className={inputCls + " max-w-xs"}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {Object.entries(PAYMENT_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
      <DataTable
        head={[
          "Order ref",
          "Customer",
          "Product",
          "Amount due",
          "Payment ref",
          "Verified",
          "Status",
          "Verified on",
          "",
        ]}
        empty={!list.length}
      >
        {list.map((o) => (
          <tr key={o.id}>
            <Td className="font-medium">{o.ref}</Td>
            <Td>{o.businesses?.trading_name}</Td>
            <Td>
              {o.pools?.products?.name} × {o.quantity}
            </Td>
            <Td className="tabular">{money(o.total)}</Td>
            <Td>{o.payment_reference}</Td>
            <Td className="tabular">{money(o.amount_paid)}</Td>
            <Td>
              <StatusBadge tone={PAYMENT_STATUS[o.payment_status].tone}>
                {PAYMENT_STATUS[o.payment_status].label}
              </StatusBadge>
            </Td>
            <Td>{o.paid_at ? dateTime(o.paid_at) : "-"}</Td>
            <Td>
              {o.payment_status !== "paid" && (
                <Button size="sm" variant="outline" onClick={() => setPay(o)}>
                  Record
                </Button>
              )}
            </Td>
          </tr>
        ))}
      </DataTable>

      <Section title="Refund obligations" className="mt-6">
        <DataTable
          head={["Order", "Customer", "Amount", "Reason", "Status", ""]}
          empty={!data.refunds.length}
        >
          {data.refunds.map((r) => (
            <tr key={r.id}>
              <Td>{r.orders?.ref ?? "-"}</Td>
              <Td>{r.orders?.businesses?.trading_name}</Td>
              <Td className="tabular">{money(r.amount)}</Td>
              <Td className="max-w-xs truncate">{r.reason}</Td>
              <Td>
                <StatusBadge tone={r.status === "owed" ? "warning" : "success"}>
                  {r.status === "owed" ? "Owed" : `Completed ${r.completed_reference ?? ""}`}
                </StatusBadge>
              </Td>
              <Td>
                {r.status === "owed" && (
                  <Button size="sm" onClick={() => completeRefund(r.id)}>
                    Mark refunded
                  </Button>
                )}
              </Td>
            </tr>
          ))}
        </DataTable>
      </Section>

      <Section title="Change history" className="mt-6">
        {data.audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payment actions yet.</p>
        ) : (
          <ul className="divide-y text-sm">
            {data.audit.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span className="font-medium">{a.action.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground">{JSON.stringify(a.details)}</span>
                <span className="text-xs text-muted-foreground">{dateTime(a.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <PaymentDialog order={pay} onClose={() => setPay(null)} />
    </>
  );
}
