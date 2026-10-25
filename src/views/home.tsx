"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/kp/AppShell";
import { PoolCard } from "@/components/kp/PoolCard";
import { LogoMark } from "@/components/kp/pool-bits";
import { Loading, EmptyState } from "@/components/kp/ui";
import { useAuth } from "@/lib/auth";
import { activePoolsQuery, myOrdersQuery, settingsQuery } from "@/lib/queries";
import { nextAction } from "@/lib/status";

export const STEPS = [
  {
    title: "Choose a deal",
    body: "Check the product, pack size, price, deadline and delivery areas.",
  },
  {
    title: "Join the pool",
    body: "Choose your quantity. Joining shows interest; it is not a payment.",
  },
  {
    title: "Confirm & pay",
    body: "If the pool reaches its target, check your total, then pay.",
  },
  {
    title: "Get it delivered",
    body: "A courier brings your stock to your shop.",
  },
];

export function Home() {
  const { user } = useAuth();
  const pools = useQuery(activePoolsQuery);
  const closingSoon = (pools.data ?? [])
    .filter((p) => p.status === "open")
    .sort((a, b) => +new Date(a.closes_at) - +new Date(b.closes_at))
    .slice(0, 3);

  return (
    <>
      <section className="bg-ink text-paper">
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-10 md:pb-20 md:pt-16">
          {/* Large rings on wide screens, as on the pitch deck cover */}
          <LogoMark className="pointer-events-none absolute right-4 top-1/2 hidden w-[380px] -translate-y-1/2 md:block lg:w-[480px]" />
          <h1>
            <span className="block font-display text-5xl font-extrabold tracking-[-0.03em] sm:text-7xl">
              Kasi<span className="text-gold">Pool</span>
            </span>
            <span className="mt-2 block font-display text-xl font-bold text-paper/80 sm:text-2xl">
              Collective Buying Alliance
            </span>
            <span className="mt-6 block font-headline text-6xl sm:text-8xl">
              Buy Together.
              <br />
              <span className="text-gold">Profit Better.</span>
            </span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-paper/85">
            For spaza shops, tuck shops and local traders: join one big order and get the bulk
            price. Joining is free.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Button asChild size="xl" variant="gold">
              <Link href="/offers">
                See deals <ArrowRight />
              </Link>
            </Button>
            <Link href="/how-it-works" className="font-semibold underline underline-offset-4">
              How it works
            </Link>
          </div>
        </div>
      </section>

      {user && <NextStep userId={user.id} />}

      <Container className="pt-8">
        <div className="mb-4 flex items-end justify-between gap-4 border-b-4 border-ink pb-2">
          <h2 className="font-headline text-3xl">Closing soon</h2>
          <Link href="/offers" className="font-semibold text-ember">
            See all deals <ArrowRight className="inline size-4" aria-hidden="true" />
          </Link>
        </div>
        {pools.isLoading ? (
          <Loading />
        ) : closingSoon.length === 0 ? (
          <EmptyState
            title="No open deals right now"
            body="New deals are added regularly. Check back soon."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {closingSoon.map((p) => (
              <PoolCard key={p.id} pool={p} />
            ))}
          </div>
        )}
      </Container>

      <Container className="py-12">
        <h2 className="border-b-4 border-ink pb-2 font-headline text-3xl">How it works</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-t-2 border-ink pt-3">
              <span className="font-headline text-5xl text-ember">{i + 1}</span>
              <p className="mt-2 font-display text-xl font-bold">{s.title}</p>
              <p className="mt-1 text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 rounded-md bg-leaf-soft p-4 font-semibold text-leaf">
          Joining is free. You only pay if the pool reaches its target. If it doesn&apos;t, you owe
          nothing.
        </p>
      </Container>

      {!user && (
        <Container className="pb-4">
          <div className="rounded-md bg-ink p-8 text-paper md:p-12">
            <h2 className="font-headline text-4xl">Run a local business?</h2>
            <p className="mt-2 max-w-md text-paper/85">
              Register your business to join pools and get bulk prices.
            </p>
            <Button asChild size="xl" variant="gold" className="mt-6">
              <Link href="/auth?mode=register">Register your business</Link>
            </Button>
          </div>
        </Container>
      )}
    </>
  );
}

/** Banner for signed-in shops when an order is waiting on them (confirm, pay or confirm delivery). */
function NextStep({ userId }: { userId: string }) {
  const orders = useQuery(myOrdersQuery(userId));
  const settings = useQuery(settingsQuery);
  const payCfg = !!settings.data?.payment?.configured;
  const waiting = (orders.data ?? []).filter((o) => nextAction(o, payCfg));
  if (waiting.length === 0) return null;
  const first = waiting[0];
  return (
    <div className="border-b-4 border-ink bg-gold">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 text-ink">
        <p className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Your next step</span>
          <span className="font-display text-xl font-bold">
            {nextAction(first, payCfg)}: {first.pools?.products?.name}
          </span>
          {waiting.length > 1 && (
            <span className="block text-sm">
              and {waiting.length - 1} more {waiting.length === 2 ? "order needs" : "orders need"}{" "}
              you
            </span>
          )}
        </p>
        <Button asChild>
          <Link href={waiting.length > 1 ? "/my-pools" : `/orders/${first.id}`}>
            {waiting.length > 1 ? "Open My Pools" : "Open order"} <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
