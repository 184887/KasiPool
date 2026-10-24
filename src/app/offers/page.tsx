import type { Metadata } from "next";
import { Offers } from "@/views/offers";

export const metadata: Metadata = {
  title: "Active offers — KasiPool",
  description: "Live collective purchasing pools. Join before they close.",
  openGraph: {
    title: "Active KasiPool offers",
    description: "Join a pool with other local businesses and unlock bulk prices.",
  },
};

export default function Page() {
  return <Offers />;
}
