import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/site";
import { Terms } from "@/views/terms";

export const metadata: Metadata = {
  title: "Terms of use (draft)",
  description:
    "Draft KasiPool terms covering pools, confirmations, payments, refunds and delivery.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "KasiPool terms (draft)",
    description: "Draft terms for the KasiPool collective purchasing platform.",
    images: [OG_IMAGE],
  },
};

export default function Page() {
  return <Terms />;
}
