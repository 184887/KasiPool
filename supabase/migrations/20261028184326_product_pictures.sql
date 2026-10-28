-- Pictures for the four products that had none (2026-10-28), named to match the packs shown.
-- Snowflake's bread flour photo is the 2.5kg bag, so that product is now a bale of 5 x 2.5kg
-- (the same 12.5kg). Its deals with no shops in them change unit too; the lock on published
-- terms is lifted for this one update only (it protects shops, and these deals have none).
update public.products set name = 'Snowflake White Bread Wheat Flour', unit = 'bale',
    pack_size = '2.5kg x 5', image_url = '/images/products/kp-brd-125.jpg'
  where sku = 'KP-BRD-125';
alter table public.pools disable trigger pools_lock;
update public.pools p set unit = 'bale'
  from public.products pr
  where pr.id = p.product_id and pr.sku = 'KP-BRD-125'
    and not exists (select 1 from public.participations x where x.pool_id = p.id)
    and not exists (select 1 from public.orders x where x.pool_id = p.id);
alter table public.pools enable trigger pools_lock;

update public.products set name = 'Anchor Instant Yeast', image_url = '/images/products/kp-yst-500.jpg'
  where sku = 'KP-YST-500';
update public.products set name = 'Dark and Lovely Superior Moisture Plus Relaxer Kit',
    description = 'No-lye relaxer kits with coconut oil and shea butter, for salons.',
    image_url = '/images/products/kp-rlx-6.jpg'
  where sku = 'KP-RLX-6';
update public.products set name = 'Shield High Foam Car Shampoo',
    description = 'High foam car shampoo for hand washing, safe on all paint.',
    image_url = '/images/products/kp-car-5l4.jpg'
  where sku = 'KP-CAR-5L4';
