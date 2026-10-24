"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/kp/AppShell";
import { PoolCard } from "@/components/kp/PoolCard";
import { Loading, EmptyState } from "@/components/kp/ui";
import { activePoolsQuery, categoriesQuery } from "@/lib/queries";
import { pct } from "@/lib/format";

const sel = "h-11 rounded-lg border border-input bg-card px-3 text-sm";

export function Offers() {
  const { data, isLoading } = useQuery(activePoolsQuery);
  const cats = useQuery(categoriesQuery);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("open");
  const [sort, setSort] = useState("closing");
  let list = (data ?? []).filter(
    (p) =>
      (!status || p.status === status) &&
      (!cat || p.products?.category_id === cat) &&
      (!q || p.products?.name.toLowerCase().includes(q.toLowerCase())),
  );
  list = [...list].sort((a, b) =>
    sort === "closing"
      ? +new Date(a.closes_at) - +new Date(b.closes_at)
      : pct(b.pledged_qty, b.min_qty) - pct(a.pledged_qty, a.min_qty),
  );
  return (
    <Container>
      <h1 className="font-display text-3xl font-bold">Active offers</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Joining is free. You only pay if the pool reaches its target.
      </p>
      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search offers"
          className="h-12 pl-10 text-base"
          aria-label="Search offers"
        />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <select
          className={sel}
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          aria-label="Category"
        >
          <option value="">All categories</option>
          {(cats.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className={sel}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Status"
        >
          <option value="open">Open</option>
          <option value="awaiting_confirmation">Target reached</option>
          <option value="scheduled">Opening soon</option>
          <option value="">All</option>
        </select>
        <select
          className={sel}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort"
        >
          <option value="closing">Closing soonest</option>
          <option value="progress">Most progress</option>
        </select>
      </div>
      <div className="mt-5">
        {isLoading ? (
          <Loading />
        ) : list.length === 0 ? (
          <EmptyState title="No offers match" body="Try changing the filters." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <PoolCard key={p.id} pool={p} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
