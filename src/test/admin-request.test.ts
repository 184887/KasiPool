import { describe, expect, it } from "vitest";
import { requestProblem } from "@/views/admin/login";

describe("requestProblem", () => {
  it("accepts a complete request", () => {
    expect(requestProblem("Naledi", "naledi@kasipool.co.za", "longenough", "longenough")).toBe(
      null,
    );
  });
  it("explains what is missing", () => {
    expect(requestProblem(" ", "a@b.co", "longenough", "longenough")).toBe("Enter your name");
    expect(requestProblem("Naledi", "naledi", "longenough", "longenough")).toBe(
      "Enter your email address",
    );
    expect(requestProblem("Naledi", "a@b.co", "short", "short")).toBe("Use at least 8 characters");
    expect(requestProblem("Naledi", "a@b.co", "longenough", "different")).toBe(
      "The passwords don't match",
    );
  });
  it("rejects the hidden phone login addresses", () => {
    expect(
      requestProblem("Naledi", "27721234567@phone.kasipool.co.za", "longenough", "longenough"),
    ).toBe("Use your own email address");
  });
});
