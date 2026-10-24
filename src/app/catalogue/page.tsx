import type { Metadata } from "next";
import { Catalogue } from "@/views/catalogue";

export const metadata: Metadata = {
  title: "Product catalogue",
  description:
    "Browse the staples KasiPool pools for: cooking oil, rice, sugar, maize meal, flour and more.",
  openGraph: {
    title: "KasiPool product catalogue",
    description: "Everyday stock for spaza shops and local traders.",
  },
};

export default function Page() {
  return <Catalogue />;
}
