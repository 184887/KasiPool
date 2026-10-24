"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { AppShell } from "@/components/kp/AppShell";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {isAdmin ? children : <AppShell>{children}</AppShell>}
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
