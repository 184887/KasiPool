import { describe, expect, it } from "vitest";
import { isEmail } from "@/views/admin/settings";

describe("isEmail", () => {
  it("accepts normal addresses, including ones with an s", () => {
    expect(isEmail("fulumula078@gmail.com")).toBe(true);
    expect(isEmail("sipho.s@kasipool.co.za")).toBe(true);
  });
  it("rejects things that are not addresses", () => {
    expect(isEmail("sipho")).toBe(false);
    expect(isEmail("a b@c.d")).toBe(false);
    expect(isEmail("a@b")).toBe(false);
  });
});
