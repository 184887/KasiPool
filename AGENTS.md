## Architecture rules

- Pool lifecycle, quantity aggregation, payments, procurement and delivery logic live in SECURITY DEFINER Postgres functions (called via supabase.rpc); the client never writes participations/orders/payments directly, so rules are enforced server-side.
- `refresh_pool_states()` moves pools through their lifecycle; pg_cron runs it every minute (job `refresh-pool-states`) and the client also calls it before reading pools.
- Supplier costs live in `pool_costs` (admin-only RLS), separate from the publicly readable `pools` table.
- Interest (participations), orders, payments, purchase orders and refunds are separate tables; never collapse them into one status field.
- Customer-facing status labels map from internal statuses in `src/lib/status.ts`; all money/time formatting goes through `src/lib/format.ts` (ZAR, Africa/Johannesburg).
- Roles live in `user_roles`. Admins are email + password accounts that log in at `/admin/login`; the first admin is set once in SQL (the `claim_first_admin()` button was removed from the app).

## Next.js version

- This is Next.js 16, which has breaking changes from older versions. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` and follow its deprecation notices.
