"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <h1 className="font-headline text-4xl">{t("This page didn't load")}</h1>
      <p className="mt-2 text-muted-foreground">
        {t("It may be your connection. Check your data or Wi-Fi, then try again.")}
      </p>
      <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button variant="gold" onClick={reset}>
          {t("Try again")}
        </Button>
        <Button asChild variant="outline">
          <Link href="/">{t("Go home")}</Link>
        </Button>
      </div>
    </div>
  );
}
