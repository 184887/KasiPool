"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, type ReactNode } from "react";
import {
  LayoutDashboard,
  Layers,
  Package,
  Truck,
  CreditCard,
  PackageCheck,
  Users,
  BarChart3,
  Settings,
  Megaphone,
  UserCog,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/kp/pool-bits";
import { Loading } from "@/components/kp/ui";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/pools", label: "Pools", icon: Layers },
  { to: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/suppliers", label: "Suppliers", icon: Truck },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/deliveries", label: "Deliveries", icon: PackageCheck },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/account", label: "Account", icon: UserCog },
] as const;

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const nav = useRouter();
  const { user, loading } = useAuth();
  const isLogin = pathname === "/admin/login";
  const allowed = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user && !isLogin,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      return !!data;
    },
  });
  // Signed out or not an admin: send to the team login, which explains what to do
  useEffect(() => {
    if (isLogin || loading) return;
    if (!user || allowed.data === false)
      nav.replace(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
  }, [isLogin, loading, user, allowed.data, nav, pathname]);
  const active = (to: string) =>
    to === "/admin" ? pathname === "/admin" : pathname.startsWith(to);
  // Phones: keep the current tab visible in the scrolling tab bar
  const tabs = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tabs.current
      ?.querySelector<HTMLElement>("[aria-current=page]")
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname, allowed.data]);
  if (isLogin) return <>{children}</>;
  if (!allowed.data) return <Loading />;
  return (
    <div className="min-h-screen">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar p-4 text-sidebar-foreground lg:flex">
          <Logo light />
          <p className="mt-1 text-xs text-sidebar-foreground/60">Operations</p>
          <nav className="mt-6 space-y-0.5">
            {NAV.map((n) => (
              <Link
                key={n.to}
                href={n.to}
                aria-current={active(n.to) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active(n.to)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60",
                )}
              >
                <n.icon className="size-4" /> {n.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/"
            className="mt-auto flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <ArrowLeft className="size-4" /> Back to the app
          </Link>
        </aside>
        <div className="min-w-0 flex-1">
          <nav
            ref={tabs}
            aria-label="Admin"
            className="no-scrollbar sticky top-0 z-30 flex gap-1 overflow-x-auto border-b-4 border-gold bg-sidebar px-2 py-2 lg:hidden"
          >
            <Link
              href="/"
              aria-label="Back to the app"
              className="flex h-11 shrink-0 items-center gap-1 rounded-md px-3 text-sm font-semibold text-sidebar-foreground/70"
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> App
            </Link>
            {NAV.map((n) => (
              <Link
                key={n.to}
                href={n.to}
                aria-current={active(n.to) ? "page" : undefined}
                className={cn(
                  "flex h-11 shrink-0 items-center rounded-md px-3 text-sm font-semibold transition-colors",
                  active(n.to)
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <main key={pathname} className="mx-auto max-w-7xl animate-enter p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
