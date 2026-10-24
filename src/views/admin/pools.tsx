"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loading, PageHeader, StatusBadge } from "@/components/kp/ui";
import { DataTable, Td, inputCls } from "@/components/kp/admin";
import { Button } from "@/components/ui/button";
import { money, dateTime, pct } from "@/lib/format";
import { POOL_STATUS } from "@/lib/status";

export function PoolsAdmin() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-pools"],
    queryFn: async () => {
      await supabase.rpc("refresh_pool_states");
      return (
        (
          await supabase
            .from("pools")
            .select("*, products(name), campaigns(name)")
            .order("created_at", { ascending: false })
        ).data ?? []
      );
    },
  });
  const list = (data ?? []).filter(
    (p) =>
      (!status || p.status === status) &&
      (!q || p.products?.name.toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <>
      <PageHeader
        title="Pools"
        actions={
          <Button asChild>
            <Link href="/admin/pools/new">+ New pool</Link>
          </Button>
        }
      />
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          className={inputCls + " max-w-xs"}
          placeholder="Search product"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className={inputCls + " max-w-xs"}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {Object.entries(POOL_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.admin}
            </option>
          ))}
        </select>
      </div>
      {isLoading ? (
        <Loading />
      ) : (
        <DataTable
          head={[
            "Product",
            "Campaign",
            "Status",
            "Price",
            "Pledged",
            "Confirmed",
            "Paid",
            "Closes",
          ]}
          empty={!list.length}
        >
          {list.map((p) => (
            <tr key={p.id} className="hover:bg-muted/40">
              <Td>
                <Link
                  href={`/admin/pools/${p.id}`}
                  className="font-semibold text-ember hover:underline"
                >
                  {p.products?.name}
                </Link>
              </Td>
              <Td className="text-muted-foreground">{p.campaigns?.name ?? "—"}</Td>
              <Td>
                <StatusBadge tone={POOL_STATUS[p.status].tone}>
                  {POOL_STATUS[p.status].admin}
                </StatusBadge>
              </Td>
              <Td className="tabular">{money(p.price)}</Td>
              <Td className="tabular">
                {p.pledged_qty}/{p.min_qty}{" "}
                <span className="text-muted-foreground">({pct(p.pledged_qty, p.min_qty)}%)</span>
              </Td>
              <Td className="tabular">{p.confirmed_qty}</Td>
              <Td className="tabular">{p.paid_qty}</Td>
              <Td>{dateTime(p.closes_at)}</Td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
