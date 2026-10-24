"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Container } from "@/components/kp/AppShell";
import { Loading, EmptyState, PageHeader } from "@/components/kp/ui";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Notifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100)
      ).data ?? [],
  });
  useEffect(() => {
    if (!data?.some((n) => !n.read_at)) return;
    const t = setTimeout(async () => {
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null);
      qc.invalidateQueries({ queryKey: ["unread"] });
    }, 1500);
    return () => clearTimeout(t);
  }, [data, qc]);
  if (isLoading) return <Loading />;
  return (
    <Container className="max-w-2xl">
      <PageHeader title="Notifications" />
      {!data?.length ? (
        <EmptyState
          title="No notifications yet"
          body="We'll let you know when a pool you've joined changes."
        />
      ) : (
        <div className="space-y-2">
          {data.map((n) => (
            <Link
              key={n.id}
              href={n.link ?? "/my-pools"}
              className={cn(
                "block rounded-md border-2 border-ink/20 bg-card p-4",
                !n.read_at && "border-ink bg-gold-soft",
              )}
            >
              <p className="font-semibold">{n.title}</p>
              {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{dateTime(n.created_at)}</p>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
