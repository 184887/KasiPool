"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loading, PageHeader, Section } from "@/components/kp/ui";
import { Field, inputCls } from "@/components/kp/admin";
import { PoolCard } from "@/components/kp/PoolCard";
import { errMsg, settingsQuery } from "@/lib/queries";
import { sastLocalToIso, isoToSastLocal, money } from "@/lib/format";
import { discountSplit } from "@/lib/pricing";

const STEPS = [
  "Campaign",
  "Product & supplier",
  "Pricing",
  "Quantities",
  "Dates & collection",
  "Review & publish",
];

export function NewPool() {
  const nav = useRouter();
  const settings = useQuery(settingsQuery);
  const ref = useQuery({
    queryKey: ["pool-refs"],
    queryFn: async () => {
      const [c, p, s, cp] = await Promise.all([
        supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*").eq("active", true).order("name"),
        supabase.from("suppliers").select("*").eq("active", true).order("name"),
        supabase.from("collection_points").select("*").eq("active", true),
      ]);
      return {
        campaigns: c.data ?? [],
        products: p.data ?? [],
        suppliers: s.data ?? [],
        points: cp.data ?? [],
      };
    },
  });
  const now = new Date();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    campaign_id: "",
    new_campaign: "",
    product_id: "",
    supplier_id: "",
    unit: "carton",
    supplier_cost: "",
    reference_price: "",
    reference_source: "",
    reference_date: "",
    fee_note: "No additional fees",
    min_qty: "",
    max_qty: "",
    min_per_customer: "1",
    max_per_customer: "",
    max_distance_km: "15",
    opens_at: isoToSastLocal(now.toISOString()),
    closes_at: isoToSastLocal(new Date(+now + 7 * 864e5).toISOString()),
    collection_point_id: "",
    fulfilment_note: "",
    confirm_window_hours: "24",
  });
  const [busy, setBusy] = useState(false);
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
  const product = ref.data.products.find((p) => p.id === f.product_id);

  function validate(s: number): string | null {
    if (s === 1 && (!f.product_id || !f.supplier_id || !f.unit))
      return "Select a product, supplier and unit";
    if (s === 2) {
      if (f.reference_price === "" || f.supplier_cost === "")
        return "Enter the supplier's list price and bulk price";
      if (!(+f.supplier_cost >= 0) || !(+f.reference_price > +f.supplier_cost))
        return "The list price must be higher than the bulk price";
    }
    if (s === 3) {
      if (!(+f.min_qty > 0)) return "Enter a minimum quantity";
      if (f.max_qty && +f.max_qty < +f.min_qty) return "Maximum must be at least the minimum";
    }
    if (s === 4) {
      if (new Date(sastLocalToIso(f.closes_at)) <= new Date(sastLocalToIso(f.opens_at)))
        return "Closing must be after opening";
      if (!f.collection_point_id) return "Choose a collection point";
    }
    return null;
  }
  function next() {
    const e = validate(step);
    if (e) return toast.error(e);
    setStep(step + 1);
  }

  async function save(publish: boolean) {
    for (let i = 1; i <= 4; i++) {
      const e = validate(i);
      if (e) {
        setStep(i);
        return toast.error(e);
      }
    }
    setBusy(true);
    try {
      let campaign_id = f.campaign_id || null;
      if (f.new_campaign.trim()) {
        const { data, error } = await supabase
          .from("campaigns")
          .insert({ name: f.new_campaign.trim() })
          .select()
          .single();
        if (error) throw error;
        campaign_id = data.id;
      }
      const { data: pool, error } = await supabase
        .from("pools")
        .insert({
          campaign_id,
          product_id: f.product_id,
          supplier_id: f.supplier_id,
          unit: f.unit,
          // The price is set from the list and bulk prices when the pool is published
          price: null,
          reference_price: +f.reference_price,
          reference_source: f.reference_source || null,
          reference_date: f.reference_date || null,
          fee_note: f.fee_note,
          min_qty: +f.min_qty,
          max_qty: f.max_qty ? +f.max_qty : null,
          min_per_customer: +f.min_per_customer || 1,
          max_per_customer: f.max_per_customer ? +f.max_per_customer : null,
          max_distance_km: +f.max_distance_km || 15,
          opens_at: sastLocalToIso(f.opens_at),
          closes_at: sastLocalToIso(f.closes_at),
          collection_point_id: f.collection_point_id,
          fulfilment_note: f.fulfilment_note || null,
          confirm_window_hours: +f.confirm_window_hours || 24,
        })
        .select()
        .single();
      if (error) throw error;
      const { error: ce } = await supabase
        .from("pool_costs")
        .insert({ pool_id: pool.id, supplier_cost: +f.supplier_cost });
      if (ce) throw ce;
      if (publish) {
        const { error: pe } = await supabase.rpc("admin_publish_pool", { _pool: pool.id });
        if (pe) throw pe;
      }
      toast.success(publish ? "Pool published" : "Draft saved");
      nav.push(`/admin/pools/${pool.id}`);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  const share = settings.data?.pricing?.discount_share_pct ?? 0;
  const split =
    f.reference_price !== "" && f.supplier_cost !== ""
      ? discountSplit(+f.reference_price, +f.supplier_cost, share)
      : null;
  return (
    <>
      <PageHeader title="New pool" subtitle="Create a time-limited deal" />
      <ol className="mb-5 flex gap-1 overflow-x-auto">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              onClick={() => i < step && setStep(i)}
              className={`shrink-0 whitespace-nowrap rounded-sm px-3 py-1.5 text-xs font-bold ${i === step ? "bg-ink text-paper" : i < step ? "bg-leaf-soft text-leaf" : "bg-muted text-muted-foreground"}`}
            >
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>
      <Section className="max-w-2xl">
        <div className="space-y-4">
          {step === 0 && (
            <>
              <Field label="Existing campaign (optional)">
                <select className={inputCls} value={f.campaign_id} onChange={set("campaign_id")}>
                  <option value="">No campaign</option>
                  {ref.data.campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="…or create a new campaign" hint="e.g. November Spaza Essentials">
                <input className={inputCls} value={f.new_campaign} onChange={set("new_campaign")} />
              </Field>
            </>
          )}
          {step === 1 && (
            <>
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
              <Field label="Supplier *" hint="Private: never shown to customers">
                <select className={inputCls} value={f.supplier_id} onChange={set("supplier_id")}>
                  <option value="">Select…</option>
                  {ref.data.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Purchasing unit *">
                <input className={inputCls} value={f.unit} onChange={set("unit")} />
              </Field>
            </>
          )}
          {step === 2 && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Supplier list price per unit (R) *" hint="Their normal price">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={inputCls}
                    value={f.reference_price}
                    onChange={set("reference_price")}
                  />
                </Field>
                <Field label="Supplier bulk price per unit (R) *" hint="Admin only">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={inputCls}
                    value={f.supplier_cost}
                    onChange={set("supplier_cost")}
                  />
                </Field>
              </div>
              {split && (
                <div
                  className={`rounded-md border-2 p-3 text-sm ${split.shopSaving > 0 ? "border-ink bg-muted" : "border-destructive text-destructive"}`}
                >
                  <p>
                    Shops pay <b>{money(split.price)}</b> per {f.unit || "unit"} and save{" "}
                    <b>{money(split.shopSaving)}</b>.
                  </p>
                  <p className="text-muted-foreground">
                    KasiPool keeps {money(split.kasipool)} per unit ({share}% of the discount, set
                    in Settings). The price is fixed when you publish.
                  </p>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Where the list price comes from" hint="e.g. Supplier price list">
                  <input
                    className={inputCls}
                    value={f.reference_source}
                    onChange={set("reference_source")}
                  />
                </Field>
                <Field label="List price date">
                  <input
                    type="date"
                    className={inputCls}
                    value={f.reference_date}
                    onChange={set("reference_date")}
                  />
                </Field>
              </div>
              <Field label="Fees note">
                <input className={inputCls} value={f.fee_note} onChange={set("fee_note")} />
              </Field>
            </>
          )}
          {step === 3 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Minimum target quantity *" hint="Pool closes when reached">
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
              <Field
                label="Max distance from collection point (km)"
                hint="Applies when the collection point has coordinates"
              >
                <input
                  type="number"
                  min="1"
                  className={inputCls}
                  value={f.max_distance_km}
                  onChange={set("max_distance_km")}
                />
              </Field>
            </div>
          )}
          {step === 4 && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
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
              <Field label="Confirmation & payment window (hours)">
                <input
                  type="number"
                  min="1"
                  className={inputCls}
                  value={f.confirm_window_hours}
                  onChange={set("confirm_window_hours")}
                />
              </Field>
              <Field label="Collection point *">
                <select
                  className={inputCls}
                  value={f.collection_point_id}
                  onChange={set("collection_point_id")}
                >
                  <option value="">Select…</option>
                  {ref.data.points.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Expected supplier fulfilment">
                <textarea
                  className={inputCls + " h-20 py-2"}
                  value={f.fulfilment_note}
                  onChange={set("fulfilment_note")}
                />
              </Field>
            </>
          )}
          {step === 5 && product && (
            <div className="grid gap-4 sm:grid-cols-2">
              <PoolCard
                pool={{
                  id: "preview",
                  status: "open",
                  unit: f.unit,
                  price: split?.price ?? null,
                  reference_price: +f.reference_price,
                  min_qty: +f.min_qty,
                  pledged_qty: 0,
                  participant_count: 0,
                  closes_at: sastLocalToIso(f.closes_at),
                  products: product,
                }}
              />
              <div className="space-y-1 text-sm">
                <p className="font-semibold">Customer preview (left)</p>
                <p>
                  Target: {f.min_qty} {f.unit}s{f.max_qty && ` (max ${f.max_qty})`}
                </p>
                <p>
                  List {money(f.reference_price)} · Bulk {money(f.supplier_cost)} · Shop price{" "}
                  {money(split?.price)}
                </p>
                <p className="rounded-lg bg-warning-soft p-2 text-xs text-warning">
                  After publishing, price, unit, product, minimum and reference price are locked.
                  Material changes require cancelling and creating a revised deal.
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 flex flex-wrap justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            Back
          </Button>
          {step < 5 ? (
            <Button onClick={next}>Next</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => save(false)} disabled={busy}>
                Save draft
              </Button>
              <Button onClick={() => save(true)} disabled={busy}>
                Publish
              </Button>
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
