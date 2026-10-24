"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Container } from "@/components/kp/AppShell";
import { BusinessForm } from "@/components/kp/BusinessForm";
import { Loading } from "@/components/kp/ui";
import { useAuth, safeRedirect } from "@/lib/auth";

export function Onboarding() {
  const { user, business, businessLoading } = useAuth();
  const redirect = useSearchParams().get("redirect") ?? undefined;
  const nav = useRouter();
  useEffect(() => {
    if (business) nav.replace(safeRedirect(redirect));
  }, [business, nav, redirect]);
  if (!user || businessLoading) return <Loading />;
  return (
    <Container className="max-w-xl">
      <div className="rounded-3xl border bg-card p-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Step 2 of 2</p>
        <h1 className="font-display text-2xl font-bold">Tell us about your business</h1>
        <p className="mb-5 mt-1 text-sm text-muted-foreground">
          This helps us arrange collection and contact you about your orders.
        </p>
        <BusinessForm
          userId={user.id}
          email={user.email}
          onDone={() => nav.push(safeRedirect(redirect))}
        />
      </div>
    </Container>
  );
}
