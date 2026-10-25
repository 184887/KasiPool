"use client";

import Link from "next/link";
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

export function Campaigns() {
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
            {c.pools.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pools yet.{" "}
                <Link href="/admin/pools/new" className="text-ember underline">
                  Add one
                </Link>
              </p>
            ) : (
              <ul className="divide-y text-sm">
                {c.pools.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                    <Link
                      href={`/admin/pools/${p.id}`}
                      className="font-medium hover:text-ember hover:underline"
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
