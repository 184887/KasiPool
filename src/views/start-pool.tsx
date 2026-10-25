"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/kp/AppShell";
import { Loading, PageHeader, Section } from "@/components/kp/ui";
import { Field, inputCls } from "@/components/kp/admin";
import { useAuth } from "@/lib/auth";
import { activePoolsQuery, errMsg, poolDistancesQuery } from "@/lib/queries";
import { DEFAULT_RADIUS_KM, distanceText } from "@/lib/delivery";
import { sastLocalToIso, isoToSastLocal } from "@/lib/format";

export function StartPool() {
  const nav = useRouter();
  // "Suggest a pool" on the Deals page links here with ?product=<id>
  const suggested = useSearchParams().get("product") ?? "";
  const { user, business } = useAuth();
  const pools = useQuery(activePoolsQuery);
  const dist = useQuery(poolDistancesQuery(user?.id)).data;
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

  // An open deal for the same product that this business can already join
  const nearby = (pools.data ?? [])
    .filter((p) => p.product_id === f.product_id && p.status === "open" && !p.is_sample)
    .map((p) => ({ pool: p, d: dist?.get(p.id) }))
    .filter((x) => x.d?.in_range)
    .sort((a, b) => a.d!.distance_km - b.d!.distance_km)[0];

  async function submit() {
    if (!f.product_id) return toast.error("Choose a product");
    if (!f.unit.trim()) return toast.error("Say how it is sold, like bag or box");
    if (!(+f.min_qty > 0)) return toast.error("Enter how many are needed in total");
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
    toast.success("Sent. We will check the price with the supplier, then open the deal.");
    nav.push("/my-pools");
  }

  if (!business)
    return (
      <Container className="max-w-2xl">
        <PageHeader title="Ask for a deal" />
        <p className="text-sm">
          <Link href="/onboarding" className="font-semibold underline">
            Add your business details
          </Link>{" "}
          to ask for a deal.
        </p>
      </Container>
    );

  return (
    <Container className="max-w-2xl">
      <PageHeader
        title="Ask for a deal"
        subtitle="Tell us what you want to buy with other businesses. We get the price from the supplier, then open the deal."
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sold per (bag, box, case) *">
              <input className={inputCls} value={f.unit} onChange={set("unit")} />
            </Field>
            <Field
              label="How many are needed in total? *"
              hint="All the businesses together. We check this with the supplier."
            >
              <input
                type="number"
                inputMode="numeric"
                min="1"
                className={inputCls}
                value={f.min_qty}
                onChange={set("min_qty")}
              />
            </Field>
            <Field label="Last day to join">
              <input
                type="datetime-local"
                className={inputCls}
                value={f.closes_at}
                onChange={set("closes_at")}
              />
            </Field>
          </div>
          <details className="group rounded-md border-2 border-ink/20">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-3 font-semibold [&::-webkit-details-marker]:hidden">
              More options (not needed)
              <ChevronDown
                className="size-5 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="grid gap-4 border-t-2 border-ink/20 p-3 sm:grid-cols-2">
              <Field label="Most the pool can take">
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  className={inputCls}
                  value={f.max_qty}
                  onChange={set("max_qty")}
                />
              </Field>
              <Field label="Smallest order per business">
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  className={inputCls}
                  value={f.min_per_customer}
                  onChange={set("min_per_customer")}
                />
              </Field>
              <Field label="Biggest order per business">
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  className={inputCls}
                  value={f.max_per_customer}
                  onChange={set("max_per_customer")}
                />
              </Field>
              <Field label="Opens">
                <input
                  type="datetime-local"
                  className={inputCls}
                  value={f.opens_at}
                  onChange={set("opens_at")}
                />
              </Field>
            </div>
          </details>
          {nearby && (
            <p className="rounded-md bg-gold-soft p-3 text-sm text-ink">
              <b>There is already a deal for this product {distanceText(nearby.d!)} away.</b> Join
              it instead, so it fills up faster.{" "}
              <Link
                href={`/offers/${nearby.pool.id}`}
                className="font-semibold text-ember underline"
              >
                See the deal
              </Link>
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Your business is the centre of this deal. Businesses within {DEFAULT_RADIUS_KM} km of
            you can join, so the driver can deliver to all of you.
          </p>
          <Field label="Note (optional)">
            <textarea
              className={inputCls + " h-24 py-2"}
              rows={3}
              placeholder="e.g. We need it before month end"
              value={f.note}
              onChange={set("note")}
            />
          </Field>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border-2 border-ink/20 p-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-5 shrink-0 accent-ink"
              checked={f.is_private}
              onChange={(e) => setF({ ...f, is_private: e.target.checked })}
            />
            <span>
              <b>Private group:</b> other businesses can't see this deal. Only businesses you give
              the code to can join.
            </span>
          </label>
          <Button
            variant="gold"
            size="lg"
            className="w-full sm:w-auto"
            onClick={submit}
            disabled={busy}
          >
            {busy ? "Sending…" : "Send my request"}
          </Button>
        </div>
      </Section>
    </Container>
  );
}
