import type { Metadata } from "next";
import { NotFound } from "@/views/not-found";

export const metadata: Metadata = { title: "Page not found" };

export default function Page() {
  return <NotFound />;
}
