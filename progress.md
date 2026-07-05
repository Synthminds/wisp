# progress.md — session handoff (keep under 50 lines)

## Current state (2026-07-04)
v2 scaffold unpacked; Phase 1 foundation built and verified (typecheck, lint,
13 tests, next build all green; seed:verify 72 rows / 49-8-15). Global Coding
Rules (Synthminds, via Mem) referenced from CLAUDE.md; v4 briefing PDF in docs/.

Now present: Next 15 + React 19 + Tailwind 4 app shell (+ /api/health),
full Drizzle schema in src/db/schema.ts with THE CONTRACT enforced in SQL
(human_owner enum has no 'wisp'; planning/monitoring owner CHECK='wisp';
confirmation XOR + partial-unique idempotency; RLS crudPolicy on all 9 tables),
migration drizzle/migrations/0000_init.sql, idempotent seed loader, contract
tests, feature plans in docs/features/, verify skill + fixer agent in .claude/.
Also: EscalationPolicy Zod schema (cancel_on_confirm literal true) and the T1
cadence engine v0 (src/lib/t1/cadence.ts). Plus the deterministic monitoring
core: cron-auth verify (src/lib/http/verify.ts, constant-time), escalation
evaluation (src/lib/escalation/evaluate.ts), T1 due-signal derivation
(src/lib/t1/derive.ts), and the CRON_SECRET-gated force-dynamic heartbeat route
(app/api/cron/heartbeat). All pure/LLM-free; DB wiring deferred. 66 tests green.

What exists and is verified:
- seed/responsibilities.json — 72 rows, owner totals verified against the
  audit (P legacy 40/15/16/1, M legacy 40/10/21/1), tiers 49/8/15.
  Regenerate only via scripts/generate-seed.py.
- Zod/TS contracts in src/lib/schemas/ (observation, adapter, confirmation,
  db-types) — db-types + confirmation carry the v2 accountability model
- Dashboard.jsx is a SPEC (v4: full + compact + intercom sheet) with mock
  data, not production code
- docs/plan.md v2 (adds Phase 2.5 fleet gate); docs/WISP-PROJECT-BRIEF.md v2
  (18 sections incl. fleet/intercom/announce)
- .claude/rules/ now includes fleet.md alongside db/api/webhooks/ai

## Next action
Provision a Neon project, set DATABASE_URL(_OWNER), run `pnpm db:migrate` then
`pnpm seed`, and confirm 72 rows land. Then two-user auth + the T1 calendar
engine v0 (docs/features/ has the Phase-2/2.5/3 plans). DB-less checks:
`pnpm typecheck && pnpm test && pnpm lint && pnpm build && pnpm seed:verify`.

## Standing constraints (do not relearn these)
- THE CONTRACT: execution.owner is never 'wisp' (see CLAUDE.md)
- Accountability is Option A: one-tap confirm only; escalation = critical +
  pact only, cancel-on-confirm transactional; photos optional, never gates
- Budgets are two ledgers: $50/mo enduring ceiling; $500–750 one-time capex
  (fleet). Ask before any paid addition.
- Staged buy: ONE A9+ must pass the Phase 2.5 gate before fleet purchase
- Twilio A2P registration must START in week 2 (long approval lead)
- Fieldy + Plaud APIs are UNVERIFIED — do not build adapters against
  imagined APIs; verify endpoints first
