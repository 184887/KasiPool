import type { ReactNode } from "react";
import { Container } from "./AppShell";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Container className="max-w-3xl">
      <div className="mb-6 rounded-md border-2 border-warning/40 bg-warning-soft p-4 text-sm text-warning">
        <b>Draft for review.</b> This content is a placeholder and must be reviewed by legal and
        operational advisers before KasiPool launches.
      </div>
      <h1 className="font-headline text-4xl sm:text-5xl">{title}</h1>
      <div className="mt-6 space-y-4 text-base leading-relaxed [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold">
        {children}
      </div>
    </Container>
  );
}
