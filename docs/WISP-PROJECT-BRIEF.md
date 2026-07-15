# WISP — Project Brief (v2)

Household monitoring AI for one family: Wes, Ria, Romy, dog Whidbey.
This brief is the full architecture. CLAUDE.md carries the operating rules;
docs/plan.md carries the phase gates. v2 adds the accountability model (§06)
and the display fleet / intercom / announce stack (§08–§11).

---

## §01 — The Contract

**AI plans. AI monitors. Humans execute.**

The unfair part of household labor is the noticing, not the doing. Wisp takes
over Planning (approval-gated) and Monitoring (autonomous) for all 72 audited
responsibilities. Execution is always human. The data model enforces this:
`execution.owner` is a human enum — there is no `wisp` value, by design and by
Postgres constraint.

Success metric — day-90 re-audit against the original spreadsheet:
- Ria Monitoring 56% → under 20%
- Ria Planning 56% → under 30%
- Wisp Execution share = exactly 0%

Misses trigger a scope review, not silent continuation.

## §02 — Audit & Baseline

Source: Household Responsibility Audit (Google Sheets), 72 rows, transcribed
2026-06-09. Baseline: Ria owns 40/72 Planning and 40/72 Monitoring (56%);
Execution is near parity (Ria 27, Wes 24, shared 19, outsource 1, tbd 1).
Daily-cadence monitoring load: Ria 11 items vs Wes 1.

Seed encoding: all `planning.owner` and `monitoring.owner` flipped to `wisp`;
original humans preserved in `owner_legacy` for the re-audit. Tier split:
49 T1_calendar / 8 T2_state / 15 T3_human_capture. Verified by
`scripts/generate-seed.py` assertions on every regeneration.

## §03 — Stack

- Next.js 15 (App Router) + React 19 + TypeScript strict + Tailwind 4 (CSS-first)
- Neon Postgres with RLS (Drizzle `crudPolicy`, HTTP driver; owner role for
  migrations only)
- Vercel: hosting, cron (15-min heartbeat, daily/weekly agents), AI SDK v5
- Claude API for extraction + briefing + planning agents
- MCP: Google Calendar (Wisp calendar only), Gmail (read-only), Mem (Wisp collection)
- Channels: Telegram (wk 2), Twilio SMS (wk 3, A2P 10DLC starts wk 2), voice
  Phase 2 via ConversationRelay
- STT: OpenAI gpt-4o-mini-transcribe — intercom push-to-talk only

## §04 — Data Model (v2)

Entities (types in `src/lib/schemas/db-types.ts`, Zod in sibling files):

- **responsibility** — the 72 seeded rows. P/M owner = 'wisp'; E owner human enum.
- **observation** — normalized capture. Untrusted raw text; extract validated
  by ObservationExtract; `device_ref` is the idempotency key.
- **signal** — monitoring output. v2 adds `criticality: 'routine' | 'critical'`
  and `escalation_policy` jsonb where `cancel_on_confirm` is the literal `true`
  (a policy that doesn't cancel on confirmation is invalid by schema).
- **confirmation** (NEW) — the only execution event. XOR: exactly one of
  `signal_id` / `plan_item_id`. `confirmed_by` comes from the session — there
  is no service path. `photo_url` optional (state report, never a gate).
  Idempotent via partial unique indexes on each XOR arm.
- **plan / plan_item** — weekly proposals; status flips only on human approval.
  v2 adds `pact: boolean` + `pact_owner` (self-set only: pact_owner must equal
  the session user).
- **briefing** — daily 06:00 output per audience.
- **device** (NEW) — fleet registry: `kind` (cozyla | satellite_a9 |
  satellite_a9plus | phone), `room`, `fkb_endpoint`, `fkb_password_env`
  (stores the env var NAME, never the secret).
- **capture_deadletter** — failed extractions, never guessed.

## §05 — Monitoring Tiers

- **T1_calendar (49 rows)** — deterministic date math. Next-due derivation on
  the heartbeat; injection into the Wisp Google Calendar (day-one Cozyla display).
- **T2_state (8 rows)** — consumption/threshold models (groceries, dog food,
  meds, supplies, trash). Restock signals when projected depletion crosses
  the threshold.
- **T3_human_capture (15 rows)** — humans see, Wisp routes. Capture →
  observation → responsibility match → signal. No nagging a human owner;
  the routing layer is Wisp's novel core.

No cameras. Ever.

## §06 — Accountability (Option A — locked)

Design principle: accountability without surveillance, confirmation without
friction.

- **One-tap confirm is the only execution event.** Dashboard, phone, or SMS
  keyword — one tap, one row in `confirmation`.
- **Photos are optional state reports.** Attachable to a confirmation, never
  required, never reviewed by AI, never a gate.
- **Escalation ladder (push → SMS → call)** exists only for
  `criticality='critical'` signals AND pact items. It cancels transactionally
  on confirmation. Everything routine surfaces once, then rolls over silently
  into weekly patterns for the planner to see.
- **PACT items** — a human promises a specific item this week. Self-opt-in
  only; the API rejects a pact set on someone else. Pact items get the
  escalation ladder because the human asked for it.
- **No nag loops.** Wisp never repeats a routine reminder more than once per
  cycle. Missed routine items become planner input, not noise.

## §07 — Capture Pipeline

Device-agnostic TranscriptAdapter pattern (transport only; no extraction in
adapters). Source enum: fieldy | plaud | mem | pwa_quickadd | cozyla_touch |
ntfy_reply | email | telegram | sms | voice_call | intercom.

Flow: adapter → RawCapture (idempotent by provider ref) → extraction
(generateObject + ObservationExtract + safeParse, one retry, dead-letter on
second failure) → observation → responsibility match → signal.

All captured text is untrusted data — wrapped in delimited blocks for
extraction, never interpolated into system prompts. "Mark the dishes done" in
a transcript produces an observation, not a state change.

Fieldy + Plaud APIs remain UNVERIFIED — no adapters until endpoints are proven.

## §08 — Display Fleet

- **Anchor:** Cozyla kitchen display (owned). Day one: Wisp calendar via
  native Google Calendar sync. Phase 2.5: Fully Kiosk sideload validation.
- **Satellites:** Samsung Galaxy Tab A9+ 11" for anchor rooms (~$160–220) and
  Tab A9 8.7" for small rooms (~$110–140), running Fully Kiosk Browser Plus
  (~$11/device one-time).
- **Staged buy:** ONE A9+ first. It must pass the Phase 2.5 gate (kiosk
  lockdown, mic capture, remote TTS, Cozyla parity) before the rest of the
  fleet is purchased. Fallback hardware: Lenovo Tab M11.
- **Rendering:** one dashboard component tree for every screen — full grid at
  ≥1000px viewport, compact single-column below. No per-device forks.
- **Control plane:** Fully Kiosk REST API, port 2323, LAN/Tailscale only.
  Device registry in Postgres is the source of truth; passwords in env vars
  referenced by name.
- **Remote access:** Tailscale (or Cloudflare Tunnel) — $0.

## §09 — Intercom (v1)

Push-to-talk on any fleet tablet → upload → transcribe (gpt-4o-mini-transcribe)
→ TTS announce to selected rooms via Fully Kiosk `textToSpeech` → SMS
transcript to both parents. Audio blobs are deleted immediately after
transcription; only the text transcript persists. Live full-duplex audio is
explicitly out of scope for v1.

## §10 — Announce

Two inputs, no exceptions:
1. Wisp event templates (briefing ready, critical signal, pact confirmed).
2. Inbound SMS from the two verified parent numbers.

Constraints enforced server-side: 280-character cap, URLs stripped, quiet
hours 20:30–08:00 ET (queued until morning), event-only content — Wisp never
editorializes. Announcements never include Romy's location patterns.

## §11 — Home Assistant

HA is the future sensor brain, not a v1 dependency. $0 (reuse hardware) or
HA Green ($199, capex). v1 touchpoints: none required; the fleet client and
announce fan-out are HA-independent. Post-v1: presence, door sensors, and
the ha-mcp bridge become T2/T3 inputs.

## §12 — iPhone Surface

PWA (installable, ntfy or web push for notifications) + SMS keywords + the
Telegram bot. One-tap confirm must work from a lock-screen notification path.
No native app in v1.

## §13 — Channels

- **Telegram (week 2):** $0, instant, webhook + secret token. Quick capture
  + confirmations + briefing delivery.
- **Twilio SMS (week 3+):** A2P 10DLC Sole Prop registration STARTS week 2
  (~$4 brand + $15 vetting once, ~$2/mo number; 1–4 week approval).
  `validateRequest` on every inbound.
- **Voice (Phase 2):** Twilio ConversationRelay + Claude (~$0.10–0.15/min
  all-in), small always-on WebSocket worker on Fly/Railway ($0–7/mo) — the
  one piece that can't live on Vercel. Gate: SMS adoption proves out first.

## §14 — Heartbeat & Agents

- **Heartbeat (every 15 min, deterministic):** T1 due-date sweep, T2 threshold
  checks, escalation ladder steps, announce queue flush after quiet hours.
  No LLM calls — ever.
- **Daily briefing (06:00 ET):** signals + calendar + weather → briefing row →
  Telegram/ntfy push + dashboard + optional announce.
- **Weekly planner (Sunday):** proposes next week's plan rows (status
  `proposed`); humans approve/amend from phone or wall display.

## §15 — Phases

- **Phase 1 — Foundation (wk 1):** schema + RLS, seed, two-user auth, Wisp
  calendar, T1 engine v0, heartbeat deployed.
  *Gate:* seed verifies; T1 dates visible on Cozyla; heartbeat green 3 days.
- **Phase 2 — Capture + accountability (wks 2–3):** Telegram, extraction
  pipeline, confirmation entity + one-tap endpoints, escalation engine
  (critical + pact), daily briefing, T2 engine v0, Gmail school extraction,
  weekly planner + approval UI. START Twilio A2P paperwork top of week 2.
  *Gate:* capture → observation → briefing untouched by hand; Ria approves a
  weekly plan from her phone; a critical signal escalates and cancels on confirm.
- **Phase 2.5 — Fleet validation (gate, not a phase of work):** buy ONE A9+;
  validate kiosk lockdown, mic capture, remote TTS, Cozyla parity.
  *Gate passes → fleet purchase approved. Fails → Lenovo M11 fallback eval.*
- **Phase 3 — Surfaces (wk 4+):** SMS live, production dashboard v4 (full +
  compact), fleet rollout, intercom v1, announce pipeline, voice go/no-go.
  *Gate:* both adults use capture daily for one week; zero missed T1 items.
- **Day-90 — Re-audit:** rerun the spreadsheet. Targets in §01.

## §16 — Budget

Two ledgers, never mixed:

**Enduring (ceiling $50/mo, projected ~$25–40):**
Neon $0–19, Vercel $0–20, Claude API ~$5–15, Twilio ~$2–4, STT ~$1–3,
Tailscale $0, ntfy $0.

**One-time capex (approved $500–750, small stretch OK):**
Tab A9+ ~$160–220 (staged first), remaining satellites ~$330–500 post-gate,
Fully Kiosk Plus ~$11 × devices, HA Green $199 only if/when sensors phase
begins (optional, post-v1).

Escape valves: drop satellite count; A9 instead of A9+ in small rooms;
Telegram stays primary if A2P stalls > 4 weeks.

## §17 — Open Questions

- Fieldy / Plaud API surfaces (verify before building adapters)
- Cozyla kiosk sideload feasibility ("Cozyla Frames" FB group first)
- Voice worker host: Fly vs Railway vs Render (Phase 2 decision)
- Approval UX primary surface (PWA vs wall display vs ntfy buttons)
- "Date night" responsibility — household conversation, not code

## §18 — Research Index

- `docs/research/repos-research.md` — OSS pattern sources (AGPL cautions)
- `docs/research/voice-sms-research.md` — channel buy-vs-build verdict
- `docs/research/fleet-research.md` — tablets, kiosk software, HA, remote access
- Full reports archived in chat + Mem (project note: #project/wisp)
