import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/kp/ui";
import { Onboarding } from "@/views/onboarding";

export const metadata: Metadata = {
  title: "Your business details — KasiPool",
  description: "Add your business profile to start pooling.",
};

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Onboarding />
    </Suspense>
  );
}
