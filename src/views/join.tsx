"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/kp/AppShell";
import { Loading, PageHeader } from "@/components/kp/ui";
import { supabase } from "@/integrations/supabase/client";
import { errMsg } from "@/lib/queries";

export function JoinByCode() {
  const { code } = useParams<{ code: string }>();
  const nav = useRouter();
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
      nav.replace(`/offers/${data}`);
    });
  }, [code, nav]);

  if (!error) return <Loading />;
  return (
    <Container className="max-w-2xl">
      <PageHeader title="Private group" />
      <p className="rounded-md bg-destructive-soft p-3 text-sm text-destructive">{error}</p>
      <p className="mt-4 text-sm">
        Check the code with the person who sent it, then type it on My Pools.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="gold">
          <Link href="/my-pools">Go to My Pools</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/offers">See deals</Link>
        </Button>
      </div>
    </Container>
  );
}
