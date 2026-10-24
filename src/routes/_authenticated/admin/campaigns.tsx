import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loading, PageHeader, Section, StatusBadge } from "@/components/kp/ui";
import { Field, inputCls } from "@/components/kp/admin";
import { errMsg } from "@/lib/queries";
import { pct } from "@/lib/format";
import { POOL_STATUS } from "@/lib/status";

export const Route = createFileRoute("/_authenticated/admin/campaigns")({ component: Campaigns });

function Campaigns() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: async () =>
      (
        await supabase
          .from("campaigns")
          .select("*, pools(id, status, pledged_qty, min_qty, products(name))")
          .order("created_at", { ascending: false })
      ).data ?? [],
  });
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [sendingCampaign, setSendingCampaign] = useState<string | null>(null);
  if (isLoading) return <Loading />;
  async function create() {
    if (!name.trim()) return;
    const { error } = await supabase
      .from("campaigns")
      .insert({ name: name.trim(), description: desc || null });
    if (error) return toast.error(errMsg(error));
    setName("");
    setDesc("");
    toast.success("Campaign created");
    qc.invalidateQueries();
  }
  async function sendWhatsApp(campaign: { id: string; name: string }) {
    if (
      !window.confirm(
        `Send the approved WhatsApp campaign template for "${campaign.name}" to all businesses that opted in?`,
      )
    )
      return;
    setSendingCampaign(campaign.id);
    try {
      let sent = 0;
      let failed = 0;
      let remaining = 0;
      let retryFailed = true;
      do {
        const { data: result, error } = await supabase.functions.invoke("send-whatsapp-campaign", {
          body: { campaign_id: campaign.id, retry_failed: retryFailed },
        });
        if (error) throw error;
        if (
          !result ||
          !Number.isSafeInteger(result.sent) ||
          !Number.isSafeInteger(result.failed) ||
          !Number.isSafeInteger(result.remaining) ||
          result.sent < 0 ||
          result.failed < 0 ||
          result.remaining < 0
        ) {
          throw new Error("WhatsApp campaign did not return a valid delivery summary.");
        }
        sent += result.sent;
        failed += result.failed;
        remaining = result.remaining;
        retryFailed = false;
      } while (remaining > 0);

      if (failed > 0) {
        toast.error(`WhatsApp campaign sent to ${sent}; ${failed} delivery(s) failed.`);
      } else if (sent === 0) {
        toast.info("There are no opted-in businesses to contact for this campaign.");
      } else {
        toast.success(`WhatsApp campaign sent to ${sent} opted-in business(es).`);
      }
    } catch (error) {
      toast.error(errMsg(error));
    } finally {
      setSendingCampaign(null);
    }
  }
  return (
    <>
      <PageHeader
        title="Campaigns"
        subtitle="Group related product pools. Each pool succeeds or fails on its own."
      />
      <Section title="New campaign" className="mb-4 max-w-xl">
        <div className="space-y-2">
          <Field label="Name">
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="November Spaza Essentials"
            />
          </Field>
          <Field label="Description">
            <input className={inputCls} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </Field>
          <Button onClick={create}>Create campaign</Button>
        </div>
      </Section>
      <div className="grid gap-4 md:grid-cols-2">
        {(data ?? []).map((c) => (
          <Section key={c.id} title={c.name}>
            {c.description && <p className="mb-2 text-sm text-muted-foreground">{c.description}</p>}
            <Button
              className="mb-3"
              variant="outline"
              onClick={() => sendWhatsApp(c)}
              disabled={sendingCampaign === c.id}
            >
              {sendingCampaign === c.id
                ? "Sending WhatsApp campaign…"
                : "Send WhatsApp to opted-in businesses"}
            </Button>
            {c.pools.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pools yet.{" "}
                <Link to="/admin/pools/new" className="text-primary underline">
                  Add one
                </Link>
              </p>
            ) : (
              <ul className="divide-y text-sm">
                {c.pools.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                    <Link
                      to="/admin/pools/$poolId"
                      params={{ poolId: p.id }}
                      className="font-medium hover:text-primary"
                    >
                      {p.products?.name}
                    </Link>
                    <span className="tabular text-muted-foreground">
                      {p.pledged_qty}/{p.min_qty} ({pct(p.pledged_qty, p.min_qty)}%)
                    </span>
                    <StatusBadge tone={POOL_STATUS[p.status].tone}>
                      {POOL_STATUS[p.status].admin}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        ))}
      </div>
    </>
  );
}
