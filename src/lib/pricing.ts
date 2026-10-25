/**
 * Pool price from the supplier's list and bulk prices: KasiPool keeps `sharePct` percent of the
 * discount and passes the rest on. Mirrors public.pool_price() in the database, which sets the
 * real price when a pool is published; this copy is only for previews.
 */
export function poolPrice(list: number, bulk: number, sharePct: number): number {
  return Math.round((list - (1 - sharePct / 100) * (list - bulk)) * 100) / 100;
}

/** Per-unit split of the discount, for admin previews. */
export function discountSplit(list: number, bulk: number, sharePct: number) {
  const price = poolPrice(list, bulk, sharePct);
  return { price, kasipool: price - bulk, shopSaving: list - price };
}
