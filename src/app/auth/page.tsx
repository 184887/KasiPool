import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/kp/ui";
import { AuthPage } from "@/views/auth";

export const metadata: Metadata = {
  title: "Log in or register",
  description: "Sign in to KasiPool or register your business to start pooling.",
  openGraph: {
    title: "Log in to KasiPool",
    description: "Register your business and start pooling.",
  },
};

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthPage />
    </Suspense>
  );
}
