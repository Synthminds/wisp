# progress.md — session handoff (keep under 50 lines)

## Current state (2026-07-15)
Foundation done + verified (typecheck/lint/build green). Next 15 + React 19 +
Tailwind 4 shell (/api/health); full Drizzle schema with THE CONTRACT in SQL
(human_owner has no 'wisp'; planning/monitoring CHECK='wisp'; confirmation XOR +
partial-unique; RLS on all 9 tables); migration 0000_init; idempotent seed
loader. DB layer PROVEN on real Postgres 16 (migration + verify-contract.sql 6/6;
72 seed rows, tiers 49/8/15, 0 execution=wisp). Deterministic monitoring core:
cron verify (src/lib/http/verify.ts), escalation eval (src/lib/escalation/),
T1 cadence+derive (src/lib/t1/), CRON-gated heartbeat (app/api/cron/heartbeat).
Two-user auth (scrypt + HMAC sessions, /api/auth/login+logout, login page +
session gate on /); needs env SESSION_SECRET + AUTH_*_HASH to sign in.

Credential-free frontier built out (pure cores, DB/network wiring deferred):
ET/school-day module (src/lib/time/et.ts — quiet hours 20:30–08:00 ET);
announce policy (src/lib/announce/policy.ts — 280 cap/URL strip/queue/reject);
webhook verify (src/lib/http/webhook.ts — Telegram secret-token + Twilio HMAC,
checked vs Twilio's published vector); extraction (src/lib/extraction/ —
injection-safe prompt + parse/retry/dead-letter policy); Telegram adapter
(src/lib/adapters/telegram.ts); day-90 share calculator (src/lib/audit/shares.ts,
verified vs the real seed baseline Ria 40/72). 131 tests. PARKED: T2 engine v0
(seed T2_state rows are qualitative, need a threshold-config decision first).

What exists and is verified:
- seed/responsibilities.json — 72 rows, owner totals verified against the
  audit (P legacy 40/15/16/1, M legacy 40/10/21/1), tiers 49/8/15.
  Regenerate only via scripts/generate-seed.py.
- Zod/TS contracts in src/lib/schemas/ (observation, adapter, confirmation,
  db-types) — db-types + confirmation carry the v2 accountability model
- Dashboard.jsx is a SPEC (v4, mock data), not production code
- docs/plan.md v2 (Phase 2.5 fleet gate); WISP-PROJECT-BRIEF.md v2 (18 sections);
  .claude/rules/ has fleet.md alongside db/api/webhooks/ai

## Next action
Cloud DB provisioning is the last Phase-1 blocker and needs creds — follow
docs/features/database-provisioning.md (Neon → db:migrate → db:verify → seed).
Then wire heartbeat DB reads/writes, the confirm endpoint, and two-user auth.

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
