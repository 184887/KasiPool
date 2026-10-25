export type Tone = "open" | "success" | "warning" | "danger" | "info" | "muted" | "gold";

/** Internal pool status -> customer-facing label */
export const POOL_STATUS: Record<string, { customer: string; admin: string; tone: Tone }> = {
  draft: { customer: "Coming soon", admin: "Draft", tone: "muted" },
  scheduled: { customer: "Opening soon", admin: "Scheduled", tone: "info" },
  open: { customer: "Open to join", admin: "Open", tone: "info" },
  awaiting_confirmation: {
    customer: "Target reached",
    admin: "Awaiting confirmation & payment",
    tone: "info",
  },
  funded: {
    customer: "Getting your stock",
    admin: "Funded: order stock",
    tone: "info",
  },
  procurement: { customer: "Getting your stock", admin: "Stock ordered", tone: "info" },
  stock_received: { customer: "Getting your stock", admin: "Stock received", tone: "info" },
  out_for_delivery: {
    customer: "Out for delivery",
    admin: "Out for delivery",
    tone: "success",
  },
  completed: { customer: "Completed", admin: "Completed", tone: "success" },
  unsuccessful: { customer: "Deal failed", admin: "Unsuccessful", tone: "muted" },
  cancelled: { customer: "Deal cancelled", admin: "Cancelled", tone: "danger" },
  refund_resolution: {
    customer: "Deal failed",
    admin: "Refunds to pay",
    tone: "warning",
  },
};

export const PAYMENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  not_due: { label: "No payment yet", tone: "muted" },
  awaiting_payment: { label: "Waiting for payment", tone: "warning" },
  under_review: { label: "Checking payment", tone: "info" },
  paid: { label: "Paid", tone: "success" },
  issue: { label: "Payment problem", tone: "danger" },
  expired: { label: "Expired", tone: "muted" },
  refunded: { label: "Refunded", tone: "muted" },
};

export const ORDER_STATUS: Record<string, { label: string; tone: Tone }> = {
  awaiting_confirmation: { label: "Confirm your order", tone: "info" },
  confirmed: { label: "Confirmed", tone: "info" },
  declined: { label: "Not confirmed", tone: "muted" },
  expired: { label: "Expired", tone: "muted" },
  cancelled: { label: "Cancelled", tone: "danger" },
  failed: { label: "Deal failed", tone: "danger" },
};

export const FULFIL_STATUS: Record<string, { label: string; tone: Tone }> = {
  none: { label: "-", tone: "muted" },
  ordered: { label: "Stock ordered", tone: "info" },
  allocated: { label: "Stock ready", tone: "info" },
  short: { label: "Some stock missing", tone: "warning" },
  out_for_delivery: { label: "Out for delivery", tone: "info" },
  delivered: { label: "Delivered", tone: "success" },
  received: { label: "Received", tone: "success" },
};

type OrderLike = { status: string; payment_status: string; fulfilment_status: string };

/** Next action label for a customer */
export function nextAction(o: OrderLike, paymentConfigured: boolean): string | null {
  if (o.status === "awaiting_confirmation") return "Confirm your order";
  if (o.status !== "confirmed") return null;
  if (o.payment_status === "awaiting_payment")
    return paymentConfigured ? "Pay now" : "Wait for bank details";
  if (o.payment_status === "issue") return "Fix payment problem";
  if (o.fulfilment_status === "out_for_delivery" || o.fulfilment_status === "delivered")
    return "Confirm delivery";
  return null;
}

export const TIMELINE = [
  "You joined",
  "Target reached",
  "Order confirmed",
  "Payment checked",
  "Stock ordered",
  "Out for delivery",
  "Received",
] as const;

export function timelineStep(o: OrderLike): number {
  if (o.fulfilment_status === "received") return 6;
  if (["out_for_delivery", "delivered"].includes(o.fulfilment_status)) return 5;
  if (["ordered", "allocated", "short"].includes(o.fulfilment_status)) return 4;
  if (o.payment_status === "paid") return 3;
  if (o.status === "confirmed") return 2;
  return 1;
}
