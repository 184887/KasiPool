"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/kp/AppShell";
import { Loading, PageHeader, Section } from "@/components/kp/ui";
import { Field, inputCls } from "@/components/kp/admin";
import { useAuth } from "@/lib/auth";
import { errMsg } from "@/lib/queries";
import { sastLocalToIso, isoToSastLocal } from "@/lib/format";

export function StartPool() {
  const nav = useRouter();
  // "Suggest a pool" on the Deals page links here with ?product=<id>
  const suggested = useSearchParams().get("product") ?? "";
  const { business } = useAuth();
  const ref = useQuery({
    queryKey: ["start-pool-refs"],
    queryFn: async () => {
      const p = await supabase.from("products").select("*").eq("active", true).order("name");
      return { products: p.data ?? [] };
    },
  });
  const now = new Date();
  const [f, setF] = useState({
    product_id: suggested,
    unit: "",
    min_qty: "",
    max_qty: "",
    min_per_customer: "1",
    max_per_customer: "",
    opens_at: isoToSastLocal(now.toISOString()),
    closes_at: isoToSastLocal(new Date(+now + 7 * 864e5).toISOString()),
    note: "",
    is_private: false,
  });
  const [busy, setBusy] = useState(false);
  const products = ref.data?.products;
  useEffect(() => {
    // Fill the unit for a suggested product once the product list arrives
    const unit = products?.find((p) => p.id === suggested)?.unit;
    if (unit) setF((prev) => (prev.unit ? prev : { ...prev, unit }));
  }, [products, suggested]);
  if (ref.isLoading || !ref.data) return <Loading />;

  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const v = e.target.value;
      setF((prev) => {
        const next = { ...prev, [k]: v };
        if (k === "product_id")
          next.unit = ref.data!.products.find((p) => p.id === v)?.unit ?? prev.unit;
        return next;
      });
    };

  async function submit() {
    if (!f.product_id) return toast.error("Choose a product");
    if (!(+f.min_qty > 0)) return toast.error("Enter a target quantity");
    setBusy(true);
    const { error } = await supabase.rpc("propose_pool", {
      _product: f.product_id,
      _unit: f.unit,
      _min_qty: +f.min_qty,
      _max_qty: f.max_qty ? +f.max_qty : null,
      _min_per: +f.min_per_customer || 1,
      _max_per: f.max_per_customer ? +f.max_per_customer : null,
      _opens: sastLocalToIso(f.opens_at),
      _closes: sastLocalToIso(f.closes_at),
      _note: f.note || null,
      _private: f.is_private,
    });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success(
      "Pool submitted for review. We'll publish it once the supplier price is confirmed.",
    );
    nav.push("/my-pools");
  }

  if (!business)
    return (
      <Container className="max-w-2xl">
        <PageHeader title="Start a pool" />
        <p className="text-sm">
          <Link href="/onboarding" className="font-semibold underline">
            Complete your business profile
          </Link>{" "}
          to start a pool.
        </p>
      </Container>
    );

  return (
    <Container className="max-w-2xl">
      <PageHeader
        title="Start a pool"
        subtitle="Suggest a product for a group order. We get the supplier's bulk price, then publish the deal for other shops to join."
      />
      <Section>
        <div className="space-y-4">
          <Field label="Product *">
            <select className={inputCls} value={f.product_id} onChange={set("product_id")}>
              <option value="">Select…</option>
              {ref.data.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.pack_size}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Purchasing unit *">
              <input className={inputCls} value={f.unit} onChange={set("unit")} />
            </Field>
            <Field label="Minimum target quantity *">
              <input
                type="number"
                min="1"
                className={inputCls}
                value={f.min_qty}
                onChange={set("min_qty")}
              />
            </Field>
            <Field label="Maximum pool quantity">
              <input
                type="number"
                min="1"
                className={inputCls}
                value={f.max_qty}
                onChange={set("max_qty")}
              />
            </Field>
            <Field label="Minimum per business">
              <input
                type="number"
                min="1"
                className={inputCls}
                value={f.min_per_customer}
                onChange={set("min_per_customer")}
              />
            </Field>
            <Field label="Maximum per business">
              <input
                type="number"
                min="1"
                className={inputCls}
                value={f.max_per_customer}
                onChange={set("max_per_customer")}
              />
            </Field>
            <Field label="Opens (SAST)">
              <input
                type="datetime-local"
                className={inputCls}
                value={f.opens_at}
                onChange={set("opens_at")}
              />
            </Field>
            <Field label="Closes (SAST)">
              <input
                type="datetime-local"
                className={inputCls}
                value={f.closes_at}
                onChange={set("closes_at")}
              />
            </Field>
          </div>
          <p className="text-sm text-muted-foreground">
            The deal will deliver to your area. KasiPool can add nearby areas before publishing.
          </p>
          <Field label="Note (optional)">
            <textarea className={inputCls} rows={3} value={f.note} onChange={set("note")} />
          </Field>
          <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={f.is_private}
              onChange={(e) => setF({ ...f, is_private: e.target.checked })}
            />
            <span>
              <b>Private group:</b> hidden from public Deals. Only people you share the invite link
              or code with can join, wherever they are.
            </span>
          </label>
          <Button variant="gold" size="lg" onClick={submit} disabled={busy}>
            {busy ? "Submitting…" : "Submit for review"}
          </Button>
        </div>
      </Section>
    </Container>
  );
}
