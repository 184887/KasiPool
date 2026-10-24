import type { Metadata } from "next";
import { OrderPage } from "@/views/order";

export const metadata: Metadata = {
  title: "Your order — KasiPool",
  description: "Confirm, pay for and track your KasiPool order.",
};

export default function Page() {
  return <OrderPage />;
}
