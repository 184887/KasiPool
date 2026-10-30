"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";

export default function NotFound() {
  const { t } = useT();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <p className="font-headline text-8xl text-ember">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold">{t("We can't find this page")}</h1>
      <p className="mt-2 text-muted-foreground">
        {t("The link may be old or typed wrong. Try the deals page instead.")}
      </p>
      <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button asChild variant="gold">
          <Link href="/offers">{t("See deals")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">{t("Go home")}</Link>
        </Button>
      </div>
    </div>
  );
}
