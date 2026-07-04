# TODO — Wisp (single source of truth)

Legend: [ ] open  [~] in progress  [x] done  [-] skipped/deferred

## Phase 1 — Foundation (target: week 1)
- [ ] Init Next.js 15 + TS + Tailwind 4 project, pnpm, strict tsconfig
- [ ] Neon project + Drizzle schema: responsibility, observation, signal
      (criticality + escalation_policy), plan/plan_item (pact + pact_owner),
      confirmation (XOR + partial unique idempotency), briefing, device,
      capture_deadletter
- [ ] RLS policies (crudPolicy) + two-role connection setup
- [ ] `pnpm seed` — idempotent load of seed/responsibilities.json (verify 72 rows, owner counts vs _meta)
- [ ] Auth: two users (wes, ria), session-based, no public signup
- [ ] Google Calendar MCP wiring + dedicated "Wisp" calendar created
- [ ] T1 engine v0: derive next-due dates for the 49 T1_calendar rows; inject to Wisp calendar
- [ ] Vercel deploy + cron heartbeat (15 min) with CRON_SECRET check

## Phase 2 — Capture + accountability (target: weeks 2-3)
- [ ] Telegram bot: webhook route, secret token verify, quick-capture to observation
- [ ] ObservationExtract pipeline (generateObject + safeParse + retry + dead-letter)
- [ ] Confirmation endpoint: one-tap, session-derived confirmed_by, idempotent,
      transactional escalation cancel
- [ ] Escalation engine in heartbeat: critical + pact only, push → SMS → call,
      cancel_on_confirm
- [ ] Pact self-opt-in endpoints (403 PACT_SELF_ONLY on others' behalf)
- [ ] START Twilio A2P 10DLC registration (sole prop) — 1-4 week approval lead time, do this EARLY
- [ ] Daily briefing agent (06:00 ET) → briefing row + ntfy/Telegram push
- [ ] T2 engine v0: thresholds for the 8 T2_state rows; restock signals
- [ ] Gmail read-only school-email extraction (Romy's school senders allowlist)
- [ ] Weekly planning agent (Sun) → proposed plan rows + approval UI

## Phase 2.5 — Fleet validation gate
- [ ] Buy ONE Galaxy Tab A9+ (capex ledger)
- [ ] Fully Kiosk Plus: lockdown, autostart, screen schedule
- [ ] Validate: mic capture (intercom PTT), remote TTS over Tailscale,
      dashboard compact mode, Cozyla parity
- [ ] Gate decision: fleet purchase vs Lenovo M11 fallback eval

## Phase 3 — Surfaces (target: week 4+)
- [ ] Twilio SMS channel live (post-approval) incl. keyword confirmations
- [ ] Dashboard v4 from src/components/Dashboard.jsx spec → production page
      (one tree: full grid ≥1000px, compact <1000px)
- [ ] Device registry + Fully Kiosk REST client (src/lib/fleet/)
- [ ] Fleet rollout: remaining satellites imaged per kiosk checklist
- [ ] Intercom v1: PTT upload → transcribe → TTS fan-out → SMS transcript;
      blob deleted post-transcribe
- [ ] Announce pipeline: templates + verified-parent SMS, 280 cap, URL strip,
      quiet hours 20:30–08:00 ET server-side
- [ ] Cozyla: Fully Kiosk sideload validation (check Cozyla Frames FB group first)
- [ ] Voice Phase 2 decision gate: ConversationRelay worker only if SMS adoption proves out

## Gate
- [ ] Day-90 re-audit: rerun the spreadsheet scoring. Targets: Ria monitoring <20%, planning <30%, Wisp execution = 0%
