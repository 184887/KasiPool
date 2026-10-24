import type { Metadata } from "next";
import { Privacy } from "@/views/privacy";

export const metadata: Metadata = {
  title: "Privacy notice (draft) — KasiPool",
  description:
    "How KasiPool collects and uses business information, in line with POPIA principles (draft).",
  openGraph: {
    title: "KasiPool privacy notice (draft)",
    description: "Draft privacy notice for KasiPool.",
  },
};

export default function Page() {
  return <Privacy />;
}
