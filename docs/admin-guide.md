# KasiPool admin guide

How KasiPool works from the admin side, what to set up, and what is still to do. Last updated
2026-10-25, after the schema review (PRs #11 to #14). The business rules behind this guide are in
the README under "Business rules"; check with the team before changing any of them.

Admin pages are under `/admin`: Dashboard, Pools, Campaigns, Products, Suppliers, Payments,
Deliveries, Customers, Reports and Settings. Team members log in at `/admin/login` (the **Admin**
button in the top banner) with their email and password, not a phone number and PIN.

## Before shops can use the app

Do these once, in this order:

1. **Delivery fee** (Admin → Settings → Delivery). One fee per order, added when a business
   confirms. Leave it at R0 while fees are undecided: shops then see "Delivery is free".
2. **Pricing** (Admin → Settings → Pricing). Set KasiPool's share of the discount (default 20%).
3. **Payment instructions** (Admin → Settings). Enter KasiPool's real bank details and tick "Show
   these payment instructions to customers". Until then shops are told not to pay yet.
4. **Contact details** (Admin → Settings). Phone and WhatsApp numbers are shown on the Help page
   and to shops who forget their PIN.
5. **Suppliers and products** (Admin → Suppliers, Admin → Products).

## Pricing

KasiPool buys from the supplier and resells to shops, keeping a share of the discount:

```
discount   = supplier list price - supplier bulk price
shop price = list price - (1 - share) x discount
```

Example at 20%: list R250, bulk R200, discount R50. The shop pays R210 and saves R40; KasiPool
keeps R10 per unit.

- You enter the **list price** (the supplier's normal price) and the **bulk price** (what KasiPool
  pays). The bulk price is admin-only and never shown to shops.
- The shop price is **worked out and fixed when you publish**. Changing the share later only
  affects pools published afterwards. The share used is saved on each pool.
- The list price must be higher than the bulk price, or the pool can't be published.

## Running a pool, step by step

### 1. Create and publish

Admin → Pools → New pool. The wizard asks for campaign (optional), product, supplier, list and
bulk prices, quantities (minimum target, optional maximum and per-shop limits), opening and
closing dates, the **payment window** in hours (default 24), and **who can join**: the centre of
the deal (search a township or landmark in the middle of the businesses you want to reach) and
the distance in km (default 10). It previews the shop price and KasiPool's cut. Publish when
ready; a pool needs a supplier, list and bulk prices and a centre.

**Business requests:** businesses can ask for a deal (My Pools → Ask for a deal). It arrives as a
draft centred on that business (it is the "hub") with a 10 km radius and no price. Open it from
Admin → Pools, choose the supplier, enter list and bulk prices, check **Who can join** (the
distance is a straight line, so shrink it if roads, rail lines or wetlands make 10 km a long
drive, or move the centre), then **Publish pool**. Before sending a request, a business is shown
any open deal for the same product it can already join.

**Private groups:** a pool can be invite-only (a code or link, e.g. for a stokvel). There is no
distance limit, so check the deliveries make sense before publishing.

### 2. Shops join

Joining only records interest. A business can join if the map pin of where its stock goes
(business address, or its second delivery address if it chose one) is within the pool's distance
of the centre. Deals are listed nearest first with "4 km away"; ones that are too far show "Too
far for you" and can't be joined. Businesses never see where a pool is centred, only how far
away it is.

### 3. Target reached: confirm and pay

The pool **closes as soon as the target is reached** (or at the closing time if it isn't). Each
shop gets an order to confirm, with the goods, the delivery fee (from Settings, R0 for now) and the total. They must
confirm and pay in full by EFT within the payment window, using their order reference.

Record payments in Admin → Payments (or **Record payment** on the pool page). A payment counts once
it is recorded as verified against the bank statement. Overpayments create a refund automatically.

If everything is paid before the deadline, you can **Finalise funding now** on the pool page.
Otherwise the system settles it at the deadline. On test pools, **Testing: end payment time now**
settles it straight away (see [testing](testing.md)). Real deals don't have this button.

### 4. If some shops don't pay: the pool reopens

At the payment deadline, unpaid orders expire. Then:

- **Paid quantity reaches the target:** the pool is **funded**.
- **Short, and the original closing time hasn't passed:** the pool **reopens** for the missing
  quantity until the closing time. Shops that paid are told their order is safe. New shops can
  join; shops whose order expired can't rejoin, and shops that paid can't join twice. When the gap
  is filled the new shops get their own payment window.
- **Short at the closing time:** the pool **fails**. Everyone who paid is owed a full refund
  (see Refunds below), and the pool shows "Refund resolution required" until refunds are done.

Shops can't cancel after paying.

### 5. Buy the stock

On a funded pool: **Authorise purchase order** (supplier reference, order and expected dates).
When stock arrives: **Record receipt & allocate** with the quantity the supplier actually
delivered. Stock is shared out to paid orders in payment order. If the supplier is short:

- a shop that gets part of its order is refunded for the missing units;
- a shop that gets nothing is refunded in full, including its delivery fee.

### 6. Deliver

On the pool page: **Send allocated orders out for delivery**, with the courier's reference if
there is one. Shops are notified that their stock is on its way. Then use **Admin → Deliveries**:

- **Out for delivery:** press **Courier delivered it** when the courier reports a drop-off. The shop
  is asked to confirm.
- Shops can tap **I received my stock** in the app, even before the courier reports back.
- **Problems:** shops can report a problem (e.g. missing or damaged stock). Admins get a
  notification and it appears under the Problems tab. Sort it out with the shop (and a refund if
  needed), then press **Mark resolved** with a note for the shop.

The pool is **completed** once nothing is still out for delivery.

### Cancelling

**Cancel pool** works up to and including the confirm-and-pay stage (draft, scheduled, open or
awaiting payment), not once a pool is funded. Shops that already paid are owed refunds
automatically.

## Refunds

Refunds are created automatically for overpayments, partial payments on expired orders, failed
or cancelled pools and supplier shortfalls. Pay them back by EFT, then record each one in Admin →
Payments → **Process refunds** with the bank reference. A failed pool can be marked resolved once
all its refunds are done.

## Accounts and sign-in

- Shops sign in with their **mobile number and a 6-digit PIN**. There is no SMS check yet, so the
  number isn't verified.
- **Forgotten PIN:** check it's really the shop (call back on the registered number). The login
  is `27XXXXXXXXX@phone.kasipool.co.za` (the number without the +), listed in the Supabase
  dashboard under Authentication → Users. Set a new 6-digit password for it there if the
  dashboard offers that; otherwise a developer can set it with the Supabase admin API. Tell the
  shop the new PIN. (A self-service reset needs SMS, see "Still to do".)
- **Admins:** to add a team member:
  1. They open `/admin/login` (or tap **Admin** in the top banner), tap **Ask for admin access**
     and enter their name, email and a password (at least 8 characters).
  2. The request shows on the Dashboard work queue and in **Admin → Settings → Administrators**.
     An existing admin checks with the person, then taps **Approve** (or **Decline**). Only
     approve people you know: anyone can type any email address.
  3. They log in at `/admin/login`. Until approved, they are told the request is waiting.
     You can still grant or remove access by email in the same section. Change your own password, or log out, in **Admin →
     Account**. If someone forgets their password, set a new one in the Supabase dashboard
     (Authentication → Users).
- One login is one shop. Businesses aren't verified before joining.

## Automatic jobs

The database runs `refresh_pool_states()` every minute (pg_cron job `refresh-pool-states`). It
opens scheduled pools, closes pools that hit their target or closing time, and settles payment
deadlines (fund, reopen or fail). Nobody needs to have the site open.

## Still to do

- **SMS verification** of phone numbers before real money moves (the `clickatell-sms-hook` Edge
  Function is ready; needs a Clickatell account and the Phone provider turned on in Supabase).
- **Notifications outside the app:** shops only see in-app notifications, so for now follow up by
  phone or WhatsApp when a pool reaches its target, reopens or goes out for delivery.
- **VAT and tax invoices:** undecided. Prices are treated as final amounts.
- **Courier integration:** couriers report to KasiPool and an admin records the delivery by hand.
- **Old pools have no centre:** pools from before the distance rule can be joined from
  anywhere. The admin pool page shows "No centre set".
- **Old businesses without a map pin** must add one in their profile before they can join a pool.
- **Delivery areas** (`delivery_zones`, `pool_zones`) are no longer used but are kept in the
  database in case they come back.
- **Real supplier prices:** the first real deals (2026-10-26) use estimated prices and a stand-in
  supplier. Get real quotes before verifying payments; see [testing](testing.md).
- **Delivery fees:** to be decided by the team; change the flat fee in Settings, or ask a
  developer for fees by distance (the map pins make that possible).
- **`www.kasipool.co.za`:** its DNS still points at the old holding page; change the `www` record
  at xneelo to the CNAME Vercel shows.
- **Card payments and WhatsApp campaigns** were removed on 2026-10-25 and can come back from git
  history if wanted.
