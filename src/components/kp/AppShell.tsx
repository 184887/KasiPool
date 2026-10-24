"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bell, Home, LayoutGrid, Tag, Layers, User, Shield, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "./pool-bits";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/catalogue", label: "Catalogue", icon: LayoutGrid },
  { to: "/offers", label: "Offers", icon: Tag },
  { to: "/my-pools", label: "My Pools", icon: Layers },
  { to: "/profile", label: "Profile", icon: User },
] as const;
const MOBILE_NAV = NAV.filter((item) => item.to !== "/offers");

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
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link href="/" aria-label="KasiPool home">
            <Logo />
          </Link>
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {NAV.slice(1).map((n) => (
              <Link
                key={n.to}
                href={n.to}
                aria-current={isActive(n.to) ? "page" : undefined}
                className={cn(
                  "border-b-2 border-transparent rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  isActive(n.to)
                    ? "border-ember text-ember"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {isAdmin && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin">
                  <Shield /> <span className="hidden sm:inline">Admin</span>
                </Link>
              </Button>
            )}
            {user ? (
              <Link
                href="/notifications"
                className="relative grid size-10 place-items-center rounded-full hover:bg-muted"
                aria-label={`Notifications (${unread.data ?? 0} unread)`}
              >
                <Bell className="size-5" />
                {!!unread.data && (
                  <span className="absolute right-1 top-1 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {unread.data}
                  </span>
                )}
              </Link>
            ) : (
              <Button asChild size="sm">
                <Link href="/auth">
                  <LogIn /> Log in / Register
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-16 border-t bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-2 text-muted-foreground">
              Individual businesses. Combined buying power.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold">KasiPool</p>
            <Link
              href="/how-it-works"
              className="block text-muted-foreground hover:text-foreground"
            >
              How it works
            </Link>
            <Link href="/help" className="block text-muted-foreground hover:text-foreground">
              Help & contact
            </Link>
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold">Legal (draft)</p>
            <Link href="/terms" className="block text-muted-foreground hover:text-foreground">
              Terms of use
            </Link>
            <Link href="/privacy" className="block text-muted-foreground hover:text-foreground">
              Privacy notice
            </Link>
          </div>
        </div>
      </footer>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Main"
      >
        {MOBILE_NAV.map((n) => (
          <Link
            key={n.to}
            href={n.to}
            aria-current={isActive(n.to) ? "page" : undefined}
            className={cn(
              "relative flex min-h-14 flex-col items-center justify-center gap-0.5 py-2 text-xs font-semibold",
              isActive(n.to) ? "text-ember" : "text-muted-foreground",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-x-3 top-0 h-[3px] rounded-full",
                isActive(n.to) ? "bg-[#B4501A]" : "bg-transparent",
              )}
            />
            <n.icon className={cn("size-5", isActive(n.to) && "stroke-[2.5]")} aria-hidden="true" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto max-w-6xl px-4 py-6", className)}>{children}</div>;
}
