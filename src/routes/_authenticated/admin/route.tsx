import { createFileRoute, Outlet, redirect, Link, useLocation } from "@tanstack/react-router";
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
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/kp/pool-bits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data } = await supabase.rpc("has_role", { _user_id: u.user!.id, _role: "admin" });
    if (!data) throw redirect({ to: "/profile" });
  },
  head: () => ({ meta: [{ title: "Admin — KasiPool" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/pools", label: "Pools", icon: Layers },
  { to: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/suppliers", label: "Suppliers", icon: Truck },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/collections", label: "Collections", icon: PackageCheck },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function AdminLayout() {
  const loc = useLocation();
  const active = (to: string) =>
    to === "/admin" ? loc.pathname === "/admin" : loc.pathname.startsWith(to);
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
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
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
            to="/"
            className="mt-auto flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <ArrowLeft className="size-4" /> Customer view
          </Link>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="sticky top-0 z-30 flex gap-1 overflow-x-auto border-b bg-sidebar px-2 py-2 lg:hidden">
            <Link
              to="/"
              className="shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold text-sidebar-foreground/70"
            >
              ← App
            </Link>
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold",
                  active(n.to)
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80",
                )}
              >
                {n.label}
              </Link>
            ))}
          </div>
          <main className="mx-auto max-w-7xl p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
