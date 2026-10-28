import type { Metadata } from "next";
import { OrderPage } from "@/views/order";

export const metadata: Metadata = {
  title: "Your order",
  description: "Confirm and track your KasiPool order, and pay when it arrives.",
};

export default function Page() {
  return <OrderPage />;
}
