"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { AppShell } from "@/components/kp/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/i18n";
import type { Dictionary, Lang } from "@/i18n/config";

const ENGLISH: Dictionary = { ui: {}, server: {} };

export function Providers({
  lang,
  dict,
  children,
}: {
  lang: Lang;
  dict: Dictionary;
  children: ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  // Admin pages stay English, whatever language the shop screens are in
  useEffect(() => {
    document.documentElement.lang = isAdmin || lang === "en" ? "en-ZA" : "xh-ZA";
  }, [isAdmin, lang]);
  return (
    <LanguageProvider lang={isAdmin ? "en" : lang} dict={isAdmin ? ENGLISH : dict}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {isAdmin ? children : <AppShell>{children}</AppShell>}
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}
