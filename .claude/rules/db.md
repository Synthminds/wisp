---
paths: ["src/db/**"]
---
# Database rules (Neon Postgres + Drizzle)

- Drizzle ORM with the Neon serverless **HTTP** driver (`drizzle-orm/neon-http`).
  Do not introduce Prisma or a TCP pool.
- RLS is declared in the schema with `crudPolicy` from `drizzle-orm/neon`,
  using `authenticatedRole` and `authUid(table.userId)`. Default-deny: a table
  with no policy is intentionally unreadable from the app role.
- Two connection strings exist. `DATABASE_URL` uses the `authenticated` role
  (RLS applies). `DATABASE_URL_OWNER` is `neondb_owner` (BYPASSRLS) — use it
  ONLY in migration scripts and `pnpm seed`, never in app code.
- RLS is a backstop. App-layer authorization checks still happen in handlers.
- Schema changes: edit `src/db/schema.ts`, run `pnpm db:generate`, get approval
  before `pnpm db:migrate`. Never hand-edit files in `drizzle/migrations/`.
- `execution.owner` columns are constrained to human enum values
  ('wes','ria','shared','outsource','tbd') at the DB level. Do not widen the
  enum to include 'wisp'. This is the contract, enforced in Postgres.

## v2 — accountability + fleet tables

- `signal.criticality` is `'routine' | 'critical'` (default 'routine').
  `signal.escalation_policy` is jsonb validated by Zod where
  `cancel_on_confirm` is the LITERAL `true` — a policy that survives
  confirmation is invalid. Only critical + pact rows may carry a policy.
- `confirmation` enforces XOR at the DB level: a CHECK that exactly one of
  `signal_id` / `plan_item_id` is non-null, plus PARTIAL UNIQUE indexes on
  each arm for idempotency (double-tap = same row, not a duplicate).
- `confirmation.confirmed_by` is 'wes' | 'ria' and is set from the session in
  the handler. There is NO service-role code path that inserts confirmations.
  `photo_url` is optional and is never read by any gating logic.
- `plan_item.pact` defaults false; `pact_owner` must equal the authenticated
  user performing the update — enforce in the handler AND with an RLS check.
- `device` registry: `kind` enum ('cozyla','satellite_a9','satellite_a9plus',
  'phone'), `room`, `fkb_endpoint`, `fkb_password_env`. `fkb_password_env`
  stores the ENV VAR NAME, never a secret. No password columns, ever.
