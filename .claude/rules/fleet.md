---
paths: ["src/lib/fleet/**", "app/api/fleet/**", "app/api/announce/**", "app/api/intercom/**"]
---
# Fleet rules (displays, kiosk control, intercom, announce)

- The `device` table is the single source of truth for the fleet. Never
  hardcode an IP, room name, or endpoint in code — resolve through the
  registry.
- Fully Kiosk Browser REST (port 2323) is reachable over LAN/Tailscale ONLY.
  Never expose it through the public app, never proxy it through a Vercel
  route reachable from the WAN. Fleet control calls originate from trusted
  server contexts on the tailnet.
- The FKB password is read as `process.env[device.fkb_password_env]`. Never
  log it, never echo it in errors, never store it in the DB.
- TTS announce = fan-out of `textToSpeech` REST calls to the target rooms'
  devices. Fan-out is best-effort per device with per-device result logging;
  one offline tablet must not fail the announcement.
- The dashboard is ONE component tree. Full grid ≥ 1000px viewport, compact
  single-column < 1000px via a `useWindowWidth` hook. No per-device forks,
  no user-agent sniffing.
- Kiosk provisioning checklist lives in docs/research/fleet-research.md —
  follow it verbatim when imaging a new tablet (lockdown, autostart, screen
  schedule, remote admin off WAN).
- Intercom v1 is push-to-talk transcribe-then-TTS. Do not build live audio
  streaming, wake words, or always-on mic paths — explicitly out of scope.
- Announce constraints (280-char cap, URL strip, quiet hours 20:30–08:00 ET,
  event-only content, two verified sender numbers) are enforced server-side
  before fan-out. The fleet client renders what it's given; it is not a
  policy layer.
- Cozyla parity: any dashboard feature must degrade acceptably on the Cozyla
  anchor (calendar-injection mode) until the Phase 2.5 sideload gate passes.
