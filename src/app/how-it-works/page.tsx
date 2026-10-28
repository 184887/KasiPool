import type { Metadata } from "next";
import { HowItWorks } from "@/views/how-it-works";

export const metadata: Metadata = {
  title: { absolute: "How KasiPool works: collective buying explained" },
  description:
    "Find a deal, join the pool, confirm your order once it fills, then pay when your stock arrives.",
  openGraph: {
    title: "How KasiPool works",
    description: "Collective purchasing for Cape Town township businesses in four simple steps.",
  },
};

export default function Page() {
  return <HowItWorks />;
}
