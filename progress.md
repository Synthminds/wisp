# progress.md — session handoff (keep under 50 lines)

## Current state (2026-07-04)
v2 kickoff scaffold unpacked into the repo and Phase 1 foundation scaffolding
started. Global Coding Rules (Synthminds Engineering Standards, via Mem) now
referenced from CLAUDE.md; v4 executive briefing PDF added to docs/.

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
Phase 1, first task: project init + Drizzle schema (v2 tables included).
Read docs/plan.md §Phase 1 and .claude/rules/db.md before touching the schema.

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
