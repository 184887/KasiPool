import { describe, expect, it } from "vitest";

import { safeRedirect } from "@/lib/auth";
import { nextAction, timelineStep } from "@/lib/status";

describe("safeRedirect", () => {
  it("keeps same-origin paths", () => {
    expect(safeRedirect("/offers/abc")).toBe("/offers/abc");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeRedirect("https://evil.example")).toBe("/my-pools");
    expect(safeRedirect("//evil.example")).toBe("/my-pools");
    expect(safeRedirect(undefined)).toBe("/my-pools");
  });
});

describe("order progress", () => {
  const order = {
    status: "confirmed",
    payment_status: "awaiting_payment",
    fulfilment_status: "none",
  };

  it("asks for payment once confirmed", () => {
    expect(nextAction(order, true)).toBe("Pay now");
    expect(nextAction(order, false)).toBe("Wait for bank details");
    expect(timelineStep(order)).toBe(2);
  });

  it("asks the shop to confirm a delivery", () => {
    const delivered = { ...order, payment_status: "paid", fulfilment_status: "delivered" };
    expect(nextAction(delivered, true)).toBe("Confirm delivery");
    expect(timelineStep(delivered)).toBe(5);
  });

  it("reaches the final step when received", () => {
    expect(timelineStep({ ...order, payment_status: "paid", fulfilment_status: "received" })).toBe(
      6,
    );
  });
});
