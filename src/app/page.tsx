import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/site";
import { Home } from "@/views/home";

export const metadata: Metadata = {
  title: { absolute: "KasiPool | Collective Buying Alliance" },
  description:
    "Join local businesses to coordinate pooled purchases for the stock you already buy.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "KasiPool | Collective Buying Alliance",
    description: "See product quantities, prices and deadlines before joining a pool.",
    images: [OG_IMAGE],
  },
};

export default function Page() {
  return <Home />;
}
