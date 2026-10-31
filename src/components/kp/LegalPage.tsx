"use client";

import type { ReactNode } from "react";
import { useT } from "@/i18n";
import { Container } from "./AppShell";

/** `englishOnly`: the terms and privacy notice stay in English, so say so to isiXhosa readers */
export function LegalPage({
  title,
  englishOnly,
  children,
}: {
  title: string;
  englishOnly?: boolean;
  children: ReactNode;
}) {
  const { t, rich, lang } = useT();
  return (
    <Container className="max-w-3xl">
      <div className="mb-6 rounded-md border-2 border-warning/40 bg-warning-soft p-4 text-sm text-warning">
        {rich(
          "<b>Draft for review.</b> This content is a placeholder and must be reviewed by legal and operational advisers before KasiPool launches.",
          { b: (c) => <b>{c}</b> },
        )}
        {englishOnly && lang !== "en" && (
          <p className="mt-2 font-semibold">{t("This page is only in English.")}</p>
        )}
      </div>
      <h1 className="font-headline text-4xl sm:text-5xl">{title}</h1>
      <div className="mt-6 space-y-4 text-base leading-relaxed [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold">
        {children}
      </div>
    </Container>
  );
}
