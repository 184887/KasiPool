import type { Metadata } from "next";
import { Profile } from "@/views/profile";

export const metadata: Metadata = {
  title: "Business profile — KasiPool",
  description: "Manage your business details and preferences.",
};

export default function Page() {
  return <Profile />;
}
