# Weekly planner + pacts (Phase 2)

## Goal
Every Sunday, Wisp *proposes* a weekly plan a human approves or edits. Plans are
proposals until approved; a person may add a self-pact to their own week, and
nobody else's.

## Data touched
- `plan` (`status`, `approved_by`, `week_of`)
- `plan_item` (`proposal`, `pact`, `pact_owner`)
- read-only: `responsibility`, recent `observation` / `signal` for context

## Flow
1. **Propose (agent, LLM).** The Sunday planner reads the week's context and
   emits `plan_item` proposals for the family lane. New plan row starts
   `status = 'proposed'`. This is the only LLM step here.
2. **Surface.** The dashboard Week view renders proposed items dashed until a
   human approves (see `src/components/Dashboard.jsx`). Work lanes (Ria/Wes)
   are read-only mirrors — Wisp writes only to the Family lane.
3. **Approve (human event).** Only a human approval moves `proposed → approved`
   and sets `approved_by`. An amend produces `amended`; a decline `rejected`.
4. **Pact (self-opt-in).** Setting `pact = true` requires `pact_owner` to equal
   the authenticated user. Attempting to pact on someone else's behalf returns
   `PACT_SELF_ONLY` (403). Enforced in the handler AND by an RLS check; the
   `pact_requires_owner` CHECK backstops it at the DB.

## Contract guards
- No plan item is ever auto-approved. `status` leaves `proposed` only on a human
  event.
- Pacts are the only thing that raises a routine item to escalation-eligible,
  and only for the person who made the pact.

## Verify
- Unit: approval transition requires a session human; `PACT_SELF_ONLY` when
  `pact_owner` ≠ session user; `pact_requires_owner` CHECK rejects
  `pact = true` with null owner.
- Integration (Phase-2 gate): Ria approves a plan from her phone; the approved
  items appear set (not dashed) on the wall display.

## Open questions
- Primary approval surface: PWA vs wall display vs ntfy buttons (brief §open).
- "Date night" row is a household conversation, not code — leave it out of the
  proposer until the family decides.
