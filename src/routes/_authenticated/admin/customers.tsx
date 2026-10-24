import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loading, PageHeader } from "@/components/kp/ui";
import { DataTable, Td, inputCls } from "@/components/kp/admin";
import { money, date } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/customers")({ component: Customers });

function Customers() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const [b, p, o] = await Promise.all([
        supabase.from("businesses").select("*").order("created_at", { ascending: false }),
        supabase.from("participations").select("business_id"),
        supabase
          .from("orders")
          .select("business_id, status, payment_status, fulfilment_status, amount_paid"),
      ]);
      return { biz: b.data ?? [], parts: p.data ?? [], orders: o.data ?? [] };
    },
  });
  const [q, setQ] = useState("");
  const [prov, setProv] = useState("");
  if (isLoading || !data) return <Loading />;
  const list = data.biz.filter(
    (b) =>
      (!prov || b.province === prov) &&
      (!q ||
        `${b.trading_name} ${b.rep_name} ${b.township} ${b.mobile}`
          .toLowerCase()
          .includes(q.toLowerCase())),
  );
  const provinces = [...new Set(data.biz.map((b) => b.province))];
  return (
    <>
      <PageHeader title="Customers" subtitle={`${data.biz.length} registered businesses`} />
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          className={inputCls + " max-w-xs"}
          placeholder="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className={inputCls + " max-w-xs"}
          value={prov}
          onChange={(e) => setProv(e.target.value)}
        >
          <option value="">All provinces</option>
          {provinces.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>
      <DataTable
        head={[
          "Business",
          "Contact",
          "Location",
          "Pools joined",
          "Orders",
          "Unpaid",
          "Collected",
          "Total paid",
          "Registered",
        ]}
        empty={!list.length}
      >
        {list.map((b) => {
          const os = data.orders.filter((o) => o.business_id === b.id);
          return (
            <tr key={b.id}>
              <Td className="font-medium">
                {b.trading_name}
                <p className="text-xs text-muted-foreground">{b.category}</p>
              </Td>
              <Td>
                {b.rep_name}
                <p className="text-xs text-muted-foreground">
                  {b.mobile} {b.email}
                </p>
              </Td>
              <Td>
                {b.township}, {b.city}
                <p className="text-xs text-muted-foreground">{b.province}</p>
              </Td>
              <Td className="tabular">{data.parts.filter((p) => p.business_id === b.id).length}</Td>
              <Td className="tabular">{os.filter((o) => o.status === "confirmed").length}</Td>
              <Td className="tabular">
                {os.filter((o) => o.status === "confirmed" && o.payment_status !== "paid").length}
              </Td>
              <Td className="tabular">
                {os.filter((o) => o.fulfilment_status === "collected").length}
              </Td>
              <Td className="tabular">
                {money(os.reduce((s, o) => s + Number(o.amount_paid), 0))}
              </Td>
              <Td>{date(b.created_at)}</Td>
            </tr>
          );
        })}
      </DataTable>
    </>
  );
}
