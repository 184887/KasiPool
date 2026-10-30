import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/site";
import { Privacy } from "@/views/privacy";

export const metadata: Metadata = {
  title: "Privacy notice (draft)",
  description:
    "How KasiPool collects and uses business information, in line with POPIA principles (draft).",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "KasiPool privacy notice (draft)",
    description: "Draft privacy notice for KasiPool.",
    images: [OG_IMAGE],
  },
};

export default function Page() {
  return <Privacy />;
}
