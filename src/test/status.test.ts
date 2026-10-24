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
    expect(nextAction(order, true)).toBe("Make payment");
    expect(nextAction(order, false)).toBe("Wait for payment instructions");
    expect(timelineStep(order)).toBe(2);
  });

  it("reaches the final step when collected", () => {
    expect(timelineStep({ ...order, payment_status: "paid", fulfilment_status: "collected" })).toBe(
      6,
    );
  });
});
