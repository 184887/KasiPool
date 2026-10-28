import { describe, expect, it, vi } from "vitest";

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
    payment_method: "eft",
  };

  it("asks nobody to pay before the stock arrives", () => {
    expect(nextAction(order, true)).toBeNull();
    expect(nextAction({ ...order, payment_method: "cash" }, true)).toBeNull();
    expect(timelineStep(order)).toBe(2);
  });

  it("asks for payment once the stock is received", () => {
    const received = { ...order, fulfilment_status: "received" };
    expect(nextAction(received, true)).toBe("Pay and send proof");
    expect(nextAction(received, false)).toBe("Wait for bank details");
    expect(nextAction({ ...received, payment_status: "under_review" }, true)).toBeNull();
    expect(nextAction({ ...received, payment_method: "cash" }, true)).toBe("Pay what you owe");
  });

  it("asks the shop to confirm a delivery", () => {
    const delivered = { ...order, fulfilment_status: "delivered" };
    expect(nextAction(delivered, true)).toBe("Confirm delivery");
    expect(timelineStep(delivered)).toBe(4);
  });

  it("is only done when the stock is received and paid for", () => {
    expect(timelineStep({ ...order, fulfilment_status: "received" })).toBe(5);
    expect(timelineStep({ ...order, payment_status: "paid", fulfilment_status: "received" })).toBe(
      6,
    );
  });
});

describe("errMsg", () => {
  it("shows our own messages and hides internal ones", async () => {
    const { errMsg, FriendlyError } = await import("@/lib/queries");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(errMsg({ code: "P0001", message: "This pool is closed" })).toBe("This pool is closed");
    expect(errMsg(new FriendlyError("Try later"))).toBe("Try later");
    expect(
      errMsg({ code: "23505", message: 'duplicate key value violates unique constraint "x"' }),
    ).toBe("Something went wrong. Please try again.");
    expect(errMsg(new TypeError("Failed to fetch"))).toBe(
      "No connection. Check your data and try again.",
    );
    spy.mockRestore();
  });
});
