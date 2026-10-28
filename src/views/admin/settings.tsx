"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loading, PageHeader, Section } from "@/components/kp/ui";
import { Field, inputCls } from "@/components/kp/admin";
import { useConfirm } from "@/components/kp/ConfirmDialog";
import { dateTime } from "@/lib/format";
import { settingsQuery, errMsg, type ContactSettings, type PaymentSettings } from "@/lib/queries";
import type { Json } from "@/integrations/supabase/types";

export function Settings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(settingsQuery);
  const [pay, setPay] = useState<PaymentSettings | null | undefined>(null);
  const [contact, setContact] = useState<ContactSettings | null | undefined>(null);
  const [share, setShare] = useState("");
  const [fee, setFee] = useState("0");
  const [email, setEmail] = useState("");
  useEffect(() => {
    if (data) {
      setPay(data.payment);
      setContact(data.contact);
      setShare(String(data.pricing?.discount_share_pct ?? ""));
      setFee(String(data.delivery?.fee_per_order ?? 0));
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
    // Team members sign in at /admin/login with their own email address
    const login = email.trim();
    if (!isEmail(login)) return toast.error("Enter an email address");
    const { error } = await supabase.rpc("admin_set_role", { _email: login, _make_admin: make });
    if (error)
      return toast.error(
        /no account/i.test(error.message) ? "No account with that email" : errMsg(error),
      );
    toast.success(make ? "Admin access granted" : "Admin access removed");
    setEmail("");
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
            KasiPool keeps this share of each deal's discount (list price minus bulk price);
            businesses get the rest. Example at 20%: list R250, bulk R200, so the business pays R210
            and KasiPool keeps R10. A pool's price is fixed when it is published, so changes only
            affect pools published afterwards.
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
            Only enter KasiPool's real, verified business account. Until this is enabled, shops who
            choose EFT are told not to pay yet (cash on delivery still works).
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
            Shown on the Help page and to businesses that forget their PIN.
          </p>
        </Section>

        <Section title="Administrators">
          <p className="mb-3 text-sm text-muted-foreground">
            New team members ask for access at /admin/login (&quot;Ask for admin access&quot;).
            Their request shows here. Only approve people you know: check with them first.
          </p>
          <AdminRequests />
          <p className="mb-1 mt-4 text-sm font-semibold">Give or remove access by email</p>
          <div className="flex gap-2">
            <input
              className={inputCls}
              type="email"
              placeholder="name@kasipool.co.za"
              aria-label="Email address"
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

        <Section title="Delivery">
          <p className="mb-3 text-sm text-muted-foreground">
            One delivery fee per order, added to each order when the business confirms. R0 shows
            businesses &quot;Delivery is free&quot;. Orders already confirmed keep their fee.
          </p>
          <div className="flex items-end gap-2">
            <Field label="Delivery fee per order (R)">
              <input
                className={inputCls}
                type="number"
                min="0"
                step="1"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </Field>
            <Button
              onClick={() => {
                if (!(+fee >= 0)) return toast.error("Enter 0 or more");
                saveKey("delivery", { fee_per_order: +fee });
              }}
            >
              Save
            </Button>
          </div>
        </Section>

        <Section title="Test data">
          <TestData />
        </Section>
      </div>
    </>
  );
}

/** Loose check: something@something.something, no spaces */
export function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export const adminRequestsQuery = {
  queryKey: ["admin-requests"],
  queryFn: async () =>
    (await supabase.from("admin_requests").select("*").eq("status", "pending").order("created_at"))
      .data ?? [],
};

/** Waiting requests for admin access, each with Approve and Decline. */
function AdminRequests() {
  const qc = useQueryClient();
  const { data } = useQuery(adminRequestsQuery);
  const [ask, confirmDialog] = useConfirm();
  const [busy, setBusy] = useState<string | null>(null);

  async function review(
    r: { user_id: string; full_name: string; email: string },
    approve: boolean,
  ) {
    const ok = await ask(
      approve
        ? {
            title: `Make ${r.full_name} an admin?`,
            body: `${r.email} will be able to see every business, order and payment, and change settings.`,
            confirmLabel: "Approve",
          }
        : {
            title: `Decline ${r.full_name}?`,
            body: "They won't get admin access. They can ask again later.",
            confirmLabel: "Decline",
            danger: true,
          },
    );
    if (ok === false) return;
    setBusy(r.user_id);
    const { error } = await supabase.rpc("admin_review_access", {
      _user: r.user_id,
      _approve: approve,
    });
    setBusy(null);
    if (error) return toast.error(errMsg(error));
    toast.success(approve ? `${r.full_name} is now an admin` : "Request declined");
    qc.invalidateQueries({ queryKey: ["admin-requests"] });
  }

  return (
    <>
      {!data?.length ? (
        <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          No requests waiting.
        </p>
      ) : (
        <ul className="divide-y-2 divide-ink/10 rounded-md border-2 border-ink">
          {data.map((r) => (
            <li key={r.user_id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{r.full_name}</p>
                <p className="break-all text-sm text-muted-foreground">{r.email}</p>
                <p className="text-sm text-muted-foreground">Asked {dateTime(r.created_at)}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={busy === r.user_id} onClick={() => review(r, true)}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === r.user_id}
                  onClick={() => review(r, false)}
                >
                  Decline
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {confirmDialog}
    </>
  );
}

/** Reset or remove the test shops and test pools (docs/testing.md). Real data is never touched. */
function TestData() {
  const qc = useQueryClient();
  const [ask, confirmDialog] = useConfirm();
  const [busy, setBusy] = useState(false);

  async function run(load: boolean) {
    const ok = await ask(
      load
        ? {
            title: "Reset the test data?",
            body: "All test shops and test pools are deleted and made again, each pool back at its starting stage. Anything the team did with them is lost. Real shops and deals are not touched.",
            confirmLabel: "Reset test data",
            danger: true,
          }
        : {
            title: "Remove the test data?",
            body: "All test shops and test pools are deleted. Real shops and deals are not touched.",
            confirmLabel: "Remove test data",
            danger: true,
          },
    );
    if (ok === false) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("admin_reset_test_data", { _load: load });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success(data);
    qc.invalidateQueries();
  }

  return (
    <>
      <p className="mb-3 text-sm text-muted-foreground">
        7 test shops (060 000 0001 to 0007, PIN 123456) and 13 test pools, one at each stage, for
        trying the app end to end. Only test shops can see test pools, test shops can only join test
        pools, and the dashboard and reports leave them out. See docs/testing.md.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => run(true)}>
          {busy ? "Working…" : "Reset test data"}
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => run(false)}>
          Remove test data
        </Button>
      </div>
      {confirmDialog}
    </>
  );
}
