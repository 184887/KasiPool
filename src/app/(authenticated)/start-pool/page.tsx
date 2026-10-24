import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/kp/ui";
import { StartPool } from "@/views/start-pool";

export const metadata: Metadata = {
  title: "Start a pool",
  description: "Propose a group purchase for your community.",
};

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <StartPool />
    </Suspense>
  );
}
