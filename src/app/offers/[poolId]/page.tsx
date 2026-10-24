import type { Metadata } from "next";
import { Offer } from "@/views/offer";

export const metadata: Metadata = {
  title: "Offer details — KasiPool",
  description: "See price, pool progress and closing time, then join the pool.",
  openGraph: {
    title: "Join this KasiPool deal",
    description: "Pool with other local businesses to get a better bulk price.",
  },
};

export default function Page() {
  return <Offer />;
}
