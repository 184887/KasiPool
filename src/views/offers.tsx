"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/kp/AppShell";
import { PoolCard } from "@/components/kp/PoolCard";
import { Loading, EmptyState } from "@/components/kp/ui";
import { activePoolsQuery, catalogueQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

/** Deals: open and upcoming pools, plus products that have no pool yet. */
export function Offers() {
  const pools = useQuery(activePoolsQuery);
  const cat = useQuery(catalogueQuery);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const term = q.trim().toLowerCase();
  const matches = (p: { name: string; category_id: string | null } | null | undefined) =>
    !!p &&
    (!category || p.category_id === category) &&
    (!term || p.name.toLowerCase().includes(term));
  const byClosing = (a: { closes_at: string }, b: { closes_at: string }) =>
    +new Date(a.closes_at) - +new Date(b.closes_at);

  const all = pools.data ?? [];
  const openNow = all.filter((p) => p.status === "open" && matches(p.products)).sort(byClosing);
  const soon = all.filter((p) => p.status === "scheduled" && matches(p.products)).sort(byClosing);
  const withDeal = new Set((cat.data?.pools ?? []).map((p) => p.product_id));
  const noDeal = (cat.data?.products ?? []).filter((p) => !withDeal.has(p.id) && matches(p));

  const loading = pools.isLoading || cat.isLoading;
  const nothing = !loading && openNow.length + soon.length + noDeal.length === 0;

  return (
    <Container>
      <h1 className="font-headline text-5xl">Deals</h1>
      <p className="mt-1 text-muted-foreground">
        Joining is free. You only pay if the pool reaches its target.
      </p>
      <div className="relative mt-5">
        <Search
          className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products"
          className="h-12 border-2 border-ink pl-10 text-base"
          aria-label="Search products"
        />
      </div>
      <div
        className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2"
        role="group"
        aria-label="Category"
      >
        {[{ id: null, name: "All" }, ...(cat.data?.categories ?? [])].map((c) => (
          <button
            key={c.id ?? "all"}
            type="button"
            onClick={() => setCategory(c.id)}
            aria-pressed={category === c.id}
            className={cn(
              "h-11 shrink-0 rounded-sm border-2 border-ink px-4 text-sm font-bold",
              category === c.id ? "bg-ink text-paper" : "bg-card text-ink",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : nothing ? (
        <div className="mt-6">
          {term || category ? (
            <EmptyState title="Nothing matches" body="Try another search or category." />
          ) : (
            <EmptyState
              title="No deals yet"
              body="New deals are added regularly. Check back soon."
            />
          )}
        </div>
      ) : (
        <>
          <DealSection title="Open now" count={openNow.length}>
            {openNow.length === 0 ? (
              <EmptyState
                title="No open deals right now"
                body="New deals are added regularly. Check back soon."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {openNow.map((p) => (
                  <PoolCard key={p.id} pool={p} />
                ))}
              </div>
            )}
          </DealSection>

          {soon.length > 0 && (
            <DealSection title="Opening soon" count={soon.length}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {soon.map((p) => (
                  <PoolCard key={p.id} pool={p} />
                ))}
              </div>
            </DealSection>
          )}

          {noDeal.length > 0 && (
            <DealSection title="No deal yet" count={noDeal.length}>
              <p className="-mt-2 mb-3 text-muted-foreground">
                Want one of these? Suggest a pool and other shops can join it.
              </p>
              <ul className="divide-y-2 divide-ink/10 rounded-md border-2 border-ink bg-card">
                {noDeal.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 p-3">
                    <img
                      src={p.image_url ?? ""}
                      alt=""
                      loading="lazy"
                      className="size-14 shrink-0 rounded-sm bg-muted object-cover"
                      width={56}
                      height={56}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold leading-tight">{p.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.pack_size} · per {p.unit}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/start-pool?product=${p.id}`}>Suggest a pool</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </DealSection>
          )}
        </>
      )}
    </Container>
  );
}

function DealSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-4 flex items-baseline gap-2 border-b-4 border-ink pb-2 font-headline text-3xl">
        {title}
        <span className="font-sans text-base font-bold text-muted-foreground">{count}</span>
      </h2>
      {children}
    </section>
  );
}
