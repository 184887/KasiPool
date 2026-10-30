import { describe, expect, it } from "vitest";
import { byDistance, mapsUrl } from "@/lib/delivery";
import { awayLabel } from "@/components/kp/PoolCard";
import { english } from "@/i18n";

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

describe("awayLabel", () => {
  it("says how far, in plain words", () => {
    const d = { radius_km: 10, in_range: true };
    expect(awayLabel(english, { ...d, distance_km: 0 })).toBe("Under 1 km away");
    expect(awayLabel(english, { ...d, distance_km: 4 })).toBe("4 km away");
  });
});

describe("byDistance", () => {
  it("puts near pools first, open-to-all next and too-far pools last", () => {
    const d = new Map([
      ["far", { distance_km: 12, radius_km: 10, in_range: false }],
      ["near", { distance_km: 2, radius_km: 10, in_range: true }],
      ["mid", { distance_km: 8, radius_km: 10, in_range: true }],
    ]);
    const ids = byDistance([{ id: "far" }, { id: "all" }, { id: "mid" }, { id: "near" }], d).map(
      (p) => p.id,
    );
    expect(ids).toEqual(["near", "mid", "all", "far"]);
  });
});
