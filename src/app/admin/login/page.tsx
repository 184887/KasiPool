import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/kp/ui";
import { AdminLoginPage } from "@/views/admin/login";

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminLoginPage />
    </Suspense>
  );
}
