import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RequireAuth } from "@/views/require-auth";

// Pages behind the login: search engines would only see the sign-in screen
export const metadata: Metadata = { robots: { index: false } };

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
