# Day-90 re-audit (the measurement)

## Goal
Prove the thesis with the same instrument that set the baseline. Re-run the
original Household Responsibility Audit spreadsheet against a blank scoring
table and compare like-for-like.

## Why it works
The seed preserved every original human owner in `*_owner_legacy` while the live
`owner` flipped to `wisp` for planning + monitoring. So the re-audit compares
the *legacy* baseline against measured reality without re-transcribing anything.
`scripts/generate-seed.py` asserts the baseline counts on every regeneration, so
the yardstick itself cannot silently drift.

## Baseline (from the audit / brief)
- Ria planning: 40/72 (56%) · Ria monitoring: 40/72 (56%)
- Daily-cadence monitoring: 11 items on Ria to 1 elsewhere
- Execution near parity already; Wisp execution = 0%

## Success criteria
- Ria monitoring share: 56% → **< 20%**
- Ria planning share: 56% → **< 30%**
- Wisp execution share: **exactly 0%**

A miss triggers a scope review, not silent continuation.

## How to measure
- Pull confirmations, plan approvals, and signal resolutions over the window;
  attribute planning/monitoring load to Wisp where it proposed/surfaced and a
  human only approved/executed.
- Execution share for Wisp is asserted to be 0 by construction (the
  `human_owner` enum has no `wisp`); the re-audit re-confirms nothing wrote to
  an execution-completion path on Wisp's behalf.

## Verify
- The re-audit query is itself tested: given a fixture of confirmations/plans,
  the computed shares match hand-calculated expectations.
- Re-run `pnpm seed:verify` first so the baseline it compares against is intact.
