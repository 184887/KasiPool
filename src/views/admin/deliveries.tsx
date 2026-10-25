"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loading, PageHeader, StatusBadge } from "@/components/kp/ui";
import { inputCls } from "@/components/kp/admin";
import { errMsg } from "@/lib/queries";
import { dateTime } from "@/lib/format";
import { mapsUrl } from "@/lib/delivery";
import { FULFIL_STATUS } from "@/lib/status";

type Filter = "open" | "problems" | "done";

/** Orders on their way to shops: record what the courier reports and handle problems. */
export function Deliveries() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("open");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-deliveries"],
    queryFn: async () =>
      (
        await supabase
          .from("orders")
          .select(
            "*, businesses(trading_name, rep_name, mobile), pools(unit, products(name)), delivery_zones(name)",
          )
          .in("fulfilment_status", ["out_for_delivery", "delivered", "received"])
          .order("out_for_delivery_at", { ascending: false })
      ).data ?? [],
  });
  if (isLoading) return <Loading />;
  const all = data ?? [];
  const list = all
    .filter((o) =>
      filter === "problems"
        ? o.problem_reported_at
        : filter === "open"
          ? o.fulfilment_status === "out_for_delivery"
          : o.fulfilment_status !== "out_for_delivery",
    )
    .filter(
      (o) => !q || `${o.ref} ${o.businesses?.trading_name}`.toLowerCase().includes(q.toLowerCase()),
    );
  const problems = all.filter((o) => o.problem_reported_at).length;

  async function run(fn: () => PromiseLike<{ error: unknown }>, ok: string) {
    const { error } = await fn();
    if (error) return toast.error(errMsg(error));
    toast.success(ok);
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader
        title="Deliveries"
        subtitle="Mark orders delivered when the courier confirms, and follow up on problems"
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["open", "Out for delivery"],
            ["problems", `Problems (${problems})`],
            ["done", "Delivered"],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={filter === key ? "default" : "outline"}
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
      </div>
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
        {list.map((o) => {
          const st = FULFIL_STATUS[o.fulfilment_status];
          return (
            <div key={o.id} className="rounded-md border-2 border-ink bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg font-bold">{o.ref}</p>
                  <p className="text-sm">
                    {o.businesses?.trading_name} · {o.businesses?.rep_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{o.businesses?.mobile}</p>
                </div>
                <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
              </div>
              <p className="mt-3 rounded-lg bg-muted p-3 text-lg font-bold">
                {o.allocated_qty} × {o.pools?.products?.name}{" "}
                <span className="text-sm font-normal">({o.pools?.unit}s)</span>
              </p>
              <p className="mt-2 text-sm">
                {o.delivery_address ?? "-"}
                {o.delivery_zones && (
                  <span className="text-muted-foreground"> · {o.delivery_zones.name}</span>
                )}
              </p>
              {mapsUrl(o.delivery_latitude, o.delivery_longitude) && (
                <a
                  href={mapsUrl(o.delivery_latitude, o.delivery_longitude)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ember underline underline-offset-4"
                >
                  <MapPin className="size-4" aria-hidden="true" /> Open in Google Maps
                </a>
              )}
              {o.courier_ref && (
                <p className="text-xs text-muted-foreground">Courier ref {o.courier_ref}</p>
              )}
              {o.received_at && (
                <p className="text-xs text-muted-foreground">
                  Shop confirmed receipt {dateTime(o.received_at)}
                </p>
              )}
              {o.problem_reported_at && (
                <div className="mt-3 rounded-md bg-warning-soft p-3 text-sm text-warning">
                  <p>
                    <b>Problem reported {dateTime(o.problem_reported_at)}:</b> {o.problem_note}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => {
                      const note = window.prompt("Note for the shop (optional)") ?? "";
                      run(
                        () =>
                          supabase.rpc("admin_resolve_delivery_problem", {
                            _order: o.id,
                            _note: note,
                          }),
                        "Problem marked resolved",
                      );
                    }}
                  >
                    Mark resolved
                  </Button>
                </div>
              )}
              {o.fulfilment_status === "out_for_delivery" && (
                <Button
                  size="lg"
                  className="mt-3 w-full"
                  onClick={() =>
                    run(
                      () => supabase.rpc("admin_mark_delivered", { _order: o.id, _note: "" }),
                      "Marked delivered; shop asked to confirm",
                    )
                  }
                >
                  Courier delivered it
                </Button>
              )}
            </div>
          );
        })}
        {list.length === 0 && <p className="text-sm text-muted-foreground">Nothing here.</p>}
      </div>
    </>
  );
}
