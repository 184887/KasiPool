import type { Metadata } from "next";
import { Help } from "@/views/help";

export const metadata: Metadata = {
  title: "Help & contact",
  description: "Get help with pools, payments and delivery on KasiPool.",
  openGraph: {
    title: "KasiPool help",
    description: "Answers and contact details for KasiPool customers.",
  },
};

export default function Page() {
  return <Help />;
}
