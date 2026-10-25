import type { Metadata } from "next";
import { Profile } from "@/views/profile";

export const metadata: Metadata = {
  title: "Shop profile",
  description: "Manage your business details and preferences.",
};

export default function Page() {
  return <Profile />;
}
