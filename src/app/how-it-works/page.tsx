import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/site";
import { HowItWorks } from "@/views/how-it-works";

export const metadata: Metadata = {
  title: { absolute: "How KasiPool works: collective buying explained" },
  description:
    "Find a deal, join the pool, confirm your order once it fills, then pay when your stock arrives.",
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: "How KasiPool works",
    description: "Collective purchasing for Cape Town township businesses in four simple steps.",
    images: [OG_IMAGE],
  },
};

export default function Page() {
  return <HowItWorks />;
}
