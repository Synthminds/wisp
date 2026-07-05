---
name: verify
description: How to check reality in the Wisp repo — the exact commands to run, the loop protocol, and how to keep the check self-improving. Read before claiming any change is done.
---

# Verify — Wisp

"Done" means verified with pasted evidence from *this* session, never assumed.
This skill is step one of every change, not a formality at the end.

## 1. The tools (run these — never guess how to see reality)

Fast loop (run on every change; this is what "verified" means here):

```
pnpm typecheck   # tsc --noEmit — the contract lives in the type system
pnpm test        # vitest — seed integrity + THE CONTRACT invariants
pnpm lint        # eslint (flat config; no-explicit-any is an error)
```

Before any commit that closes a phase task, also:

```
pnpm build       # next build — must pass
```

Data + schema checks:

```
pnpm seed:verify        # python3 scripts/generate-seed.py — re-asserts 72 rows,
                        # tiers 49/8/15, owner counts; fails on drift
pnpm db:generate        # drizzle-kit — schema must compile to SQL cleanly
pnpm db:verify          # psql scripts/verify-contract.sql — proves THE CONTRACT
                        # on a live DB (needs DATABASE_URL_OWNER + psql)
```

To verify the schema WITHOUT cloud creds: stand up a local Postgres 16
(`/usr/lib/postgresql/16/bin`), `CREATE ROLE authenticated NOLOGIN; CREATE ROLE
anonymous NOLOGIN;` (Neon provides these; a plain PG doesn't — the RLS policies
need them), apply `drizzle/migrations/0000_init.sql`, then run
`scripts/verify-contract.sql`. Run the server as the `postgres` user from a
path it can traverse (e.g. under `/var/lib/postgresql`, not the scratchpad).

The DB (`pnpm seed`, `pnpm db:migrate`) needs `DATABASE_URL` / `DATABASE_URL_OWNER`.
Without them, verify the schema with `pnpm db:generate` and the data with
`pnpm seed:verify` — do not fake a connection.

## 2. The loop protocol

1. Write the change.
2. Run the checks above.
3. If anything fails: read the error, fix the *cause*, return to step 2.
4. Repeat up to 5 times.

Stop conditions:
- All checks pass → report done with the passing output pasted as proof.
- 5 attempts used → stop; report what still fails and what was tried.
- Same error twice in a row → stop. That is guessing. Escalate to the `fixer`
  subagent (fresh context) or the human.

Never weaken, skip, or delete a test to make the loop pass — fix the code.
Never add a normalization/cleanup layer downstream of a defect — fix the cause
layer. Two layers of "correctness" means never knowing which one caused a bug.

## 3. Non-deterministic surfaces (Phase 2+)

Extraction, briefings, and the weekly planner are model-in-the-loop. Do not
write brittle exact-match assertions on their output. Build an observation
harness: run representative captures through the real extractor and dump the
structured `ObservationExtract` results so the pattern is visible at scale.
Read the dashboard, find the failure class, fix the prompt/schema (the cause),
re-run. The harness is the permanent source of truth — run it before a release.

## 4. Keep this self-improving

Every non-obvious discovery — a pitfall, a lever that did nothing, the rule
that finally worked — gets written back into this file in the *same* change
that used it. The loop is adjust → verify → **document**.

### Discoveries

- Seed row shape is `{ planning, monitoring, execution }` objects with
  `owner`/`owner_legacy`/`definition_of_done`; the Drizzle table flattens these
  to `*_owner_legacy` / `*_dod` columns. Keep the seed loader's mapping in sync
  with `src/db/schema.ts`.
- `human_owner` deliberately omits `wisp`; `tests/contract.test.ts` asserts it.
  If a test needs `wisp` as an execution owner, the *test* is wrong.
- pnpm 10 skips build scripts by default — if `vitest`/`tsx` fail to start,
  `pnpm rebuild esbuild`.

## Recommended (opt-in) enforcement

The Synthminds standard is to make the loop physical, not prose. Add to
`.claude/settings.json` (kept out of the shipped file so a human reviews it):

```json
"hooks": {
  "PostToolUse": [
    { "matcher": "Write|Edit|MultiEdit",
      "hooks": [{ "type": "command", "command": "pnpm -s typecheck 2>&1 | tail -20" }] }
  ],
  "Stop": [
    { "hooks": [{ "type": "command", "command": "pnpm -s test 2>&1 | tail -20" }] }
  ]
}
```
