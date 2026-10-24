import type { Metadata } from "next";
import { StartPool } from "@/views/start-pool";

export const metadata: Metadata = {
  title: "Start a pool — KasiPool",
  description: "Propose a group purchase for your community.",
};

export default function Page() {
  return <StartPool />;
}
