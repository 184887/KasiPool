# CLAUDE.md

Guidance for Claude Code in this repo. Architecture rules live in AGENTS.md and apply here too:

@AGENTS.md

## Project

KasiPool is a mobile-first Next.js app that lets small township businesses in Cape Town pool
stock orders to reach wholesale prices. Customers join pools, confirm and pay once a pool hits
its target, then collect their stock. Admins run products, suppliers, pools, payments and
collections. See README.md for setup.

## Commands

```sh
npm run dev          # dev server on http://localhost:3000
npm run lint         # ESLint + Prettier check
npm run typecheck    # tsc --noEmit
npm test             # Vitest
npm run build        # production build
```

Run lint, typecheck, test and build before committing. Format with `npx prettier --write`.

## Code layout

- `src/app/**/page.tsx`: server components that only export `metadata` and render a view. Page
  titles are short ("My Pools"); the root layout's template appends "| KasiPool".
- `src/views/`: the page UI as client components (`"use client"`). Put page logic here.
- `src/app/(authenticated)/`: pages behind the client-side `RequireAuth` gate; `admin/` also
  checks the admin role.
- `src/components/kp/`: KasiPool components. `src/components/ui/`: shadcn/ui primitives (we own
  this code; edit it to fit the theme).
- Data access is client-side through `supabase` from `@/integrations/supabase/client` and
  TanStack Query. Mutations go through `supabase.rpc(...)` only (see AGENTS.md).
- Navigation uses `next/link` and `next/navigation`, never `window.location` for in-app routes.

## UI and theme

- Stack: shadcn/ui + Tailwind 4. Do not add another component library.
- The theme follows the pitch deck in `docs/pitch-deck/`. All colours are tokens in
  `src/styles.css`; use token classes (`bg-ink`, `text-ember`, `bg-gold`, `text-leaf`...), never
  hex values in components.
  - ink `#1C1A17`, paper `#F3F0EA`, orange (`gold`) `#F2892B`, deep orange (`ember`) `#A64A14`,
    green (`leaf`) `#1F5E3B`, yellow (`sun`) `#F7C934`.
  - Never use orange `#F2892B` for text on paper (fails contrast); use `text-ember`.
- Fonts (via next/font): `font-headline` = Anton for big titles (single weight, never bold it),
  `font-display` = Bricolage Grotesque for headings, Archivo for body.
- Look: cream "paper" pages, dark ink only for the header bar and hero sections, flat surfaces,
  near-square corners, thick ink rules. No dark mode.
- Logo: `Logo` / `LogoMark` in `src/components/kp/pool-bits.tsx` (SVG rings). Name line: "KasiPool |
  Collective Buying Alliance". Tagline: "Buy Together. Profit Better."
- Users are shop owners on low-end phones and paid data, often with limited digital literacy:
  keep pages light, text plain, tap targets large (buttons are 48px tall), flows short.
- Keep text and background colours at WCAG AA contrast or better.

## Writing style

- Do not use em dashes (U+2014) anywhere in the repo: code, UI copy, comments, docs or commit
  messages. Use a colon, comma, full stop or parentheses instead. Use "-" for an empty table cell.
- UI copy is South African English (en-ZA): "colour", "organise", "R219.00".
- Money and dates go through `src/lib/format.ts` (ZAR, Africa/Johannesburg).

## Database

- Supabase project `spjmlcodmjdihbxwueot` (eu-west-1). Migrations live in
  `supabase/migrations/` and are applied with the Supabase CLI.
- Never edit a migration that has been applied; add a new one with
  `npx supabase migration new <name>`.
- The direct `db.<ref>.supabase.co` host is IPv6-only; use the session pooler URL in
  `SUPABASE_DB_URL` (`.env.local`).
- Pushing migrations or deploying Edge Functions changes the live project: ask first.
- Test schema changes on the local stack first: `npx supabase start` (Docker), then
  `npx supabase migration up --local` and `npx supabase test db` (pgTAP tests in
  `supabase/tests/`). Add tests for new database functions.
- Regenerate `src/integrations/supabase/types.ts` with `node scripts/gen-types.mjs` (reads the
  local stack). RPC arguments that accept null go in its `NULLABLE_ARGS` list.

### Sign-in

- Prototype auth is mobile number + 6-digit PIN on Supabase email/password auth: each number
  maps to `<27...>@phone.kasipool.co.za` via `src/lib/phone-auth.ts`. Always go through
  `phoneToLogin` / `loginToPhone`; never show the hidden address in the UI.
- Supabase **Confirm email** must stay off, and `phone.kasipool.co.za` must never get MX records.

### Supabase agent skills

`.claude/skills/supabase` and `.claude/skills/supabase-postgres-best-practices` are Supabase's
own skills, installed with `npx skills add supabase/agent-skills` and pinned in
`skills-lock.json`. Update them with `npx skills update`; don't edit the files by hand. Where they
disagree with this file, this file wins:

- Business logic in SECURITY DEFINER functions in `public` is deliberate (see AGENTS.md). Don't
  switch them to SECURITY INVOKER or move them; every new one must check `auth.uid()` or
  `has_role(...)` in its body.
- There is no local database. `supabase db query`, MCP `execute_sql` and `apply_migration` would
  run on the live project, so ask first. Write schema changes as a new migration file instead
  of using `supabase db pull`.

## Secrets

- `.env` and `.env.*` are git-ignored (except `.env.example`). Never commit keys, passwords or
  connection strings.
- Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` may be public.
  Provider secrets (e.g. Clickatell) are Supabase Edge Function secrets.

## Git

- Work on a feature branch and open a PR into `main`; don't commit to `main` directly.
