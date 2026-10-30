import { describe, expect, it } from "vitest";
import { contactHref, waNumber } from "@/lib/contact";

describe("contact links", () => {
  it("turn local and international numbers into wa.me digits", () => {
    expect(waNumber("082 123 4567")).toBe("27821234567");
    expect(waNumber("+27 82 123 4567")).toBe("27821234567");
    expect(contactHref.whatsapp("082 123 4567")).toBe("https://wa.me/27821234567");
  });
  it("keep the plus in phone links", () => {
    expect(contactHref.phone("+27 21 000 0000")).toBe("tel:+27210000000");
  });
});
