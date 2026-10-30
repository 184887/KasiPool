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
import { LANGS, useSetLang, useT } from "@/i18n";
import { cn } from "@/lib/utils";

export function Profile() {
  const { user, business, businessLoading, signOut } = useAuth();
  const nav = useRouter();
  const { t, lang } = useT();
  const setLang = useSetLang();
  if (!user || businessLoading) return <Loading />;

  return (
    <Container className="max-w-2xl space-y-4">
      <PageHeader
        title={t("Profile")}
        subtitle={loginToPhone(user.email) ?? user.email ?? undefined}
      />
      <Section title={t("Language")}>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("Language")}>
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              role="radio"
              aria-checked={lang === l.code}
              lang={l.code}
              onClick={() => setLang(l.code)}
              className={cn(
                "h-12 rounded-md border-2 font-bold",
                lang === l.code ? "border-ink bg-gold-soft" : "border-input bg-card",
              )}
            >
              {l.name}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("Saved on this phone. Terms and privacy notice are in English.")}
        </p>
      </Section>
      <Section title={t("Business details")}>
        {business ? (
          <BusinessForm userId={user.id} existing={business} onDone={() => {}} />
        ) : (
          <p className="text-sm">
            <Link href="/onboarding" className="font-semibold text-ember underline">
              {t("Add your business details to start joining pools.")}
            </Link>
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
        <LogOut /> {t("Log out")}
      </Button>
    </Container>
  );
}
