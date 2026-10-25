import { describe, expect, it } from "vitest";
import { mapsUrl, shopZoneId } from "@/lib/delivery";

describe("mapsUrl", () => {
  it("links to the pin", () => {
    expect(mapsUrl(-34.011574, 18.645771)).toBe(
      "https://www.google.com/maps/search/?api=1&query=-34.011574,18.645771",
    );
  });
  it("is null without a pin", () => {
    expect(mapsUrl(null, 18.6)).toBeNull();
    expect(mapsUrl(-34, undefined)).toBeNull();
  });
});

describe("shopZoneId", () => {
  it("uses the other address's zone when stock goes there", () => {
    expect(shopZoneId({ deliver_to: "other", zone_id: "a", delivery_zone_id: "b" })).toBe("b");
    expect(shopZoneId({ deliver_to: "business", zone_id: "a", delivery_zone_id: "b" })).toBe("a");
    expect(shopZoneId(null)).toBeNull();
  });
});
