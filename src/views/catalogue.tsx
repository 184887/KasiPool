"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/kp/AppShell";
import { Loading, EmptyState } from "@/components/kp/ui";
import { catalogueQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function Catalogue() {
  const { data, isLoading } = useQuery(catalogueQuery);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const products = (data?.products ?? []).filter(
    (p) =>
      (!cat || p.category_id === cat) &&
      (!q || `${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <Container>
      <h1 className="font-display text-3xl font-bold">Catalogue</h1>
      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products"
          className="h-12 pl-10 text-base"
          aria-label="Search products"
        />
      </div>
      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2">
        {[{ id: null, name: "All" }, ...(data?.categories ?? [])].map((c) => (
          <button
            key={c.id ?? "all"}
            onClick={() => setCat(c.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold",
              cat === c.id ? "border-primary bg-primary text-primary-foreground" : "bg-card",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>
      {isLoading ? (
        <Loading />
      ) : products.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No products found" body="Try another search or category." />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => {
            const pool =
              data!.pools.find((x) => x.product_id === p.id && x.status === "open") ??
              data!.pools.find((x) => x.product_id === p.id);
            return (
              <div
                key={p.id}
                className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card"
              >
                <img
                  src={p.image_url ?? ""}
                  alt={p.name}
                  loading="lazy"
                  className="aspect-square w-full bg-muted object-cover"
                  width={400}
                  height={400}
                />
                <div className="flex flex-1 flex-col p-3">
                  <div className="text-[11px] text-muted-foreground">{p.categories?.name}</div>
                  <p className="mt-0.5 font-display font-bold leading-tight">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.pack_size} · per {p.unit}
                  </p>
                  <p className="text-[11px] text-muted-foreground">SKU {p.sku}</p>
                  <div className="mt-auto pt-3">
                    {pool ? (
                      <Button asChild size="sm" className="w-full">
                        <Link href={`/offers/${pool.id}`}>View Active Pool</Link>
                      </Button>
                    ) : (
                      <p className="rounded-md bg-muted py-2 text-center text-xs font-semibold text-muted-foreground">
                        No Active Offer
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
