"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loading, PageHeader, Section } from "@/components/kp/ui";
import { Field, inputCls } from "@/components/kp/admin";
import { DeliveryZonesAdmin } from "@/components/kp/DeliveryZonesAdmin";
import { settingsQuery, errMsg, type ContactSettings, type PaymentSettings } from "@/lib/queries";
import type { Json } from "@/integrations/supabase/types";
import { phoneToLogin } from "@/lib/phone-auth";

export function Settings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(settingsQuery);
  const [pay, setPay] = useState<PaymentSettings | null | undefined>(null);
  const [contact, setContact] = useState<ContactSettings | null | undefined>(null);
  const [share, setShare] = useState("");
  const [mobile, setMobile] = useState("");
  useEffect(() => {
    if (data) {
      setPay(data.payment);
      setContact(data.contact);
      setShare(String(data.pricing?.discount_share_pct ?? ""));
    }
  }, [data]);
  if (isLoading || !pay) return <Loading />;

  async function saveKey(key: string, value: NonNullable<Json>) {
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) return toast.error(errMsg(error));
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["settings"] });
  }
  async function role(make: boolean) {
    // Accounts sign in by phone; admin_set_role looks them up by their hidden login address
    const login = phoneToLogin(mobile);
    if (!login) return toast.error("Enter a valid South African mobile number");
    const { error } = await supabase.rpc("admin_set_role", { _email: login, _make_admin: make });
    if (error)
      return toast.error(
        /no account/i.test(error.message) ? "No account with that number" : errMsg(error),
      );
    toast.success(make ? "Admin access granted" : "Admin access removed");
    setMobile("");
  }
  const p =
    (k: Exclude<keyof PaymentSettings, "configured">) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setPay({ ...pay, [k]: e.target.value });

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Pricing">
          <p className="mb-3 text-sm text-muted-foreground">
            KasiPool keeps this share of each deal's discount (list price minus bulk price); shops
            get the rest. Example at 20%: list R250, bulk R200, so the shop pays R210 and KasiPool
            keeps R10. A pool's price is fixed when it is published, so changes only affect pools
            published afterwards.
          </p>
          <div className="flex items-end gap-2">
            <Field label="KasiPool share of the discount (%)">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                className={inputCls}
                value={share}
                onChange={(e) => setShare(e.target.value)}
              />
            </Field>
            <Button
              onClick={() => {
                const pct = Number(share);
                if (share === "" || !(pct >= 0 && pct <= 100))
                  return toast.error("Enter a percentage between 0 and 100");
                saveKey("pricing", { discount_share_pct: pct });
              }}
            >
              Save
            </Button>
          </div>
        </Section>

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
            Shown on the Help page and to shops who forget their PIN.
          </p>
        </Section>

        <Section title="Administrators">
          <p className="mb-2 text-sm text-muted-foreground">
            Grant or remove admin access for an existing account, by its mobile number.
          </p>
          <div className="flex gap-2">
            <input
              className={inputCls}
              type="tel"
              placeholder="072 123 4567"
              aria-label="Mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
            <Button onClick={() => role(true)} disabled={!mobile}>
              Grant
            </Button>
            <Button variant="outline" onClick={() => role(false)} disabled={!mobile}>
              Remove
            </Button>
          </div>
        </Section>

        <DeliveryZonesAdmin />
      </div>
    </>
  );
}
