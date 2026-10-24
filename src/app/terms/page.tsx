import type { Metadata } from "next";
import { Terms } from "@/views/terms";

export const metadata: Metadata = {
  title: "Terms of use (draft) — KasiPool",
  description:
    "Draft KasiPool terms covering pools, confirmations, payments, refunds and collection.",
  openGraph: {
    title: "KasiPool terms (draft)",
    description: "Draft terms for the KasiPool collective purchasing platform.",
  },
};

export default function Page() {
  return <Terms />;
}
