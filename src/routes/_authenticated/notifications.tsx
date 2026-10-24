import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Container } from "@/components/kp/AppShell";
import { Loading, EmptyState, PageHeader } from "@/components/kp/ui";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — KasiPool" },
      { name: "description", content: "Your KasiPool updates." },
    ],
  }),
  component: Notifications,
});

function Notifications() {
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
              to={n.link ?? "/my-pools"}
              className={cn(
                "block rounded-xl border bg-card p-4",
                !n.read_at && "border-primary/40 bg-primary-soft",
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
