# Display fleet research (condensed) — full report in chat archive 2026-06-10

## Decision: Cozyla anchor + Samsung satellites + Fully Kiosk + Tailscale

- **Anchor:** existing Cozyla kitchen display. Day one it shows the Wisp
  Google Calendar via native sync (zero work). Fully Kiosk sideload is a
  Phase 2.5 validation, not an assumption — check the "Cozyla Frames"
  Facebook group for sideload reports first.
- **Satellites:** Samsung Galaxy Tab A9+ 11" (~$160–220) for anchor rooms,
  Tab A9 8.7" (~$110–140) for small rooms. Rationale: price/perf, Knox-free
  consumer lockdown is adequate with Fully Kiosk, wide availability, decent
  mics for PTT intercom. Fallback if the A9+ fails validation: Lenovo Tab M11.
- **Kiosk software:** Fully Kiosk Browser Plus, ~$11 one-time per device.
  Gives: lockdown/pinned app, boot autostart, screen on/off schedule,
  motion/screensaver, JS injection, and the REST API (port 2323) used for
  remote TTS announce, screen wake, and reload.
- **Staged buy (hard gate):** ONE A9+ first. Phase 2.5 checks: kiosk
  lockdown + autostart, mic capture quality for PTT, remote TTS over
  Tailscale, dashboard compact mode rendering, Cozyla parity. Pass → buy the
  rest (capex ledger). Fail → M11 eval before any further spend.

## Control plane

- FKB REST API on port 2323, password-protected. LAN/Tailscale-only — never
  WAN-exposed, never proxied through a public route. Server-side fleet code
  reaches tablets over the tailnet.
- Device registry (Postgres `device` table) is the source of truth: kind,
  room, fkb_endpoint, fkb_password_env (env var NAME only).
- Remote access: Tailscale free tier (or Cloudflare Tunnel) — $0/mo.

## Intercom v1 (PTT)

Push-to-talk on a tablet → upload → OpenAI gpt-4o-mini-transcribe → TTS
fan-out via FKB `textToSpeech` to selected rooms → SMS transcript to both
parents. Audio blob deleted immediately post-transcription. Live full-duplex
audio, wake words, and always-on mics are out of scope for v1.

## Announce

Inputs: Wisp event templates + SMS from the two verified parent numbers.
Server-side enforcement: 280-char cap, URL strip, quiet hours 20:30–08:00 ET
(queue, don't drop), event-only content. Never include Romy's location
patterns in speaker output.

## Home Assistant

Not a v1 dependency. $0 (reuse) or HA Green $199 (capex, optional, post-v1)
when sensors arrive; ha-mcp is the future bridge. Keep fleet code
HA-independent so the sensor phase is additive.

## Budget placement

All hardware is the ONE-TIME capex ledger ($500–750 approved): staged A9+
first, satellites post-gate, FKB Plus ~$11/device. Enduring ledger impact of
the fleet: $0 (Tailscale free, FKB one-time).
