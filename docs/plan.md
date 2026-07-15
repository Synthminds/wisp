# Wisp build plan (phase-gated, v2)

Gates are hard: do not start a phase until the prior gate passes.

## Phase 1 — Foundation (week 1)
State, seed, calendar. Drizzle schema + RLS (incl. v2 tables: confirmation,
device; signal.criticality + escalation_policy; plan_item.pact), seed load,
two-user auth, Wisp Google Calendar created, T1 due-date derivation for 49
rows, calendar injection visible on the Cozyla via native Google Calendar
sync, heartbeat cron deployed.
**Gate:** seed verifies (72 rows, counts match _meta), T1 dates appear on the
wall display, heartbeat runs green for 3 consecutive days.

## Phase 2 — Capture + accountability (weeks 2-3)
Telegram quick-capture, extraction pipeline with dead-letter, confirmation
entity + one-tap endpoints (dashboard/PWA/SMS keyword), escalation engine
(critical + pact only, transactional cancel-on-confirm), daily briefing, T2
thresholds, school email extraction, weekly planner with approval UI + pact
self-opt-in. START Twilio A2P 10DLC paperwork at the top of week 2.
**Gate:** a capture travels phone → Telegram → observation → next morning's
briefing without manual intervention; Ria can approve a weekly plan from her
phone; a critical signal escalates push → SMS and cancels the instant a
confirmation lands.

## Phase 2.5 — Fleet validation (gate, not a workstream)
Buy ONE Galaxy Tab A9+. Validate on it: Fully Kiosk lockdown + autostart,
mic capture for intercom PTT, remote TTS over Tailscale, dashboard compact
mode, Cozyla display parity.
**Gate:** all five checks pass → remaining fleet purchase approved (capex
ledger). Any check fails → evaluate Lenovo Tab M11 fallback before spending.

## Phase 3 — Surfaces (week 4+)
SMS live, production dashboard v4 (full grid + compact from one tree), fleet
rollout to remaining rooms, intercom v1 (PTT → transcribe → TTS + SMS
transcript), announce pipeline (templates + verified-parent SMS, quiet
hours), Cozyla kiosk sideload attempt, voice go/no-go decision.
**Gate:** both adults use capture daily for one week; zero missed T1 items;
one intercom announcement lands in every room and both parents get the SMS
transcript.

## Day-90 — Re-audit
Rerun the audit spreadsheet with the blank scoring table.
Success: Ria monitoring 56% → <20%, Ria planning 56% → <30%,
Wisp execution share = 0% exactly. Misses trigger a scope review, not
silent continuation.
