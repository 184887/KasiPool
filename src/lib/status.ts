export type Tone = "open" | "success" | "warning" | "danger" | "info" | "muted" | "gold";

/** Internal pool status -> customer-facing label */
export const POOL_STATUS: Record<string, { customer: string; admin: string; tone: Tone }> = {
  draft: { customer: "Coming soon", admin: "Draft", tone: "muted" },
  scheduled: { customer: "Opening soon", admin: "Scheduled", tone: "info" },
  open: { customer: "Open for pooling", admin: "Open", tone: "info" },
  awaiting_confirmation: {
    customer: "Target reached",
    admin: "Awaiting confirmation & payment",
    tone: "info",
  },
  funded: {
    customer: "Preparing your stock",
    admin: "Funded – awaiting procurement",
    tone: "info",
  },
  procurement: { customer: "Preparing your stock", admin: "Procurement in progress", tone: "info" },
  stock_received: { customer: "Preparing your stock", admin: "Stock received", tone: "info" },
  ready_for_collection: {
    customer: "Ready for collection",
    admin: "Ready for collection",
    tone: "success",
  },
  completed: { customer: "Completed", admin: "Completed", tone: "success" },
  unsuccessful: { customer: "Offer unsuccessful", admin: "Unsuccessful", tone: "muted" },
  cancelled: { customer: "Offer cancelled", admin: "Cancelled", tone: "danger" },
  refund_resolution: {
    customer: "Offer unsuccessful",
    admin: "Refund resolution required",
    tone: "warning",
  },
};

export const PAYMENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  not_due: { label: "No payment yet", tone: "muted" },
  awaiting_payment: { label: "Awaiting payment", tone: "warning" },
  under_review: { label: "Payment under review", tone: "info" },
  paid: { label: "Paid", tone: "success" },
  issue: { label: "Payment issue", tone: "danger" },
  expired: { label: "Expired", tone: "muted" },
  refunded: { label: "Refunded", tone: "muted" },
};

export const ORDER_STATUS: Record<string, { label: string; tone: Tone }> = {
  awaiting_confirmation: { label: "Confirm your order", tone: "info" },
  confirmed: { label: "Confirmed", tone: "info" },
  declined: { label: "Declined", tone: "muted" },
  expired: { label: "Expired", tone: "muted" },
  cancelled: { label: "Cancelled", tone: "danger" },
  failed: { label: "Offer unsuccessful", tone: "danger" },
};

export const FULFIL_STATUS: Record<string, { label: string; tone: Tone }> = {
  none: { label: "—", tone: "muted" },
  ordered: { label: "Stock ordered", tone: "info" },
  allocated: { label: "Stock allocated", tone: "info" },
  short: { label: "Partially allocated", tone: "warning" },
  ready: { label: "Ready for collection", tone: "success" },
  collected: { label: "Collected", tone: "success" },
};

type OrderLike = { status: string; payment_status: string; fulfilment_status: string };

/** Next action label for a customer */
export function nextAction(o: OrderLike, paymentConfigured: boolean): string | null {
  if (o.status === "awaiting_confirmation") return "Confirm your order";
  if (o.status !== "confirmed") return null;
  if (o.payment_status === "awaiting_payment")
    return paymentConfigured ? "Make payment" : "Wait for payment instructions";
  if (o.payment_status === "issue") return "Resolve payment issue";
  if (o.fulfilment_status === "ready") return "Collect your stock";
  return null;
}

export const TIMELINE = [
  "Interest registered",
  "Target reached",
  "Order confirmed",
  "Payment verified",
  "Stock ordered",
  "Ready for collection",
  "Collected",
] as const;

export function timelineStep(o: OrderLike): number {
  if (o.fulfilment_status === "collected") return 6;
  if (o.fulfilment_status === "ready") return 5;
  if (["ordered", "allocated", "short"].includes(o.fulfilment_status)) return 4;
  if (o.payment_status === "paid") return 3;
  if (o.status === "confirmed") return 2;
  return 1;
}
