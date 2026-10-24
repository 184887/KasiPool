import type { Metadata } from "next";
import { Home } from "@/views/home";

export const metadata: Metadata = {
  title: "KasiPool — Individual businesses. Combined buying power.",
  description:
    "Join local businesses to coordinate pooled purchases for the stock you already buy.",
  openGraph: {
    title: "KasiPool — Individual businesses. Combined buying power.",
    description: "See product quantities, prices and deadlines before joining a pool.",
  },
};

export default function Page() {
  return <Home />;
}
