"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/kp/AppShell";
import { BusinessForm } from "@/components/kp/BusinessForm";
import { Loading, PageHeader, Section } from "@/components/kp/ui";
import { useAuth } from "@/lib/auth";
import { loginToPhone } from "@/lib/phone-auth";

export function Profile() {
  const { user, business, businessLoading, signOut } = useAuth();
  const nav = useRouter();
  if (!user || businessLoading) return <Loading />;

  return (
    <Container className="max-w-2xl space-y-4">
      <PageHeader title="Profile" subtitle={loginToPhone(user.email) ?? user.email ?? undefined} />
      <Section title="Shop details">
        {business ? (
          <BusinessForm userId={user.id} existing={business} onDone={() => {}} />
        ) : (
          <p className="text-sm">
            <Link href="/onboarding" className="font-semibold text-ember underline">
              Add your shop details
            </Link>{" "}
            to start joining pools.
          </p>
        )}
      </Section>
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={async () => {
          await signOut();
          nav.replace("/auth");
        }}
      >
        <LogOut /> Log out
      </Button>
    </Container>
  );
}
