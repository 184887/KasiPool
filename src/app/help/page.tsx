import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/site";
import { Help } from "@/views/help";

export const metadata: Metadata = {
  title: "Help & contact",
  description: "Get help with pools, payments and delivery on KasiPool.",
  alternates: { canonical: "/help" },
  openGraph: {
    title: "KasiPool help",
    description: "Answers and contact details for KasiPool customers.",
    images: [OG_IMAGE],
  },
};

export default function Page() {
  return <Help />;
}
