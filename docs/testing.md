# Testing KasiPool end to end

How to try every flow in the app on your own computer, with test shops and pools that are
already at each stage. For how pools work, see the [admin guide](admin-guide.md).

## Real deals

The migration `20261026123204_real_deals.sql` replaced the old locked "sample deals" with real
deals that shops can join: one open deal per product, on branded stock (Crown, Huletts, Tastic,
Star, Snowflake, Coca-Cola, Sunlight, Cerebos, Anchor, Dark and Lovely, Shield). Each deal is
centred on a Cape Town township with a 10 km radius.

The list and bulk prices are **estimates** of Cape Town cash & carry prices, shown to shops as
"Estimated cash & carry price, October 2026". The supplier is a stand-in, "Cape Town Cash & Carry
(stand-in)". Before verifying any real payment, get a quote from a real supplier, then cancel the
deal and publish a new one with the quoted prices (prices are locked once a deal is published).

## Load the test data (local only)

```sh
npx supabase start          # local stack in Docker
npx supabase migration up --local
npm run test-data           # clears old test data, then loads it fresh
npm run test-data:clear     # removes it again
```

Point the app at the local stack: in `.env.local` set `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the `API_URL` and `PUBLISHABLE_KEY` from
`npx supabase status -o env`, then `npm run dev`. Put the live values back afterwards.

The script needs one admin account on the local stack (see "Admin accounts" in the README). It
acts as that admin for the admin steps, so the audit log shows them as that admin. It only runs
against the local stack; there is no command to load test data on the live project.

Run `npm run test-data` again at any time to start over.

## Test shops

All test shops use the PIN **123456**. Log in at `/auth` with the number.

| #   | Number       | Shop                         | Area            | Notes                         |
| --- | ------------ | ---------------------------- | --------------- | ----------------------------- |
| 1   | 060 000 0001 | Thandeka's Spaza (test)      | Khayelitsha     | Main test shop: in most pools |
| 2   | 060 000 0002 | Lwazi Car Wash (test)        | Khayelitsha     | Started the private group     |
| 3   | 060 000 0003 | Nomsa's Hair Salon (test)    | Gugulethu       | Asked for the relaxer deal    |
| 4   | 060 000 0004 | Langa Fresh Bakery (test)    | Langa           |                               |
| 5   | 060 000 0005 | Rocklands Mini Market (test) | Mitchells Plain |                               |
| 6   | 060 000 0006 | Philippi Kota King (test)    | Philippi        | In no open pool: free to join |
| 7   | 060 000 0007 | Mbekweni Corner Shop (test)  | Mbekweni, Paarl | Too far away for every pool   |

Test pools are in the campaign **Test data** and centred on the Cape Flats with a 15 km radius,
so shops 1 to 6 can join them and shop 7 can't. The real deals have a 10 km radius, so each test
shop is close enough for some of them and too far for others.

## Test pools

| Product                     | Stage when loaded                  | What to test                                     |
| --------------------------- | ---------------------------------- | ------------------------------------------------ |
| Star Super Maize Meal       | Open, 26 of 30                     | Shop 1 or 6 joins with 4 or more: the pool fills |
| Tastic Rice                 | Open, 10 of 60                     | Join, change the amount, leave                   |
| Shield Car Wash Shampoo     | Open, private group                | Join with code **CARWASH1**                      |
| Anchor Instant Dry Yeast    | Reopened: 12 paid, 8 more needed   | Shop 4 or 6 fills the gap                        |
| Coca-Cola (opens tomorrow)  | Scheduled                          | Admin: **Testing: open now**                     |
| Dark and Lovely Relaxer Kit | Asked for by shop 3 (draft)        | Admin: set prices and publish                    |
| Huletts White Sugar         | Full: waiting for shops to pay     | Shop 1 confirms; admin records payments          |
| Crown Blended Cooking Oil   | Paid by everyone                   | Admin: authorise the purchase order              |
| Snowflake Cake Wheat Flour  | Ordered from the supplier          | Admin: record receipt (try fewer than 20)        |
| Coca-Cola                   | Stock received                     | Admin: send out for delivery                     |
| Sunlight Dishwashing Liquid | Out for delivery                   | Shop 1 confirms or reports a problem             |
| Cerebos Iodated Table Salt  | Done                               | History only                                     |
| Snowflake White Bread Flour | Failed: shops 1 and 4 owed refunds | Admin: complete refunds, then mark resolved      |

## Things to check

### Shop (start with shop 1)

1. **Deals:** real deals are listed nearest first with their distance; far ones say "Too far for
   you". Log in as shop 7 to see every test pool as too far.
2. **Join a pool:** Star maize meal, 4 or more bags. The pool fills and an order to confirm
   appears in My Pools, with a notification.
3. **Confirm and pay:** confirm the Huletts sugar order. You get a payment reference. Bank
   details only show once they are set in Admin → Settings; until then shops are told not to
   pay yet.
4. **Private group:** type CARWASH1 under "Got a private group code?" in My Pools, or open
   `/join/CARWASH1`.
5. **Ask for a deal:** start a pool for a product. It waits for an admin as a draft.
6. **Delivery:** on the Sunlight order, confirm you got it, or report a problem. Log in as shop
   2 to confirm an order the courier already marked as delivered.
7. **Refunds and reopen:** the bread flour order says the deal failed and money will be paid
   back; the yeast order says the deal is open again and the order is safe.

### Admin

1. **Payments:** record the payments for Huletts sugar (shops 2 to 4), then **Finalise funding
   now** once enough is paid. Try **Testing: end payment time now** before that, to see unpaid
   orders close and the pool reopen.
2. **Supplier order and stock:** Crown oil, then flour (record fewer than 20 to see the refund for
   missing stock), then Coca-Cola out for delivery.
3. **Deliveries:** Admin → Deliveries, mark the Sunlight orders as delivered.
4. **Refunds:** Admin → Payments, complete the bread flour refunds, then **Mark resolved** on the
   pool.
5. **Requests:** publish the Dark and Lovely draft after adding a supplier, list price and bulk
   price.
6. **Scheduled pool:** open the Coca-Cola pool that opens tomorrow with **Testing: open now**.
7. **Close a pool early:** **Close pool now** on an open pool below its target: it fails.

## Testing buttons

The admin pool page has two testing buttons, backed by `admin_skip_ahead`:

- **Testing: open now** on a scheduled pool.
- **Testing: end payment time now** on a pool waiting for payment. Unpaid orders close and the
  pool is funded, reopens for the gap or fails, as at a real deadline.

They work on any pool, including real ones, because they are only shortcuts for times the
system would reach anyway. Take them out before launch, or only use them on test pools: ending the
payment time early closes the orders of shops that still had time to pay.
