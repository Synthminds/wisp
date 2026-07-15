# Database provisioning (Phase 1 — the current blocker)

## Goal
Stand up the live Neon Postgres, apply the schema, prove the contract holds on
the real database, and load the 72 seeded responsibilities. This is the human
step that unblocks the rest of Phase 1 (auth, heartbeat DB wiring, confirmation
endpoint). It needs credentials, so it can't run in a headless session.

## What's already proven (no cloud needed)
The schema + migration were verified end-to-end against a real Postgres 16
instance in this repo's history:
- `drizzle/migrations/0000_init.sql` applies cleanly (9 tables, RLS on all,
  36 CRUD policies).
- `scripts/verify-contract.sql` passes all six contract assertions.
- The 72 seed rows load with tiers 49/8/15, monitoring legacy owners Ria 40 /
  Wes 10, and **zero** `execution_owner = 'wisp'` rows.

So provisioning is a config + run exercise, not a debugging one.

## Two connection strings (see .claude/rules/db.md)
- `DATABASE_URL` — the **`authenticated`** role. RLS applies. Used by all app
  code (`src/db/index.ts` → `getDb()`).
- `DATABASE_URL_OWNER` — **`neondb_owner`** (BYPASSRLS). Migrations + `pnpm seed`
  only, never in app code.

## Steps
1. **Create the Neon project** (e.g. `wisp`), region close to Vercel's.
2. **Enable Neon RLS / auth** so the `authenticated` and `anonymous` roles
   exist. The RLS policies reference `authenticated`; Neon provisions it with
   its Postgres-auth integration. (On a plain Postgres these roles don't exist —
   `CREATE ROLE authenticated NOLOGIN; CREATE ROLE anonymous NOLOGIN;` — which is
   exactly why the migration's policy statements need them present first.)
3. **Capture both connection strings** into `.env.local` (never commit):
   `DATABASE_URL` (authenticated) and `DATABASE_URL_OWNER` (neondb_owner). Use
   the pooled endpoint for the app, the direct endpoint for migrations.
4. **Apply the schema:** `pnpm db:migrate` (runs under the owner URL via
   `drizzle.config.ts`). Never hand-edit `drizzle/migrations/**`.
5. **Prove the contract on the live DB:** `pnpm db:verify` (runs
   `scripts/verify-contract.sql`; requires `psql` + `DATABASE_URL_OWNER`). Expect
   `ALL CONTRACT ASSERTIONS PASSED`.
6. **Load the seed:** `pnpm seed` (idempotent upsert; re-asserts the contract in
   TS before writing). Expect `Seeded 72 responsibilities`.
7. **Confirm:** `select count(*) from responsibility;` → 72.

## Vercel
Set `DATABASE_URL`, `DATABASE_URL_OWNER`, and `CRON_SECRET` as project env vars
(Production + Preview). The 15-min heartbeat cron (`app/api/cron/heartbeat`)
authenticates with `Authorization: Bearer $CRON_SECRET`.

## Guardrails
- Secrets live only in env / the platform secret manager — never in the repo,
  never in the `device` table (`fkb_password_env` stores the env var NAME).
- Neon free tier keeps this inside the $50/mo enduring ceiling; confirm before
  any paid compute add-on.

## After this
Unblocked next steps: wire the heartbeat's DB reads/writes (the pure cores in
`src/lib/t1/derive.ts` + `src/lib/escalation/evaluate.ts` are ready), the
one-tap confirmation endpoint (transactional escalation cancel), and two-user
auth.
