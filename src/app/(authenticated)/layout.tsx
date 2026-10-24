import type { ReactNode } from "react";
import { RequireAuth } from "@/views/require-auth";

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
