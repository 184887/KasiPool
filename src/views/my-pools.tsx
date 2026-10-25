"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/kp/AppShell";
import { PoolProgress } from "@/components/kp/pool-bits";
import { Loading, EmptyState, StatusBadge, PageHeader, SectionTitle } from "@/components/kp/ui";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { settingsQuery, errMsg, myOrdersQuery, type MyOrder } from "@/lib/queries";
import { money, date, dateTime, qty } from "@/lib/format";
import { POOL_STATUS, ORDER_STATUS, nextAction, FULFIL_STATUS, PAYMENT_STATUS } from "@/lib/status";

const PSEL =
  "pools(id, status, unit, price, min_qty, pledged_qty, participant_count, closes_at, payment_deadline, products(name, image_url, pack_size))";

function JoinWithCode() {
  const nav = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  async function go() {
    if (!code.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("claim_pool_invite", { _code: code });
    setBusy(false);
    if (error || !data) return toast.error(errMsg(error));
    nav.push(`/offers/${data}`);
  }
  return (
    <div className="mb-4 flex gap-2">
      <Input
        className="h-11 uppercase"
        placeholder="Got a group code? Type it here"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
      />
      <Button variant="outline" className="h-11" disabled={busy} onClick={go}>
        Join group
      </Button>
    </div>
  );
}

export function MyPools() {
  const { user, business } = useAuth();
  const settings = useQuery(settingsQuery);
  const payCfg = !!settings.data?.payment?.configured;
  const parts = useQuery({
    queryKey: ["my-parts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      await supabase.rpc("refresh_pool_states");
      return (
        (
          await supabase
            .from("participations")
            .select(`*, ${PSEL}`)
            .eq("user_id", user!.id)
            .eq("status", "active")
            .order("created_at", { ascending: false })
        ).data ?? []
      );
    },
  });
  const orders = useQuery(myOrdersQuery(user?.id));

  if (parts.isLoading || orders.isLoading) return <Loading />;
  const all = orders.data ?? [];
  const action = all.filter((o) => nextAction(o, payCfg));
  const inProgress = all.filter(
    (o) => !nextAction(o, payCfg) && o.status === "confirmed" && o.fulfilment_status !== "received",
  );
  const previous = all.filter((o) => !action.includes(o) && !inProgress.includes(o));

  return (
    <Container className="max-w-3xl">
      <PageHeader title="My Pools" subtitle={business?.trading_name} />
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link href="/start-pool">Ask for a deal</Link>
        </Button>
      </div>
      <JoinWithCode />
      {!business && (
        <div className="mb-4 rounded-md bg-warning-soft p-4 text-sm text-warning">
          <Link href="/onboarding" className="font-semibold underline">
            Add your shop details
          </Link>{" "}
          to join a pool.
        </div>
      )}

      {action.length > 0 && (
        <section className="mb-8">
          <SectionTitle>
            <AlertCircle
              className="mr-2 inline size-7 align-[-3px] text-ember"
              aria-hidden="true"
            />
            Your next steps
          </SectionTitle>
          <div className="space-y-3">
            {action.map((o) => (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="flex items-center gap-3 rounded-md border-2 border-ink bg-gold-soft p-3"
              >
                <img
                  src={o.pools?.products?.image_url ?? undefined}
                  alt=""
                  className="size-14 rounded-sm object-cover"
                  width={56}
                  height={56}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{o.pools?.products?.name}</p>
                  <p className="text-sm">
                    {o.quantity} × {money(o.unit_price)}
                    {Number(o.delivery_fee) > 0 && ` + ${money(o.delivery_fee)} delivery`} ={" "}
                    <b>{money(o.total)}</b>
                  </p>
                  {o.pools?.payment_deadline && o.fulfilment_status !== "ready" && (
                    <p className="text-sm text-muted-foreground">
                      Deadline {dateTime(o.pools.payment_deadline)}
                    </p>
                  )}
                </div>
                <span className="rounded-md bg-ink px-3 py-2 text-sm font-bold text-paper">
                  {nextAction(o, payCfg)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <SectionTitle>Active pools</SectionTitle>
        {(parts.data ?? []).length === 0 ? (
          <EmptyState
            title="You are not in any open pools"
            action={
              <Button asChild variant="gold">
                <Link href="/offers">Find a deal</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {parts.data!.map((p) => {
              const pool = p.pools!;
              const st = POOL_STATUS[pool.status];
              return (
                <Link
                  key={p.id}
                  href={`/offers/${pool.id}`}
                  className="block rounded-md border-2 border-ink bg-card p-4"
                >
                  <div className="flex gap-3">
                    <img
                      src={pool.products?.image_url ?? undefined}
                      alt=""
                      className="size-16 rounded-sm object-cover"
                      width={64}
                      height={64}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{pool.products?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        You ordered: <b className="text-foreground">{qty(p.quantity, pool.unit)}</b>{" "}
                        · est. {money(p.quantity * Number(pool.price))}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <StatusBadge tone={st.tone}>{st.customer}</StatusBadge>
                        <span className="text-sm text-muted-foreground">
                          Closes {date(pool.closes_at)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="self-center text-muted-foreground" />
                  </div>
                  <div className="mt-3">
                    <PoolProgress
                      pledged={pool.pledged_qty}
                      target={pool.min_qty}
                      participants={pool.participant_count}
                      unit={pool.unit}
                      size="sm"
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Next: wait for the pool to fill up. You can change your order until it closes.
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {inProgress.length > 0 && (
        <section className="mb-8">
          <SectionTitle>Orders in progress</SectionTitle>
          <OrderList list={inProgress} />
        </section>
      )}

      <section>
        <SectionTitle>Previous orders</SectionTitle>
        {previous.length === 0 ? (
          <p className="text-sm text-muted-foreground">No previous orders yet.</p>
        ) : (
          <OrderList list={previous} />
        )}
      </section>
    </Container>
  );
}

function OrderList({ list }: { list: MyOrder[] }) {
  return (
    <div className="divide-y-2 divide-ink/10 rounded-md border-2 border-ink bg-card">
      {list.map((o) => {
        const label =
          o.fulfilment_status !== "none"
            ? FULFIL_STATUS[o.fulfilment_status]
            : o.status === "confirmed"
              ? PAYMENT_STATUS[o.payment_status]
              : ORDER_STATUS[o.status];
        return (
          <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{o.pools?.products?.name}</p>
              <p className="text-sm text-muted-foreground">
                {o.ref ?? "No reference"} · {qty(o.quantity, o.pools?.unit ?? "")} ·{" "}
                {o.payment_status === "paid" ? `Paid ${money(o.amount_paid)}` : money(o.total)}
                {o.received_at && ` · Received ${date(o.received_at)}`}
              </p>
            </div>
            <StatusBadge tone={label.tone}>{label.label}</StatusBadge>
          </Link>
        );
      })}
    </div>
  );
}
