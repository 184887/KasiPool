## Architecture rules
- Pool lifecycle, quantity aggregation, payments, procurement and collection logic live in SECURITY DEFINER Postgres functions (called via supabase.rpc); the client never writes participations/orders/payments directly, so rules are enforced server-side.
- `refresh_pool_states()` closes due pools; the client calls it before reading pools. It is not yet scheduled with pg_cron, so a due pool stays open until someone loads a page.
- Supplier costs live in `pool_costs` (admin-only RLS), separate from the publicly readable `pools` table.
- Interest (participations), orders, payments, purchase orders and refunds are separate tables; never collapse them into one status field.
- Customer-facing status labels map from internal statuses in `src/lib/status.ts`; all money/time formatting goes through `src/lib/format.ts` (ZAR, Africa/Johannesburg).
- Roles live in `user_roles`; first admin is claimed once via `claim_first_admin()`.

## Next.js version
- This is Next.js 16, which has breaking changes from older versions. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` and follow its deprecation notices.
