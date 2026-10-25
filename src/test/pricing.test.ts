import { describe, expect, it } from "vitest";

import { discountSplit, poolPrice } from "@/lib/pricing";

describe("poolPrice", () => {
  it("gives KasiPool its share of the discount", () => {
    // List R250, bulk R200: R50 discount, 20% (R10) to KasiPool
    expect(poolPrice(250, 200, 20)).toBe(210);
    expect(discountSplit(250, 200, 20)).toEqual({ price: 210, kasipool: 10, shopSaving: 40 });
  });

  it("handles the extremes", () => {
    expect(poolPrice(250, 200, 0)).toBe(200);
    expect(poolPrice(250, 200, 100)).toBe(250);
  });

  it("rounds to cents like the database", () => {
    expect(poolPrice(99.99, 80.01, 33.33)).toBe(86.67);
  });
});
