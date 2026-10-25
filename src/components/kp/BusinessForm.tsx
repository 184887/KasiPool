import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { PROVINCES, normaliseSaMobile } from "@/lib/format";
import { errMsg, zonesQuery } from "@/lib/queries";
import { LocationPicker } from "./LocationPicker";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const CATS = [
  "Spaza / tuck shop",
  "General dealer",
  "Takeaway / food vendor",
  "Shebeen / tavern",
  "Hair & beauty",
  "Other",
];

export function BusinessForm({
  userId,
  mobile,
  email,
  existing,
  onDone,
}: {
  userId: string;
  /** Sign-in number, used to pre-fill a new profile */
  mobile?: string | null;
  email?: string | null;
  existing?: Tables<"businesses"> | null;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const zones = useQuery(zonesQuery);
  const [f, setF] = useState({
    trading_name: existing?.trading_name ?? "",
    rep_name: existing?.rep_name ?? "",
    mobile: existing?.mobile ?? mobile ?? "",
    email: existing?.email ?? email ?? "",
    category: existing?.category ?? CATS[0],
    township: existing?.township ?? "",
    city: existing?.city ?? "Cape Town",
    province: existing?.province ?? "Western Cape",
    address: existing?.address ?? "",
    zone_id: existing?.zone_id ?? "",
    deliver_to: existing?.deliver_to ?? "business",
    delivery_address: existing?.delivery_address ?? "",
    delivery_zone_id: existing?.delivery_zone_id ?? "",
    latitude: existing?.latitude ?? (null as number | null),
    longitude: existing?.longitude ?? (null as number | null),
    marketing_opt_in: existing?.marketing_opt_in ?? false,
  });
  const [terms, setTerms] = useState(!!existing);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const mobile = normaliseSaMobile(f.mobile);
    if (!mobile)
      return toast.error(
        "Enter a valid South African mobile number, e.g. 072 123 4567 or +27 72 123 4567",
      );
    if (!f.address.trim() || !f.zone_id)
      return toast.error("Enter your business address and choose its delivery area");
    if (f.deliver_to === "other" && (!f.delivery_address.trim() || !f.delivery_zone_id))
      return toast.error("Enter the delivery address and choose its area");
    if (!terms) return toast.error("Please accept the terms and privacy notice");
    setBusy(true);
    const row = {
      ...f,
      mobile,
      email: f.email || null,
      address: f.address.trim(),
      delivery_address: f.delivery_address.trim() || null,
      delivery_zone_id: f.delivery_zone_id || null,
    };
    const { error } = existing
      ? await supabase.from("businesses").update(row).eq("id", existing.id)
      : await supabase.from("businesses").insert({ ...row, user_id: userId });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    await qc.invalidateQueries({ queryKey: ["my-business"] });
    toast.success("Business profile saved");
    onDone();
  }

  const field = "mt-1 h-12";
  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label htmlFor="tn">Business / trading name *</Label>
        <Input
          id="tn"
          required
          maxLength={100}
          className={field}
          value={f.trading_name}
          onChange={set("trading_name")}
        />
      </div>
      <div>
        <Label htmlFor="rn">Owner or representative name *</Label>
        <Input
          id="rn"
          required
          maxLength={100}
          className={field}
          value={f.rep_name}
          onChange={set("rep_name")}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="mob">Mobile number *</Label>
          <Input
            id="mob"
            required
            type="tel"
            placeholder="072 123 4567"
            className={field}
            value={f.mobile}
            onChange={set("mobile")}
          />
        </div>
        <div>
          <Label htmlFor="em">Email (optional)</Label>
          <Input id="em" type="email" className={field} value={f.email} onChange={set("email")} />
        </div>
      </div>
      <div>
        <Label htmlFor="cat">Business type</Label>
        <select
          id="cat"
          className="mt-1 h-12 w-full rounded-md border border-input bg-card px-3"
          value={f.category}
          onChange={set("category")}
        >
          {CATS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="tw">Cape Town township *</Label>
          <Input
            id="tw"
            required
            className={field}
            placeholder="e.g. Khayelitsha"
            value={f.township}
            onChange={set("township")}
          />
        </div>
        <div>
          <Label htmlFor="ci">City *</Label>
          <Input id="ci" required className={field} value={f.city} onChange={set("city")} />
        </div>
        <div>
          <Label htmlFor="pr">Province *</Label>
          <select
            id="pr"
            className="mt-1 h-12 w-full rounded-md border border-input bg-card px-3"
            value={f.province}
            onChange={set("province")}
          >
            {PROVINCES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>
      <fieldset className="space-y-3 rounded-md border-2 border-ink p-3">
        <legend className="px-1 font-display font-bold">Delivery</legend>
        <div>
          <Label htmlFor="ad">Business address *</Label>
          <textarea
            id="ad"
            required
            rows={2}
            className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2"
            placeholder="Street and number, plus a landmark the driver can find"
            value={f.address}
            onChange={(e) => setF({ ...f, address: e.target.value })}
          />
        </div>
        <ZoneSelect
          id="zn"
          label="Delivery area *"
          value={f.zone_id}
          onChange={(v) => setF({ ...f, zone_id: v })}
          zones={zones.data}
        />
        <LocationPicker
          latitude={f.latitude}
          longitude={f.longitude}
          address={f.address}
          onPick={(l) =>
            setF((prev) => ({
              ...prev,
              latitude: l.latitude,
              longitude: l.longitude,
              address: prev.address.trim() ? prev.address : l.address,
            }))
          }
        />
        <label className="flex items-start gap-3 text-sm">
          <Checkbox
            checked={f.deliver_to === "other"}
            onCheckedChange={(v) => setF({ ...f, deliver_to: v ? "other" : "business" })}
            className="mt-0.5"
          />
          <span>Deliver my stock to a different address</span>
        </label>
        {f.deliver_to === "other" && (
          <>
            <div>
              <Label htmlFor="dad">Delivery address *</Label>
              <textarea
                id="dad"
                required
                rows={2}
                className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2"
                placeholder="Where should the driver drop off your stock?"
                value={f.delivery_address}
                onChange={(e) => setF({ ...f, delivery_address: e.target.value })}
              />
            </div>
            <ZoneSelect
              id="dzn"
              label="Area of the delivery address *"
              value={f.delivery_zone_id}
              onChange={(v) => setF({ ...f, delivery_zone_id: v })}
              zones={zones.data}
            />
          </>
        )}
      </fieldset>
      <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
        <span>Send me deal updates on WhatsApp (marketing opt-in)</span>
        <Switch
          checked={f.marketing_opt_in}
          onCheckedChange={(v) => setF({ ...f, marketing_opt_in: v })}
        />
      </label>
      {!existing && (
        <label className="flex items-start gap-3 text-sm">
          <Checkbox checked={terms} onCheckedChange={(v) => setTerms(!!v)} className="mt-0.5" />
          <span>
            I accept the{" "}
            <a href="/terms" target="_blank" className="font-semibold underline">
              terms
            </a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" className="font-semibold underline">
              privacy notice
            </a>
            .
          </span>
        </label>
      )}
      <Button type="submit" size="xl" variant="gold" className="w-full" disabled={busy}>
        {busy ? "Saving…" : existing ? "Save changes" : "Finish registration"}
      </Button>
    </form>
  );
}

function ZoneSelect({
  id,
  label,
  value,
  onChange,
  zones,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (zoneId: string) => void;
  zones: Tables<"delivery_zones">[] | undefined;
}) {
  const zone = zones?.find((z) => z.id === value);
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        required
        className="mt-1 h-12 w-full rounded-md border border-input bg-card px-3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Choose your area…</option>
        {(zones ?? []).map((z) => (
          <option key={z.id} value={z.id}>
            {z.name}
          </option>
        ))}
      </select>
      {zone?.areas && <p className="mt-1 text-xs text-muted-foreground">Covers: {zone.areas}</p>}
      {zones && zones.length === 0 && (
        <p className="mt-1 text-xs text-warning">
          KasiPool hasn't set up delivery areas yet. Please check back soon.
        </p>
      )}
    </div>
  );
}
