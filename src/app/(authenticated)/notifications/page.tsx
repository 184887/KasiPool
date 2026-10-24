import type { Metadata } from "next";
import { Notifications } from "@/views/notifications";

export const metadata: Metadata = {
  title: "Notifications — KasiPool",
  description: "Your KasiPool updates.",
};

export default function Page() {
  return <Notifications />;
}
