import type { Metadata } from "next";
import { Profile } from "@/views/profile";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your business details and preferences.",
};

export default function Page() {
  return <Profile />;
}
