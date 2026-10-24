"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, BadgeCheck, PackageCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/kp/AppShell";
import { PoolCard } from "@/components/kp/PoolCard";
import { PoolProgress } from "@/components/kp/pool-bits";
import { Loading, EmptyState } from "@/components/kp/ui";
import { activePoolsQuery, catalogueQuery } from "@/lib/queries";

export const STEPS = [
  {
    icon: Search,
    title: "Choose an offer",
    body: "Check the product, pack size, price, deadline and collection details.",
  },
  {
    icon: Users,
    title: "Join the pool",
    body: "Choose your quantity. Joining shows interest; it is not a payment.",
  },
  {
    icon: BadgeCheck,
    title: "Confirm & pay",
    body: "If the offer is confirmed, review your total before you pay.",
  },
  {
    icon: PackageCheck,
    title: "Collect your stock",
    body: "Pick up at the collection point with your code.",
  },
];

export function Home() {
  const pools = useQuery(activePoolsQuery);
  const cat = useQuery(catalogueQuery);
  const open = (pools.data ?? []).filter((p) => p.status === "open");
  const closingSoon = [...open]
    .sort((a, b) => +new Date(a.closes_at) - +new Date(b.closes_at))
    .slice(0, 3);
  const hero = open[0];

  return (
    <>
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-semibold">
              For spaza shops, tuck shops & local traders
            </p>
            <h1 className="font-display text-[2rem] font-extrabold leading-9 sm:text-5xl sm:leading-[1.05]">
              Individual businesses.
              <br />
              <span className="text-gold-light">Combined buying power.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-primary-foreground/85">
              KasiPool brings small business orders together into one coordinated purchase. Choose
              an offer, select your quantity and we coordinate the rest.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="xl" variant="gold">
                <Link href="/offers">
                  See open offers <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="xl" variant="heroOutline">
                <Link href="/how-it-works">How It Works</Link>
              </Button>
            </div>
          </div>
          {hero && (
            <Link
              href={`/offers/${hero.id}`}
              className="block rounded-3xl bg-card p-5 text-card-foreground shadow-lift"
            >
              <div className="flex items-center gap-4">
                <img
                  src={hero.products?.image_url ?? ""}
                  alt=""
                  className="size-20 rounded-2xl object-cover"
                  width={80}
                  height={80}
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Open pool
                  </p>
                  <p className="font-display text-xl font-bold">{hero.products?.name}</p>
                  <p className="text-sm text-muted-foreground">{hero.products?.pack_size}</p>
                </div>
              </div>
              <div className="mt-5">
                <PoolProgress
                  pledged={hero.pledged_qty}
                  target={hero.min_qty}
                  participants={hero.participant_count}
                  unit={hero.unit}
                />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Joining adds your requested quantity to the shared total. No payment is due now.
              </p>
            </Link>
          )}
        </div>
      </section>

      <Container>
        <div className="mb-4 mt-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold">Active offers</h2>
          <Link href="/offers" className="text-sm font-semibold text-ember">
            See all →
          </Link>
        </div>
        {pools.isLoading ? (
          <Loading />
        ) : open.length === 0 ? (
          <EmptyState
            title="No open offers right now"
            body="New deals are added regularly. Check back soon."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {open.slice(0, 6).map((p) => (
              <PoolCard key={p.id} pool={p} />
            ))}
          </div>
        )}
      </Container>

      <section id="how" className="bg-primary-soft">
        <Container className="py-12">
          <h2 className="text-center font-display text-3xl font-bold">How KasiPool works</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl bg-card p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <s.icon className="size-5" />
                  </span>
                  <span className="font-display text-3xl font-extrabold text-gold">{i + 1}</span>
                </div>
                <p className="mt-3 font-display text-lg font-bold">{s.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {closingSoon.length > 0 && (
        <Container className="py-10">
          <h2 className="mb-4 font-display text-2xl font-bold">Closing soon</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {closingSoon.map((p) => (
              <PoolCard key={p.id} pool={p} />
            ))}
          </div>
        </Container>
      )}

      <Container className="py-6">
        <div className="grid gap-6 rounded-3xl border bg-card p-6 shadow-card md:grid-cols-2 md:p-10">
          <div>
            <h2 className="font-display text-2xl font-bold">Why pool your buying?</h2>
            <p className="mt-3 text-muted-foreground">
              KasiPool brings together what several businesses want to buy and coordinates one
              larger purchase. Each business chooses its own quantity and pays only for its
              confirmed order.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              You only pay once a pool reaches its target. If it doesn't, nothing is owed.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">Featured products</h3>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {(cat.data?.products ?? []).slice(0, 8).map((p) => (
                <Link
                  key={p.id}
                  href="/catalogue"
                  className="overflow-hidden rounded-xl bg-muted"
                  title={p.name}
                >
                  <img
                    src={p.image_url ?? ""}
                    alt={p.name}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                    width={120}
                    height={120}
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Container>

      <Container className="py-10">
        <div className="rounded-3xl bg-hero p-8 text-center text-primary-foreground md:p-12">
          <h2 className="font-display text-3xl font-bold">Run a local business?</h2>
          <p className="mx-auto mt-2 max-w-md text-primary-foreground/85">
            Create a business account to browse offers and join a pool.
          </p>
          <Button asChild size="xl" variant="gold" className="mt-6">
            <Link href="/auth?mode=register">Register your business</Link>
          </Button>
        </div>
      </Container>
    </>
  );
}
