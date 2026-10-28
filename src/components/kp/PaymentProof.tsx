"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { errMsg } from "@/lib/queries";
import { dateTime } from "@/lib/format";

export const PROOF_BUCKET = "payment-proofs";
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_SIDE = 1600;

/** Scale a photo down to a small JPEG so it uploads quickly on paid data */
async function shrink(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const img = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.75));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export type Proof = {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
};

/** The shop's proof of payment: upload one, and see whether KasiPool accepted it */
export function ProofUpload({ orderId, latest }: { orderId: string; latest?: Proof }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function send(file: File) {
    if (!user) return;
    setBusy(true);
    try {
      const body = await shrink(file);
      if (body.size > MAX_BYTES) return toast.error("This file is too big. Please send a photo.");
      const ext =
        body.type === "application/pdf" ? "pdf" : body.type === "image/png" ? "png" : "jpg";
      const path = `${user.id}/${orderId}-${Date.now()}.${ext}`;
      const up = await supabase.storage
        .from(PROOF_BUCKET)
        .upload(path, body, { contentType: body.type || "image/jpeg" });
      if (up.error) return toast.error(errMsg(up.error));
      const { error } = await supabase.rpc("submit_payment_proof", {
        _order: orderId,
        _path: path,
      });
      if (error) return toast.error(errMsg(error));
      toast.success("Sent. We will check it in our bank account.");
      qc.invalidateQueries();
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="mt-4 space-y-2">
      {latest?.status === "pending" && (
        <p className="rounded-md bg-info-soft p-3 text-sm text-info">
          We got your proof of payment ({dateTime(latest.created_at)}). We are checking our bank
          account. Your order shows “Paid” when we find the money.
        </p>
      )}
      {latest?.status === "rejected" && (
        <p className="rounded-md bg-warning-soft p-3 text-sm text-warning">
          We could not accept your last proof: {latest.note}. Please check it and send it again.
        </p>
      )}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        tabIndex={-1}
        onChange={(e) => e.target.files?.[0] && send(e.target.files[0])}
      />
      <Button
        size="lg"
        variant={latest?.status === "pending" ? "outline" : "gold"}
        className="w-full"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        <Upload />
        {busy
          ? "Sending…"
          : latest?.status === "pending"
            ? "Send a different proof"
            : "Upload proof of payment"}
      </Button>
      <p className="text-sm text-muted-foreground">
        A photo or screenshot of your payment slip is fine. You can send it later.
      </p>
    </div>
  );
}
