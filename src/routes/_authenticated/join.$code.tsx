import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Container } from "@/components/kp/AppShell";
import { Loading, PageHeader } from "@/components/kp/ui";
import { supabase } from "@/integrations/supabase/client";
import { errMsg } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/join/$code")({ component: JoinByCode });

function JoinByCode() {
  const { code } = Route.useParams();
  const nav = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    supabase.rpc("claim_pool_invite", { _code: code }).then(({ data, error }) => {
      if (error || !data) {
        setError(errMsg(error));
        return toast.error(errMsg(error));
      }
      nav({ to: "/offers/$poolId", params: { poolId: data }, replace: true });
    });
  }, [code, nav]);

  if (!error) return <Loading />;
  return (
    <Container className="max-w-2xl">
      <PageHeader title="Private group" />
      <p className="text-sm text-destructive">{error}</p>
    </Container>
  );
}
