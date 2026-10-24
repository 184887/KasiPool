import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Container } from "@/components/kp/AppShell";
import { BusinessForm } from "@/components/kp/BusinessForm";
import { Loading } from "@/components/kp/ui";
import { useAuth, safeRedirect } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/onboarding")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Your business details — KasiPool" },
      { name: "description", content: "Add your business profile to start pooling." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { user, business, businessLoading } = useAuth();
  const { redirect } = Route.useSearch();
  const nav = useNavigate();
  useEffect(() => {
    if (business) nav({ to: safeRedirect(redirect), replace: true });
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
          onDone={() => nav({ to: safeRedirect(redirect) })}
        />
      </div>
    </Container>
  );
}
