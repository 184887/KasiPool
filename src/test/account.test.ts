import { describe, expect, it } from "vitest";
import { passwordProblem } from "@/views/admin/account";

describe("passwordProblem", () => {
  it("accepts a good new password", () => {
    expect(passwordProblem("old-pass-1", "new long pass", "new long pass")).toBeNull();
  });
  it("rejects short, unchanged or mismatched passwords", () => {
    expect(passwordProblem("old", "short", "short")).toMatch(/at least 8/);
    expect(passwordProblem("same-pass-1", "same-pass-1", "same-pass-1")).toMatch(/haven't used/);
    expect(passwordProblem("old-pass-1", "new long pass", "new long pas")).toMatch(/don't match/);
  });
});
