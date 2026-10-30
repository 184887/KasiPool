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
import { useT } from "@/i18n";

export function JoinByCode() {
  const { code } = useParams<{ code: string }>();
  const nav = useRouter();
  const { t, server } = useT();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    supabase.rpc("claim_pool_invite", { _code: code }).then(({ data, error }) => {
      if (error || !data) {
        setError(server(errMsg(error)));
        return toast.error(server(errMsg(error)));
      }
      nav.replace(`/offers/${data}`);
    });
  }, [code, nav, server]);

  if (!error) return <Loading />;
  return (
    <Container className="max-w-2xl">
      <PageHeader title={t("Private group")} />
      <p className="rounded-md bg-destructive-soft p-3 text-sm text-destructive">{error}</p>
      <p className="mt-4 text-sm">
        {t("Check the code with the person who sent it, then type it on My Pools.")}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="gold">
          <Link href="/my-pools">{t("Go to My Pools")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/offers">{t("See deals")}</Link>
        </Button>
      </div>
    </Container>
  );
}
