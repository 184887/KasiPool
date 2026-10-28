"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loading, PageHeader, StatusBadge, Section } from "@/components/kp/ui";
import { DataTable, Td, inputCls } from "@/components/kp/admin";
import { PaymentDialog, type PaymentDialogOrder } from "@/components/kp/PaymentDialog";
import { PROOF_BUCKET } from "@/components/kp/PaymentProof";
import { errMsg } from "@/lib/queries";
import { money, dateTime } from "@/lib/format";
import { PAYMENT_STATUS, PAYMENT_METHOD, FULFIL_STATUS } from "@/lib/status";

/** Filter value for delivered orders that are not paid yet (pilot: shops pay on delivery) */
const OWED = "owed";

export function Payments() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const [o, r, a, p] = await Promise.all([
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
          .in("action", [
            "record_payment",
            "payment_issue",
            "approve_payment_proof",
            "reject_payment_proof",
            "refund_owed",
            "refund_completed",
          ])
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("payment_proofs")
          .select(
            "*, orders(id, ref, total, amount_paid, businesses(trading_name), pools(products(name)))",
          )
          .eq("status", "pending")
          .order("created_at"),
      ]);
      return {
        orders: o.data ?? [],
        refunds: r.data ?? [],
        audit: a.data ?? [],
        proofs: p.data ?? [],
      };
    },
  });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [pay, setPay] = useState<PaymentDialogOrder | null>(null);
  if (isLoading || !data) return <Loading />;
  const list = data.orders.filter(
    (o) =>
      (!status ||
        (status === OWED
          ? o.payment_status !== "paid" && ["delivered", "received"].includes(o.fulfilment_status)
          : o.payment_status === status)) &&
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
        subtitle="Shops pay when their stock arrives: cash at the door, or EFT with a proof of payment. Only mark money as paid once you have it. Every action is audit logged."
      />

      <Section title="Proofs to check" className="mb-6 border-4">
        {data.proofs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No proofs of payment waiting.</p>
        ) : (
          <ul className="divide-y-2 divide-ink/10">
            {data.proofs.map((p) => (
              <ProofRow key={p.id} proof={p} />
            ))}
          </ul>
        )}
      </Section>

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
          <option value={OWED}>Delivered, not paid</option>
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
          "Pays by",
          "Delivery",
          "Paid so far",
          "Status",
          "Paid on",
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
            <Td>{PAYMENT_METHOD[o.payment_method ?? "eft"]}</Td>
            <Td>{FULFIL_STATUS[o.fulfilment_status]?.label ?? "-"}</Td>
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

type ProofWithOrder = {
  id: string;
  file_path: string;
  created_at: string;
  orders: {
    ref: string | null;
    total: number;
    amount_paid: number;
    businesses: { trading_name: string } | null;
    pools: { products: { name: string } | null } | null;
  } | null;
};

/** One proof of payment: open it, find the money in the bank account, then approve or reject */
function ProofRow({ proof }: { proof: ProofWithOrder }) {
  const qc = useQueryClient();
  const o = proof.orders;
  const due = o ? Number(o.total) - Number(o.amount_paid) : 0;
  const [amount, setAmount] = useState(due.toFixed(2));
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);

  async function open() {
    const { data, error } = await supabase.storage
      .from(PROOF_BUCKET)
      .createSignedUrl(proof.file_path, 60 * 10);
    if (error) return toast.error(errMsg(error));
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function review(approve: boolean) {
    setBusy(true);
    const { error } = await supabase.rpc("admin_review_payment_proof", {
      _proof: proof.id,
      _approve: approve,
      _amount: approve ? +amount : undefined,
      _note: approve ? undefined : reason,
    });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success(approve ? "Payment recorded" : "Proof rejected. The shop has been told why.");
    qc.invalidateQueries();
  }

  return (
    <li className="flex flex-wrap items-end gap-3 py-3">
      <div className="min-w-48 flex-1 text-sm">
        <p className="font-semibold">
          {o?.businesses?.trading_name}: {o?.ref}
        </p>
        <p className="text-muted-foreground">
          {o?.pools?.products?.name} · owes {money(due)} · sent {dateTime(proof.created_at)}
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={open}>
        View proof
      </Button>
      {rejecting ? (
        <>
          <input
            className={inputCls + " max-w-xs"}
            placeholder="Why? e.g. not in our account"
            aria-label="Reason for rejecting"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button size="sm" variant="destructive" disabled={busy} onClick={() => review(false)}>
            Reject
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>
            Back
          </Button>
        </>
      ) : (
        <>
          <label className="text-sm">
            <span className="sr-only">Amount found in the bank account (R)</span>
            <input
              type="number"
              step="0.01"
              className={inputCls + " w-28"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <Button size="sm" disabled={busy} onClick={() => review(true)}>
            Money is in: approve
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setRejecting(true)}>
            Reject
          </Button>
        </>
      )}
    </li>
  );
}
