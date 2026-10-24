import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loading, PageHeader, StatusBadge } from "@/components/kp/ui";
import { inputCls } from "@/components/kp/admin";
import { errMsg } from "@/lib/queries";
import { dateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/collections")({
  component: Collections,
});

function Collections() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [codes, setCodes] = useState<Record<string, string>>({});
  const { data, isLoading } = useQuery({
    queryKey: ["admin-collections"],
    queryFn: async () =>
      (
        await supabase
          .from("orders")
          .select("*, businesses(trading_name, rep_name, mobile), pools(unit, products(name))")
          .in("fulfilment_status", ["ready", "collected"])
          .order("ready_at", { ascending: false })
      ).data ?? [],
  });
  if (isLoading) return <Loading />;
  const list = (data ?? []).filter(
    (o) => !q || `${o.ref} ${o.businesses?.trading_name}`.toLowerCase().includes(q.toLowerCase()),
  );

  async function collect(id: string) {
    const { error } = await supabase.rpc("admin_collect", { _order: id, _code: codes[id] ?? "" });
    if (error) return toast.error(errMsg(error));
    toast.success("Goods released — order completed");
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader
        title="Collections"
        subtitle="Verify the customer's collection code before releasing goods"
      />
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          className={inputCls + " h-12 pl-10 text-base"}
          placeholder="Search order number or business"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((o) => (
          <div
            key={o.id}
            className={`rounded-2xl border bg-card p-4 shadow-card ${o.fulfilment_status === "collected" ? "opacity-70" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display text-lg font-bold">{o.ref}</p>
                <p className="text-sm">
                  {o.businesses?.trading_name} · {o.businesses?.rep_name}
                </p>
                <p className="text-xs text-muted-foreground">{o.businesses?.mobile}</p>
              </div>
              <StatusBadge tone={o.fulfilment_status === "ready" ? "success" : "muted"}>
                {o.fulfilment_status === "ready" ? "Ready" : "Collected"}
              </StatusBadge>
            </div>
            <p className="mt-3 rounded-lg bg-muted p-3 text-lg font-bold">
              {o.allocated_qty} × {o.pools?.products?.name}{" "}
              <span className="text-sm font-normal">({o.pools?.unit}s)</span>
            </p>
            {o.fulfilment_status === "ready" ? (
              <div className="mt-3 flex gap-2">
                <input
                  className={inputCls + " h-12 font-mono text-lg uppercase tracking-widest"}
                  placeholder="Code"
                  maxLength={6}
                  value={codes[o.id] ?? ""}
                  onChange={(e) => setCodes({ ...codes, [o.id]: e.target.value })}
                  aria-label="Collection code"
                />
                <Button size="lg" onClick={() => collect(o.id)} disabled={!codes[o.id]}>
                  Release goods
                </Button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Already collected {dateTime(o.collected_at)}
              </p>
            )}
          </div>
        ))}
        {list.length === 0 && (
          <p className="text-sm text-muted-foreground">No orders ready for collection.</p>
        )}
      </div>
    </>
  );
}
