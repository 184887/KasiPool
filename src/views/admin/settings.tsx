"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loading, PageHeader, Section } from "@/components/kp/ui";
import { Field, inputCls } from "@/components/kp/admin";
import { LocationPicker } from "@/components/kp/LocationPicker";
import { settingsQuery, errMsg, type ContactSettings, type PaymentSettings } from "@/lib/queries";
import type { Json } from "@/integrations/supabase/types";

export function Settings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(settingsQuery);
  const points = useQuery({
    queryKey: ["admin-points"],
    queryFn: async () =>
      (await supabase.from("collection_points").select("*").order("created_at")).data ?? [],
  });
  const [pay, setPay] = useState<PaymentSettings | null | undefined>(null);
  const [contact, setContact] = useState<ContactSettings | null | undefined>(null);
  const [email, setEmail] = useState("");
  const [cp, setCp] = useState({
    name: "",
    area: "",
    address: "",
    instructions: "",
    fee_note: "No collection fee",
    latitude: "",
    longitude: "",
  });
  useEffect(() => {
    if (data) {
      setPay(data.payment);
      setContact(data.contact);
    }
  }, [data]);
  if (isLoading || !pay) return <Loading />;

  async function saveKey(key: string, value: Json) {
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) return toast.error(errMsg(error));
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["settings"] });
  }
  async function role(make: boolean) {
    const { error } = await supabase.rpc("admin_set_role", { _email: email, _make_admin: make });
    if (error) return toast.error(errMsg(error));
    toast.success(make ? "Admin access granted" : "Admin access removed");
    setEmail("");
  }
  async function addPoint() {
    if (!cp.name || !cp.area) return toast.error("Name and area required");
    if (!!cp.latitude !== !!cp.longitude) return toast.error("Enter both latitude and longitude");
    const { error } = await supabase.from("collection_points").insert({
      ...cp,
      latitude: cp.latitude ? +cp.latitude : null,
      longitude: cp.longitude ? +cp.longitude : null,
    });
    if (error) return toast.error(errMsg(error));
    setCp({
      name: "",
      area: "",
      address: "",
      instructions: "",
      fee_note: "No collection fee",
      latitude: "",
      longitude: "",
    });
    qc.invalidateQueries({ queryKey: ["admin-points"] });
  }
  const p =
    (k: Exclude<keyof PaymentSettings, "configured">) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setPay({ ...pay, [k]: e.target.value });

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Payment instructions">
          <p className="mb-3 rounded-lg bg-warning-soft p-3 text-xs text-warning">
            Only enter KasiPool's real, verified business account. Until this is enabled, customers
            see “Payment instructions are not yet available”.
          </p>
          <div className="space-y-2">
            <Field label="Approved payment method">
              <input className={inputCls} value={pay.method} onChange={p("method")} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Bank">
                <input className={inputCls} value={pay.bank} onChange={p("bank")} />
              </Field>
              <Field label="Account name">
                <input className={inputCls} value={pay.account_name} onChange={p("account_name")} />
              </Field>
              <Field label="Account number">
                <input
                  className={inputCls}
                  value={pay.account_number}
                  onChange={p("account_number")}
                />
              </Field>
              <Field label="Branch code">
                <input className={inputCls} value={pay.branch_code} onChange={p("branch_code")} />
              </Field>
            </div>
            <Field label="Notes for customers">
              <input className={inputCls} value={pay.notes} onChange={p("notes")} />
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={pay.configured}
                onChange={(e) => setPay({ ...pay, configured: e.target.checked })}
              />{" "}
              Show these payment instructions to customers
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={pay.online_enabled ?? false}
                onChange={(e) => setPay({ ...pay, online_enabled: e.target.checked })}
              />{" "}
              Offer online payment through Yoco
            </label>
            <Button
              onClick={() => {
                if (pay.configured && (!pay.account_number || !pay.account_name))
                  return toast.error("Enter account name and number before enabling");
                saveKey("payment", pay);
              }}
            >
              Save payment settings
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Yoco API keys and webhook secrets must be configured in Supabase Edge Function secrets;
            never enter them here. Yoco payments are verified by signed webhooks.
          </p>
        </Section>

        <Section title="Contact details (Help page)">
          <div className="space-y-2">
            <Field label="Phone">
              <input
                className={inputCls}
                value={contact?.phone ?? ""}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              />
            </Field>
            <Field label="WhatsApp">
              <input
                className={inputCls}
                value={contact?.whatsapp ?? ""}
                onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <input
                className={inputCls}
                value={contact?.email ?? ""}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
              />
            </Field>
            <Button onClick={() => contact && saveKey("contact", contact)} disabled={!contact}>
              Save contact
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            WhatsApp campaign messages are sent only to businesses that opted in. Configure the
            approved Meta template and API credentials in Supabase Edge Function secrets.
          </p>
        </Section>

        <Section title="Administrators">
          <p className="mb-2 text-sm text-muted-foreground">
            Grant or remove admin access for an existing account.
          </p>
          <div className="flex gap-2">
            <input
              className={inputCls}
              placeholder="user@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={() => role(true)} disabled={!email}>
              Grant
            </Button>
            <Button variant="outline" onClick={() => role(false)} disabled={!email}>
              Remove
            </Button>
          </div>
        </Section>

        <Section title="Collection points">
          <ul className="mb-3 divide-y text-sm">
            {(points.data ?? []).map((x) => (
              <li key={x.id} className="py-2">
                <b>{x.name}</b>
                <p className="text-xs text-muted-foreground">
                  {x.area} · {x.fee_note}
                </p>
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Name">
                <input
                  className={inputCls}
                  value={cp.name}
                  onChange={(e) => setCp({ ...cp, name: e.target.value })}
                />
              </Field>
              <Field label="Area">
                <input
                  className={inputCls}
                  value={cp.area}
                  onChange={(e) => setCp({ ...cp, area: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Instructions">
              <input
                className={inputCls}
                value={cp.instructions}
                onChange={(e) => setCp({ ...cp, instructions: e.target.value })}
              />
            </Field>
            <LocationPicker
              latitude={cp.latitude ? +cp.latitude : null}
              longitude={cp.longitude ? +cp.longitude : null}
              address={cp.address}
              onPick={(l) =>
                setCp({
                  ...cp,
                  latitude: String(l.latitude),
                  longitude: String(l.longitude),
                  address: l.address,
                })
              }
            />
            <Field label="Fee note">
              <input
                className={inputCls}
                value={cp.fee_note}
                onChange={(e) => setCp({ ...cp, fee_note: e.target.value })}
              />
            </Field>
            <Button variant="outline" onClick={addPoint}>
              Add collection point
            </Button>
          </div>
        </Section>
      </div>
    </>
  );
}
