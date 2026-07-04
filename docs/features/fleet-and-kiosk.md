# Display fleet + kiosk (Phase 2.5 gate)

## Goal
Prove ONE Galaxy Tab A9+ can be the fleet template before spending the capex
ledger. Phase 2.5 is a gate, not a workstream: five checks pass or the plan
routes to a Lenovo Tab M11 evaluation instead of a bigger order.

## Data touched
- `device` registry: `kind`, `room`, `fkb_endpoint`, `fkb_password_env`,
  `announce_enabled`. `fkb_password_env` stores the ENV VAR NAME, never a
  secret. No password columns, ever.

## The five gate checks (all must pass)
1. Fully Kiosk lockdown + autostart on the A9+.
2. Mic capture for intercom push-to-talk.
3. Remote TTS over Tailscale (announce fan-out reaches the device).
4. Dashboard compact mode renders correctly (<1000px, single column).
5. Cozyla display parity (calendar-injection view matches).

Any failure → evaluate the Lenovo Tab M11 before any further hardware spend.

## Fleet client (`src/lib/fleet/`, built only after the gate)
- Fully Kiosk REST is port 2323, LAN/Tailscale-only. Never WAN-exposed, never
  hardcode the password — resolve it from `process.env[device.fkb_password_env]`
  at call time.
- Device registry is the single source of truth for which rooms exist and which
  can announce.
- The dashboard is ONE component tree for every screen (full grid ≥1000px,
  compact below). No per-device forks.

## Budget guard
- Capex ledger is $500–750, separate from the $50/mo enduring ceiling — never
  mix them. The staged first A9+ is $160–220; the rest is post-gate only.

## Verify
- Unit: fleet REST client resolves the password from the named env var (not the
  DB); refuses a non-tailnet endpoint.
- Manual gate checklist (hardware): the five checks above, recorded in
  `progress.md` with pass/fail before the purchase decision.
