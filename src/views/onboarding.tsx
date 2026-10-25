"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Container } from "@/components/kp/AppShell";
import { BusinessForm } from "@/components/kp/BusinessForm";
import { Loading } from "@/components/kp/ui";
import { useAuth, safeRedirect } from "@/lib/auth";
import { loginToPhone } from "@/lib/phone-auth";

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
      <div className="rounded-md border-2 border-ink bg-card p-6">
        <p className="text-sm font-bold text-ember">Step 2 of 2</p>
        <h1 className="font-headline text-4xl sm:text-5xl">Tell us about your business</h1>
        <p className="mb-5 mt-1 text-sm text-muted-foreground">
          We need this to deliver your stock and to contact you about your orders.
        </p>
        <BusinessForm
          userId={user.id}
          mobile={loginToPhone(user.email)}
          email={loginToPhone(user.email) ? null : user.email}
          onDone={() => nav.push(safeRedirect(redirect))}
        />
      </div>
    </Container>
  );
}
