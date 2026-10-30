import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/site";
import { Offers } from "@/views/offers";

export const metadata: Metadata = {
  title: "Deals",
  description: "Open and upcoming pools, plus products you can suggest a pool for.",
  alternates: { canonical: "/offers" },
  openGraph: {
    title: "KasiPool deals",
    description: "Join a pool with other local businesses and unlock bulk prices.",
    images: [OG_IMAGE],
  },
};

export default function Page() {
  return <Offers />;
}
