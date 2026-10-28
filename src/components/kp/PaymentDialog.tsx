import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Field, inputCls } from "./admin";
import { money } from "@/lib/format";
import { errMsg } from "@/lib/queries";

export type PaymentDialogOrder = {
  id: string;
  ref: string | null;
  total: number;
  amount_paid: number;
  payment_method: string | null;
};

export function PaymentDialog({
  order,
  onClose,
}: {
  order: PaymentDialogOrder | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const due = order ? Number(order.total) - Number(order.amount_paid) : 0;
  const [amount, setAmount] = useState("");
  const [chan, setChan] = useState("");
  const [note, setNote] = useState("");
  const [method, setMethod] = useState("");
  const [busy, setBusy] = useState(false);
  const how = method || (order?.payment_method === "cash" ? "cash" : "eft");

  async function run(kind: "verified" | "review" | "issue") {
    if (!order) return;
    setBusy(true);
    const { error } =
      kind === "issue"
        ? await supabase.rpc("admin_flag_payment_issue", {
            _order: order.id,
            _note: note || "Payment issue: please contact KasiPool",
          })
        : await supabase.rpc("admin_record_payment", {
            _order: order.id,
            _amount: +(amount || due),
            _channel_ref: chan,
            _note: note,
            _kind: kind,
            _method: how,
          });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success(
      kind === "verified"
        ? "Payment recorded"
        : kind === "review"
          ? "Recorded for review"
          : "Issue flagged",
    );
    qc.invalidateQueries();
    setAmount("");
    setChan("");
    setNote("");
    setMethod("");
    onClose();
  }

  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment: {order?.ref}</DialogTitle>
          <DialogDescription>
            Only record money you have: cash you counted, or an EFT you found in the KasiPool bank
            account. A shop&apos;s screenshot alone is not enough.
          </DialogDescription>
        </DialogHeader>
        <Field label="Paid by">
          <select className={inputCls} value={how} onChange={(e) => setMethod(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="eft">EFT (bank transfer)</option>
          </select>
        </Field>
        <p className="text-sm">
          Outstanding: <b>{money(due)}</b> of {money(order?.total)}
        </p>
        <Field label="Amount received (R)" hint="Leave blank for the full outstanding amount">
          <input
            type="number"
            step="0.01"
            className={inputCls}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={due.toFixed(2)}
          />
        </Field>
        <Field label="Bank / channel transaction reference">
          <input className={inputCls} value={chan} onChange={(e) => setChan(e.target.value)} />
        </Field>
        <Field label="Note">
          <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="grid gap-2 sm:grid-cols-3">
          <Button onClick={() => run("verified")} disabled={busy}>
            Verified payment
          </Button>
          <Button variant="outline" onClick={() => run("review")} disabled={busy}>
            Mismatch / review
          </Button>
          <Button variant="destructive" onClick={() => run("issue")} disabled={busy}>
            Flag issue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
