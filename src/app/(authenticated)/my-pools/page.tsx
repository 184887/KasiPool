import type { Metadata } from "next";
import { MyPools } from "@/views/my-pools";

export const metadata: Metadata = {
  title: "My Pools",
  description: "Your pool participations and orders.",
};

export default function Page() {
  return <MyPools />;
}
