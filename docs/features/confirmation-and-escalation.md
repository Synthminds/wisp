# Confirmation + escalation (Phase 2)

## Goal
Make the one-tap confirmation the *only* execution event in the system, and let
escalation exist only where a human opted into risk — cancelling the instant a
confirmation lands.

## Data touched
- `confirmation` (the only execution event; XOR signal|plan_item; idempotent)
- `signal` (`escalation_policy`, `state`)
- read-only session identity (never a request-supplied `confirmed_by`)

## Confirmation flow (the ceremony is one tap)
1. Validate the payload with `ConfirmationInput.safeParse` — exactly one of
   `signal_id` / `plan_item_id`.
2. Set `confirmed_by` from the authenticated session. There is NO service-role
   path that inserts a confirmation. Accepting `confirmed_by` from the body is
   a bug.
3. Insert idempotently — the partial unique index per XOR arm means a double-tap
   returns the same row, not a duplicate (`onConflictDoNothing` + read-back).
4. In the SAME transaction, cancel any open escalation for the target
   (`signal.state → 'resolved'`, escalation ladder halted).
5. `photo_url` is an optional state report. Nothing downstream may branch on its
   presence — it is never required, never reviewed, never a gate.

## Escalation engine (deterministic, in the heartbeat)
- Only `criticality = 'critical'` signals and pact items carry an
  `escalation_policy`. Everything else surfaces once and rolls over silently.
- The policy ladder is `push → sms → call` with `after_minutes` steps;
  `cancel_on_confirm` is the literal `true` — a policy that survives
  confirmation is invalid by schema. Validate with Zod at the boundary.
- The 15-minute heartbeat walks due ladders. It is pure date math — no LLM.
- Cancellation is transactional with the confirmation (step 4), so a tap can
  never race a push that was already "about to send."

## Contract guards
- No photo gates, no AI review of completed work, no multi-channel blasts for
  routine items.
- Escalation for a signal the user never marked critical/pact is a bug.

## Verify
- Unit: `ConfirmationInput` XOR (already in `tests/contract.test.ts`); session
  overrides any body `confirmed_by`; double-tap idempotency; escalation cancels
  in the same transaction.
- Integration (Phase-2 gate): a critical signal escalates push → SMS, then a
  confirmation cancels it — assert no further ladder step fires.
