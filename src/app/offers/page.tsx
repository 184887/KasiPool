import type { Metadata } from "next";
import { Offers } from "@/views/offers";

export const metadata: Metadata = {
  title: "Deals",
  description: "Open and upcoming pools, plus products you can suggest a pool for.",
  openGraph: {
    title: "KasiPool deals",
    description: "Join a pool with other local businesses and unlock bulk prices.",
  },
};

export default function Page() {
  return <Offers />;
}
