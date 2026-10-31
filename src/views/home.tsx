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
import { PinPrompt } from "@/components/kp/PinPrompt";
import { activePoolsQuery, myOrdersQuery, poolDistancesQuery, settingsQuery } from "@/lib/queries";
import { nextAction } from "@/lib/status";
import { useT } from "@/i18n";

export const STEPS = [
  {
    title: "Choose a deal",
    body: "Look at the product, the price and the closing date.",
  },
  {
    title: "Join the pool",
    body: "Choose how many you want. You don't pay yet.",
  },
  {
    title: "Confirm your order",
    body: "When the pool is full, check your total and confirm. Choose cash or bank transfer.",
  },
  {
    title: "Get it, then pay",
    body: "A courier brings your stock to your business. Then you pay.",
  },
];

export function Home() {
  const { t } = useT();
  const { user, business } = useAuth();
  const pools = useQuery(activePoolsQuery);
  const dist = useQuery(poolDistancesQuery(user?.id)).data ?? new Map();
  // Only deals this business can join (too-far ones are on the Deals page)
  const closingSoon = (pools.data ?? [])
    .filter((p) => p.status === "open" && dist.get(p.id)?.in_range !== false)
    .sort((a, b) => +new Date(a.closes_at) - +new Date(b.closes_at))
    .slice(0, 3);

  return (
    <>
      <section className="bg-ink text-paper">
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-10 md:pb-20 md:pt-16">
          {/* Large rings on wide screens, as on the pitch deck cover */}
          <LogoMark className="pointer-events-none absolute right-4 top-1/2 hidden w-[380px] -translate-y-1/2 md:block lg:w-[480px]" />
          <h1>
            <span className="block animate-rise font-display text-5xl font-extrabold tracking-[-0.03em] sm:text-7xl">
              Kasi<span className="text-gold">Pool</span>
            </span>
            <span className="mt-2 block animate-rise font-display text-xl font-bold text-paper/80 [animation-delay:80ms] sm:text-2xl">
              Collective Buying Alliance
            </span>
            <span className="mt-6 block animate-rise font-headline text-6xl [animation-delay:160ms] sm:text-8xl">
              Buy Together.
              <br />
              <span className="text-gold">Profit Better.</span>
            </span>
          </h1>
          <p className="mt-5 max-w-md animate-rise text-lg text-paper/85 [animation-delay:260ms]">
            {t(
              "For local businesses: shops, salons, car washes, bakeries and more. Order together and pay the bulk price. You pay only when your stock arrives.",
            )}
          </p>
          <div className="mt-7 flex animate-rise flex-wrap items-center gap-x-6 gap-y-3 [animation-delay:340ms]">
            <Button asChild size="xl" variant="gold">
              <Link href="/offers">
                {t("See deals")} <ArrowRight />
              </Link>
            </Button>
            <Link
              href="/how-it-works"
              className="inline-flex h-12 items-center font-semibold underline underline-offset-4"
            >
              {t("How it works")}
            </Link>
          </div>
        </div>
      </section>

      {user && <NextStep userId={user.id} />}

      <Container className="pt-8">
        <PinPrompt business={business} className="mb-6" />
        <div className="mb-4 flex items-end justify-between gap-4 border-b-4 border-ink pb-2">
          <h2 className="font-headline text-3xl">{t("Closing soon")}</h2>
          <Link
            href="/offers"
            className="-mb-2 inline-flex min-h-11 items-center gap-1 font-semibold text-ember hover:underline"
          >
            {t("See all deals")} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        {pools.isLoading ? (
          <Loading inline />
        ) : closingSoon.length === 0 ? (
          <EmptyState
            title={t("No open deals right now")}
            body={t("We add new deals often. Come back soon.")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {closingSoon.map((p) => (
              <PoolCard key={p.id} pool={p} distance={dist.get(p.id)} />
            ))}
          </div>
        )}
      </Container>

      <Container className="py-12">
        <h2 className="border-b-4 border-ink pb-2 font-headline text-3xl">{t("How it works")}</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-t-2 border-ink pt-3">
              <span className="font-headline text-5xl text-ember">{i + 1}</span>
              <p className="mt-2 font-display text-xl font-bold">{t(s.title)}</p>
              <p className="mt-1 text-muted-foreground">{t(s.body)}</p>
            </li>
          ))}
        </ol>
      </Container>

      {!user && (
        <Container className="pb-4">
          <div className="rounded-md bg-ink p-8 text-paper md:p-12">
            <h2 className="font-headline text-4xl">{t("Do you run a local business?")}</h2>
            <p className="mt-2 max-w-md text-paper/85">
              {t("Register your business to join pools and get bulk prices.")}
            </p>
            <Button asChild size="xl" variant="gold" className="mt-6">
              <Link href="/auth?mode=register">{t("Register your business")}</Link>
            </Button>
          </div>
        </Container>
      )}
    </>
  );
}

/** Banner for signed-in shops when an order is waiting on them (confirm, pay or confirm delivery). */
function NextStep({ userId }: { userId: string }) {
  const { t } = useT();
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
          <span className="block text-sm font-semibold">{t("Your next step")}</span>
          <span className="font-display text-xl font-bold">
            {t(nextAction(first, payCfg) ?? "")}: {first.pools?.products?.name}
          </span>
          {waiting.length > 1 && (
            <span className="block text-sm">
              {waiting.length === 2
                ? t("and 1 more order needs you")
                : t("and {n} more orders need you", { n: waiting.length - 1 })}
            </span>
          )}
        </p>
        <Button asChild>
          <Link href={waiting.length > 1 ? "/my-pools" : `/orders/${first.id}`}>
            {waiting.length > 1 ? t("Open My Pools") : t("Open order")} <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
