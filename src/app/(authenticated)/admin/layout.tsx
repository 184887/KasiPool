import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminLayout } from "@/views/admin/layout";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
