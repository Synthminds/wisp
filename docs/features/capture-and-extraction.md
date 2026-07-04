# Capture + extraction pipeline (Phase 2)

## Goal
Turn anything the family says in passing — a Telegram message, later an SMS,
a voice-note transcript, a school email — into a structured `Observation`
routed to a *responsibility*, never to a person. No nagging: routine items
surface once and roll into the weekly pattern.

## Data touched
- `observation` (new row per capture; `device_ref` is the idempotency key)
- `capture_deadletter` (extraction failures land here, never dropped silently)
- `signal` (routed observations may open a signal)
- read-only: `responsibility` (for the best-match guess)

## Flow
1. **Adapter (transport only).** One `TranscriptAdapter` per source
   (`src/lib/adapters/`). It validates + normalizes the provider payload into
   `RawCapture[]`. No LLM, no DB writes, no extraction inside an adapter.
   Signature failures are rejected *upstream* (the webhook), not here.
2. **Ingest.** The route handler verifies the inbound signature (Telegram
   secret-token header), dedupes by `device_ref`, inserts the `observation`
   in state `new`.
3. **Extract.** `generateObject` (AI SDK v5) against `ObservationExtract`, then
   `safeParse`. Retry once on parse failure; on second failure write to
   `capture_deadletter` and stop. The extraction prompt wraps the raw text in a
   clearly delimited data block — it is untrusted data, never instructions.
4. **Route.** Map `responsibility_guess` to a real seed id (never invent one);
   set `observation.state = 'routed'`; open a `signal` where the intent implies
   one (`restock` → `low_stock`, `deadline` → `due`, etc.).

## Contract guards
- Raw transcript text is untrusted: wrap in delimited blocks in every prompt;
  never render unescaped; never log at info level (observations only).
- Extraction NEVER creates a confirmation or marks anything done.
- `intent: "unknown"` goes to review — never guessed into an action.
- No LLM calls in the 15-minute heartbeat; extraction runs per-capture only.

## Verify
- Unit: adapter normalization (fixture payload → expected `RawCapture[]`);
  dead-letter on unparseable extract; idempotent double-delivery (same
  `device_ref` = one row).
- Observation harness: run N representative captures through the real extractor,
  dump `ObservationExtract` results, eyeball the routing/`for_whom` pattern.
  This is the source of truth for extraction quality — brittle exact-match
  assertions are the wrong tool here (see the `verify` skill §3).

## Open questions
- Fieldy / Plaud APIs are UNVERIFIED — verify the real endpoints before writing
  those adapters. Do not build against an imagined API.
- School-email sender allowlist: which addresses count as Romy's school.
