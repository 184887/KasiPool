"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Loading } from "@/components/kp/ui";
import { useAuth } from "@/lib/auth";

/** Client-side gate for signed-in pages; sends visitors to /auth and back afterwards. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const nav = useRouter();
  useEffect(() => {
    if (loading || user) return;
    const here = window.location.pathname + window.location.search;
    nav.replace(`/auth?redirect=${encodeURIComponent(here)}`);
  }, [loading, user, nav]);
  if (loading || !user) return <Loading />;
  return <>{children}</>;
}
