"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bell, Home, Tag, Layers, User, Shield, Languages } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useSetLang, useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InstallBanner } from "./InstallPrompt";
import { Logo } from "./pool-bits";

// "Deals" is the /offers list (the old Catalogue page redirects there).
const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/offers", label: "Deals", icon: Tag },
  { to: "/my-pools", label: "My Pools", icon: Layers },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function useUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["unread", user?.id],
    enabled: !!user,
    refetchInterval: 60000,
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null);
      return count ?? 0;
    },
  });
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const pathname = usePathname();
  const unread = useUnreadCount();
  const { t, lang } = useT();
  const setLang = useSetLang();
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <header className="sticky top-0 z-40 bg-ink text-paper">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link href="/" aria-label="KasiPool home" className="shrink-0">
            <Logo light />
          </Link>
          <nav className="ml-6 hidden h-full items-stretch gap-1 md:flex" aria-label="Main">
            {NAV.slice(1).map((n) => (
              <Link
                key={n.to}
                href={n.to}
                aria-current={isActive(n.to) ? "page" : undefined}
                className={cn(
                  "flex items-center border-b-4 px-3 pt-1 text-sm font-semibold transition-colors",
                  isActive(n.to)
                    ? "border-gold text-paper"
                    : "border-transparent text-paper/70 hover:text-paper",
                )}
              >
                {t(n.label)}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setLang(lang === "xh" ? "en" : "xh")}
              lang={lang === "xh" ? "en" : "xh"}
              aria-label={lang === "xh" ? "Switch to English" : "Tshintshela kwisiXhosa"}
              className="flex h-11 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-paper/80 transition-colors hover:bg-paper/10 hover:text-paper"
            >
              <Languages className="size-4" aria-hidden="true" />
              <span>{lang === "xh" ? "English" : "isiXhosa"}</span>
            </button>
            {/* Only the KasiPool team sees this; they go to /admin/login directly */}
            {isAdmin && (
              <Link
                href="/admin"
                aria-label="Admin"
                className="flex h-11 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-paper/80 transition-colors hover:bg-paper/10 hover:text-paper"
              >
                <Shield className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            {user ? (
              <Link
                href="/notifications"
                className="relative grid size-11 place-items-center rounded-md transition-colors hover:bg-paper/10"
                aria-label={t("Notifications ({n} unread)", { n: unread.data ?? 0 })}
              >
                <Bell className="size-5" />
                {!!unread.data && (
                  <span className="absolute right-1 top-1 grid min-w-5 place-items-center rounded-sm bg-gold px-1 text-[11px] font-bold text-ink">
                    {unread.data}
                  </span>
                )}
              </Link>
            ) : (
              pathname !== "/auth" && (
                <Button asChild size="sm" variant="gold">
                  <Link href="/auth">{t("Log in")}</Link>
                </Button>
              )
            )}
          </div>
        </div>
      </header>
      <InstallBanner />
      <main key={pathname} className="flex-1 animate-enter">
        {children}
      </main>
      <footer className="mt-16 border-t-4 border-ink">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-3 font-semibold">Collective Buying Alliance</p>
            <p className="font-semibold">Buy Together. Profit Better.</p>
          </div>
          <div className="space-y-1.5">
            <p className="font-bold">KasiPool</p>
            <FooterLink href="/how-it-works">{t("How it works")}</FooterLink>
            <FooterLink href="/help">{t("Help & contact")}</FooterLink>
          </div>
          <div className="space-y-1.5">
            <p className="font-bold">{t("Legal (draft)")}</p>
            <FooterLink href="/terms">{t("Terms of use")}</FooterLink>
            <FooterLink href="/privacy">{t("Privacy notice")}</FooterLink>
          </div>
        </div>
      </footer>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t-2 border-ink bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Main"
      >
        {NAV.map((n) => (
          <Link
            key={n.to}
            href={n.to}
            aria-current={isActive(n.to) ? "page" : undefined}
            className={cn(
              "relative flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-sm font-bold transition-colors active:bg-ink/5",
              isActive(n.to) ? "text-ink" : "text-muted-foreground",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-x-4 top-0 h-1 transition-colors",
                isActive(n.to) ? "bg-gold" : "bg-transparent",
              )}
            />
            <n.icon className={cn("size-6", isActive(n.to) && "stroke-[2.5]")} aria-hidden="true" />
            {t(n.label)}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="block text-muted-foreground hover:text-ink hover:underline">
      {children}
    </Link>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto max-w-6xl px-4 py-6", className)}>{children}</div>;
}
