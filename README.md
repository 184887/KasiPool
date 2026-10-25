# KasiPool

KasiPool is a mobile-first web app that lets small township businesses in Cape Town pool their
stock orders to unlock wholesale prices. Businesses join a time-limited pool for a product. When
the pool hits its target, each business confirms its order and pays. KasiPool then buys the stock
from the supplier and a courier delivers it to each shop.

There are two sides to the app:

- **Customers** browse deals, join pools, confirm and pay for orders, and track them through to
  delivery.
- **Admins** manage products, suppliers, pools, payments, purchase orders,
  deliveries and refunds.

### Business rules

Confirmed with the team on 2026-10-25. For how admins run pools, payments and deliveries
day to day, see the [admin guide](docs/admin-guide.md).

- **Pricing:** shops pay KasiPool, KasiPool pays the supplier. KasiPool keeps one global share of
  the discount (Admin → Settings): `price = list - (1 - share) × (list - bulk)`.
- **Pools:** joining is free. A pool closes as soon as it reaches its target; shops then pay in
  full within the pool's payment window. If unpaid orders leave a gap, the pool reopens for the
  gap until its original closing time, then fails and refunds paid shops if still short. No
  cancelling after paying.
- **Who can join (distance):** every public pool has a centre and a radius (default 10 km). A
  business can join if the place its stock goes to is inside it, so each pool's deliveries stay
  close together. A pool a business asks for is centred on that business (the "hub"); admins
  choose the centre of pools they create and can change any radius when reviewing. Private
  groups (invite code) have no distance limit. Businesses only see how far away a pool is, never
  where it is centred.
- **Delivery:** couriers deliver to the business address or an optional second address. Every
  address needs a map pin (many places have no street number). Delivery fees aren't decided yet:
  one flat fee per order in Admin → Settings, R0 (free) for now.
  Admins record what the courier reports; businesses confirm receipt or report a problem.
- **Who it's for:** every kind of local business (shops, takeaways, salons, taverns, car washes
  and more), not only spaza shops.
- **For now:** one login per shop, no business verification, in-app notifications only, EFT
  payments verified by an admin, suppliers managed by admins.

## Tech stack

| Layer      | Tools                                                                      |
| ---------- | -------------------------------------------------------------------------- |
| Frontend   | [Next.js 16](https://nextjs.org) (App Router), React 19, TypeScript        |
| UI         | Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com) (Radix), lucide icons   |
| Data       | [Supabase](https://supabase.com) (Postgres, Auth, Storage), TanStack Query |
| Backend    | Postgres `SECURITY DEFINER` functions + Supabase Edge Functions (Deno)     |
| Payments   | EFT (bank transfer), verified by an admin                                  |
| Messaging  | In-app notifications; Clickatell SMS hook kept for future sign-in codes    |
| Tests/lint | Vitest, Testing Library, ESLint, Prettier                                  |

## Getting started

### Prerequisites

- Node.js 20.9 or later (npm comes with it)
- A Supabase project, plus the [Supabase CLI](https://supabase.com/docs/guides/cli) if you will
  apply migrations or deploy functions

### Setup

```sh
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

Environment variables (`.env.local`; never commit it):

| Variable                               | Where to find it                       |
| -------------------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase → Project Settings → API      |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys |

The publishable key is meant to be public. Row-level security and the database functions are
what protect the data.

### Scripts

| Command             | What it does                      |
| ------------------- | --------------------------------- |
| `npm run dev`       | Start the dev server              |
| `npm run build`     | Production build                  |
| `npm start`         | Serve the production build        |
| `npm run lint`      | ESLint (includes Prettier checks) |
| `npm run typecheck` | TypeScript type check             |
| `npm test`          | Run the Vitest suite once         |
| `npm run format`    | Format everything with Prettier   |

### Admin accounts

The KasiPool team logs in at `/admin/login` (the **Admin** button in the top banner) with a real
email and password. Shops use phone + PIN at `/auth` and can't get into the admin area. Admin
accounts don't need a shop profile.

To add a team member:

1. In the Supabase dashboard: Authentication → Users → Add user → Create new user, with their
   real email and a password, and tick **Auto Confirm User**.
2. An existing admin enters that email in **Admin → Settings → Administrators** and taps Grant.
3. They log in at `/admin/login` (or tap **Admin** in the top banner).

The very first admin is set once in the database (SQL editor, after creating their user as in
step 1): `insert into user_roles (user_id, role) select id, 'admin' from auth.users where email =
'name@example.com';`. The app no longer offers a "become first administrator" button.

## Project structure

```
src/
  app/                     Next.js routes: each page.tsx sets metadata and renders a view
    (authenticated)/       Pages that need a signed-in user (gated client-side)
      admin/               Admin area (also checks the admin role)
    layout.tsx             Root layout: fonts, metadata, providers
    providers.tsx          React Query, auth context, app shell, toasts
  views/                   Client components for each page ("use client")
  components/
    kp/                    KasiPool components (app shell, pool cards, forms…)
    ui/                    shadcn/ui primitives
  integrations/supabase/   Browser Supabase client and generated DB types
  lib/
    auth.tsx               Auth context: user, business, admin flag
    queries.ts             Shared TanStack Query definitions
    status.ts              Internal status → customer-facing labels
    format.ts              Money/date formatting (ZAR, Africa/Johannesburg)
supabase/
  migrations/              SQL migrations, applied in timestamp order
  functions/               Edge Functions (Clickatell SMS hook, not yet in use)
  config.toml              Supabase CLI config
public/                    Static assets (logo, product images)
```

## How it works

### Pool lifecycle

```
draft → scheduled → open → awaiting_confirmation → funded → procurement
      → stock_received → out_for_delivery → completed
                       ↘ unsuccessful / cancelled / refund_resolution
```

`refresh_pool_states()` opens scheduled pools, closes pools that hit their target or deadline, and
settles payment deadlines. `pg_cron` runs it every minute (job `refresh-pool-states`), and the
client also calls it before it reads pools.

### Architecture rules

These rules are also in [`AGENTS.md`](AGENTS.md):

- All business logic (joining, closing, confirming, paying, procurement, delivery, refunds)
  lives in `SECURITY DEFINER` Postgres functions called with `supabase.rpc(...)`. The client
  never writes to participations, orders or payments directly.
- Supplier costs live in `pool_costs`, which only admins can read. They are kept separate from
  the public `pools` table.
- Interest (participations), orders, payments, purchase orders and refunds are separate tables.
- Roles live in `user_roles`.
- Customer-facing labels come from `src/lib/status.ts`. All money and time formatting goes
  through `src/lib/format.ts`.

### Auth

For the prototype, people sign in with their **mobile number and a 6-digit PIN**. There is no SMS
step yet. Under the hood this is Supabase email/password auth (`src/lib/phone-auth.ts`):

- Each number maps to a hidden login address, e.g. `27721234567@phone.kasipool.co.za`, and the
  PIN is its password. The UI only ever shows the number.
- Supabase must have **Confirm email** turned off (Authentication → Sign In / Providers → Email),
  because those addresses can't receive mail. Never add mail (MX) records to
  `phone.kasipool.co.za`.
- Numbers aren't verified, so someone could register a number that isn't theirs. Turn on SMS
  verification (the `clickatell-sms-hook` below) before real payments go live.
- Forgotten PINs are reset by staff: Supabase dashboard → Authentication → Users → find the
  hidden address → set a new password.
- Team members use email + password at `/admin/login` instead (see "Admin accounts").

New users finish onboarding by adding their business details. Google and email sign-in were
removed from the sign-in page for now; the provider code is in git history.

## Database migrations

Migrations are plain SQL files in `supabase/migrations/`, managed by the Supabase CLI.

```sh
supabase migration new <name>          # create a new migration file
supabase start                         # local Supabase in Docker, applies all migrations
supabase migration up --local          # apply new migrations to the local stack
supabase test db                       # pgTAP tests in supabase/tests/
node scripts/gen-types.mjs             # regenerate src/integrations/supabase/types.ts
supabase link --project-ref <project-ref>
supabase db push                       # apply pending migrations to the live project
```

Without `supabase link`, pass the connection string instead, e.g.
`supabase db push --db-url "$SUPABASE_DB_URL"`. Use the **session pooler** string from the
dashboard's Connect panel: the direct `db.<ref>.supabase.co` host is IPv6-only.

> **Hosting:** the database is the Supabase project `spjmlcodmjdihbxwueot` (eu-west-1). It was
> created fresh from these migrations; the original Lovable Cloud database is no longer used.

## Edge Functions and third-party providers

| Function              | Purpose                                 | JWT check |
| --------------------- | --------------------------------------- | --------- |
| `clickatell-sms-hook` | Send Supabase Auth OTPs over Clickatell | off       |

Card payments (Yoco) and WhatsApp campaign sending were removed on 2026-10-25 (EFT only for
now); their code is in git history.

Secrets are listed in `supabase/functions/.env.example`. Set them with
`supabase secrets set ...`, never as `NEXT_PUBLIC_*` variables. Deploy with:

```sh
supabase functions deploy clickatell-sms-hook --no-verify-jwt
```

Then:

- **Clickatell:** enable phone auth in Supabase. Point the Send SMS hook at the
  `clickatell-sms-hook` function and save the hook secret as `SEND_SMS_HOOK_SECRET`.

## Deployment

The app is a standard Next.js app, so it can be deployed to Vercel or any Node host. Set the two
`NEXT_PUBLIC_SUPABASE_*` variables in the host's settings, and add the deployed URL to Supabase
Auth's site URL and redirect list.
