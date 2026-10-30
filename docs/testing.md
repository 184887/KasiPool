# Testing KasiPool end to end

How anyone in the team can try every flow on the live app (kasipool.co.za, or your phone) with
test shops and pools that are already at each stage. Nothing to install. For how pools work, see
the [admin guide](admin-guide.md).

## Real deals

The migration `20261026123204_real_deals.sql` replaced the old locked "sample deals" with real
deals that shops can join: one open deal per product, on branded stock (Crown, Huletts, Tastic,
Star, Snowflake, Coca-Cola, Sunlight, Cerebos, Anchor, Dark and Lovely, Shield). Each deal is
centred on a Cape Town township with a 10 km radius.

The list and bulk prices are **estimates** of Cape Town cash & carry prices, shown to shops as
"Estimated cash & carry price, October 2026". The supplier is a stand-in, "Cape Town Cash & Carry
(stand-in)". Before verifying any real payment, get a quote from a real supplier, then cancel the
deal and publish a new one with the quoted prices (prices are locked once a deal is published).

## Test data on the live app

The test data lives on production next to the real data, kept apart from it:

- Only test shops can see test pools. Real shops never see or join them.
- Test shops see the real deals but can't join them or ask for them ("Test shops can only join
  test pools").
- The admin dashboard and reports leave test shops and test pools out. The pools list marks test
  pools **Test**; test shop names end in "(test)".

**Reset it** in Admin → Settings → Test data → **Reset test data**. Every test shop and test pool
is deleted and made again, back at its starting stage. Do this before a test session, or when
someone has used the pools up: they also close by themselves after 7 days. **Remove test data**
deletes it all. Neither button touches real shops or deals.

Testing the admin side needs your own admin account (see "Admin accounts" in the README). Admin
notifications, such as a delivery problem a test shop reports, go to every admin.

### Developers: local stack

The same data loads on the local Docker stack with `npm run test-data` (clear, then load) and
`npm run test-data:clear`. Both call the database functions behind the Settings buttons
(`private.load_test_data`, `private.clear_test_data`) and need one local admin account.

## Test shops

All test shops use the PIN **123456**. Log in at `/auth` with the number.

| #   | Number       | Shop                         | Area            | Notes                         |
| --- | ------------ | ---------------------------- | --------------- | ----------------------------- |
| 1   | 060 000 0001 | Thandeka's Spaza (test)      | Khayelitsha     | In most pools; no map pin yet |
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

| Product                      | Stage when loaded                  | What to test                                     |
| ---------------------------- | ---------------------------------- | ------------------------------------------------ |
| Star Super Maize Meal        | Open, 26 of 30                     | Shop 1 or 6 joins with 4 or more: the pool fills |
| Tastic Rice                  | Open, 10 of 60                     | Join, change the amount, leave                   |
| Shield High Foam Car Shampoo | Open, private group                | Join with code **CARWASH1**                      |
| Anchor Instant Yeast         | Reopened: 12 confirmed, 8 needed   | Shop 4 or 6 fills the gap                        |
| Coca-Cola (opens tomorrow)   | Scheduled                          | Admin: **Testing: open now**                     |
| Dark and Lovely Relaxer Kit  | Asked for by shop 3 (draft)        | Admin: set prices and publish                    |
| Huletts White Sugar          | Full: waiting for shops to confirm | Shop 1 confirms; shop 3 uploads a proof          |
| Crown Blended Cooking Oil    | Confirmed by everyone, none paid   | Admin: authorise the purchase order              |
| Snowflake Cake Wheat Flour   | Ordered from the supplier          | Admin: record receipt (try fewer than 20)        |
| Coca-Cola                    | Stock received                     | Admin: send out for delivery                     |
| Sunlight Dishwashing Liquid  | Out for delivery                   | Shop 1 confirms; admin records shop 1's cash     |
| Cerebos Iodated Table Salt   | Done; shop 5 still owes (EFT)      | Shop 5 uploads a proof; admin approves it        |
| Snowflake White Bread Flour  | Failed: shop 1 owed a refund       | Admin: complete the refund, then mark resolved   |

On the sugar pool, shop 2 chose cash, shop 3 chose EFT and shop 4 already paid by EFT. Shops pay
when their stock arrives (pilot), so in the later pools nobody has paid until delivery.

## Things to check

### Shop (start with shop 1)

1. **Deals:** test pools and real deals are listed nearest first with their distance; far ones
   say "Too far for you". Log in as shop 7 to see every test pool as too far. Joining a real deal
   says "Test shops can only join test pools".
2. **Join a pool:** Star maize meal, 4 or more bags. The pool fills and an order to confirm
   appears in My Pools, with a notification.
3. **Map pin:** shop 1 has only its area, so Home and My Pools ask it to set its map pin, and the
   Huletts sugar order can't be confirmed yet. You are not in Khayelitsha, so don't use "I am at my
   business now" (it would pin where you are, too far for the deal): go to Profile, search
   "Site C, Khayelitsha" under Map pin and save.
4. **Confirm and choose how to pay:** confirm the Huletts sugar order. You must choose **Cash
   when it arrives** or **Bank transfer (EFT)**. With EFT you get a payment reference and the
   bank details, and an **Upload proof of payment** button: send any photo. The order shows
   "Checking payment", not "Paid". Bank details only show once they are set in Admin → Settings;
   until then EFT shops are told not to pay yet. Try **Change** to switch to cash.
5. **Proof after delivery:** log in as shop 5. The salt order was received but not paid:
   upload a proof of payment.
6. **Private group:** type CARWASH1 under "Got a private group code?" in My Pools, or open
   `/join/CARWASH1`.
7. **Ask for a deal:** start a pool for a product. It waits for an admin as a draft, as a test
   pool.
8. **Delivery:** on the Sunlight order, confirm you got it, or report a problem. Log in as shop
   2 to confirm an order the courier already marked as delivered.
9. **Refunds and reopen:** the bread flour order says the deal failed and money will be paid
   back (shop 1 paid early); the yeast order says the deal is open again and the order is safe.
10. **Install the app:** on an Android phone in Chrome, the "Get the KasiPool app" card has an
    **Install** button (or use the menu, **Install app**). On an iPhone in Safari, the card shows
    the Share steps. The app opens full-screen from the home screen icon. Turn on airplane mode
    and open it: it shows "No internet connection" with **Try again**. The steps are also under
    Help → Get the app.
11. **isiXhosa:** tap **isiXhosa** in the top bar. Every shop page, button, message and
    notification switches; product names and the Terms and Privacy pages stay English. Switch
    back with **English** in the top bar or under Profile → Language.

### Admin

1. **Proofs:** Admin → Payments → **Proofs to check**. Open each proof with **View proof**.
   Reject one with a reason (the shop sees it and can send another), approve one (the order
   shows "Paid").
2. **Cash:** Admin → Payments, filter **Delivered, not paid**, press **Record** on a cash order,
   choose **Cash**. Try a part payment first: the rest stays owed.
3. **Funding:** once shop 1 confirms the sugar order, **Finalise funding now** works, even though
   nobody has paid. Try **Testing: end confirm time now** before shop 1 confirms, to see the
   unconfirmed order close and the pool reopen.
4. **Supplier order and stock:** Crown oil, then flour (record fewer than 20 to see order totals
   drop to what shops get), then Coca-Cola out for delivery.
5. **Deliveries:** Admin → Deliveries, mark the Sunlight orders as delivered.
6. **Refunds:** Admin → Payments, complete the bread flour refund, then **Mark resolved** on the
   pool.
7. **Requests:** publish the Dark and Lovely draft after adding a supplier, list price and bulk
   price.
8. **Scheduled pool:** open the Coca-Cola pool that opens tomorrow with **Testing: open now**.
9. **Close a pool early:** **Close pool now** on an open pool below its target: it fails.

## Testing buttons

The admin pool page of a test pool has two testing buttons, backed by `admin_skip_ahead`:

- **Testing: open now** on a scheduled pool.
- **Testing: end confirm time now** on a pool waiting for shops to confirm. Unconfirmed orders
  close and the pool is funded, reopens for the gap or fails, as at a real deadline.

They only show, and only work, on test pools: ending a real deal's confirm time early would close
the orders of shops that still had time to confirm.

Proof files that test shops upload stay in storage when the test data is reset (Supabase doesn't
let SQL delete storage files). They are small and only admins can open them.
