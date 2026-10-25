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
import { errMsg } from "@/lib/queries";
import { LocationPicker } from "./LocationPicker";
import { useQueryClient } from "@tanstack/react-query";

// KasiPool is for every kind of local business, not only spaza shops
export const BUSINESS_TYPES = [
  "Spaza / general dealer",
  "Takeaway / food vendor",
  "Restaurant / catering",
  "Tavern / shebeen",
  "Hair & beauty salon",
  "Car wash",
  "Bakery",
  "Butchery",
  "Fruit & veg",
  "Hardware / building",
  "Clothing",
  "Crèche / school",
  "Church / organisation",
];
const OTHER = "Other";

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
  const [f, setF] = useState({
    trading_name: existing?.trading_name ?? "",
    rep_name: existing?.rep_name ?? "",
    mobile: existing?.mobile ?? mobile ?? "",
    email: existing?.email ?? email ?? "",
    // A type that isn't in the list was typed under "Other"
    category:
      !existing?.category || BUSINESS_TYPES.includes(existing.category)
        ? (existing?.category ?? BUSINESS_TYPES[0])
        : OTHER,
    category_other:
      existing?.category && !BUSINESS_TYPES.includes(existing.category) ? existing.category : "",
    township: existing?.township ?? "",
    city: existing?.city ?? "Cape Town",
    province: existing?.province ?? "Western Cape",
    address: existing?.address ?? "",
    deliver_to: existing?.deliver_to ?? "business",
    delivery_address: existing?.delivery_address ?? "",
    latitude: existing?.latitude ?? (null as number | null),
    longitude: existing?.longitude ?? (null as number | null),
    delivery_latitude: existing?.delivery_latitude ?? (null as number | null),
    delivery_longitude: existing?.delivery_longitude ?? (null as number | null),
    marketing_opt_in: existing?.marketing_opt_in ?? false,
  });
  const [terms, setTerms] = useState(!!existing);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const mobile = normaliseSaMobile(f.mobile);
    if (!mobile) return toast.error("Enter a South African cellphone number, like 072 123 4567");
    if (f.category === OTHER && !f.category_other.trim())
      return toast.error("Tell us what type of business you have");
    if (!f.address.trim()) return toast.error("Enter your business address");
    if (f.latitude == null || f.longitude == null)
      return toast.error("Add a map pin so the driver can find your business");
    if (f.deliver_to === "other" && !f.delivery_address.trim())
      return toast.error("Enter the other address");
    if (f.deliver_to === "other" && (f.delivery_latitude == null || f.delivery_longitude == null))
      return toast.error("Add a map pin for the other address");
    if (!terms) return toast.error("Please accept the terms and privacy notice");
    setBusy(true);
    const { category_other, ...rest } = f;
    const row = {
      ...rest,
      category: f.category === OTHER ? category_other.trim() : f.category,
      mobile,
      email: f.email || null,
      address: f.address.trim(),
      delivery_address: f.deliver_to === "other" ? f.delivery_address.trim() : null,
      delivery_latitude: f.deliver_to === "other" ? f.delivery_latitude : null,
      delivery_longitude: f.deliver_to === "other" ? f.delivery_longitude : null,
    };
    const { error } = existing
      ? await supabase.from("businesses").update(row).eq("id", existing.id)
      : await supabase.from("businesses").insert({ ...row, user_id: userId });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    await qc.invalidateQueries({ queryKey: ["my-business"] });
    await qc.invalidateQueries({ queryKey: ["pool-distances"] });
    toast.success("Saved");
    onDone();
  }

  const field = "mt-1 h-12";
  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label htmlFor="tn">Business name *</Label>
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
        <Label htmlFor="rn">Your name *</Label>
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
          <Label htmlFor="mob">Cellphone number *</Label>
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
        <Label htmlFor="cat">Type of business</Label>
        <select
          id="cat"
          className="mt-1 h-12 w-full rounded-md border border-input bg-card px-3"
          value={f.category}
          onChange={set("category")}
        >
          {[...BUSINESS_TYPES, OTHER].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      {f.category === OTHER && (
        <div>
          <Label htmlFor="cat-other">What type of business? *</Label>
          <Input
            id="cat-other"
            required
            maxLength={60}
            className={field}
            placeholder="e.g. Phone repairs"
            value={f.category_other}
            onChange={set("category_other")}
          />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="tw">Township *</Label>
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
            placeholder="Street, number, and a place nearby the driver can find"
            value={f.address}
            onChange={(e) => setF({ ...f, address: e.target.value })}
          />
        </div>
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
          <span>Deliver my stock to another address</span>
        </label>
        {f.deliver_to === "other" && (
          <>
            <div>
              <Label htmlFor="dad">Other address *</Label>
              <textarea
                id="dad"
                required
                rows={2}
                className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2"
                placeholder="Where must the driver bring your stock?"
                value={f.delivery_address}
                onChange={(e) => setF({ ...f, delivery_address: e.target.value })}
              />
            </div>
            <LocationPicker
              title="Map pin for the other address *"
              hint="The driver uses this pin to find the other address."
              latitude={f.delivery_latitude}
              longitude={f.delivery_longitude}
              address={f.delivery_address}
              onPick={(l) =>
                setF((prev) => ({
                  ...prev,
                  delivery_latitude: l.latitude,
                  delivery_longitude: l.longitude,
                  delivery_address: prev.delivery_address.trim()
                    ? prev.delivery_address
                    : l.address,
                }))
              }
            />
          </>
        )}
      </fieldset>
      <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
        <span>Send me new deals on WhatsApp</span>
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
