# Repos research (condensed) — full report in chat archive 2026-06-09

Borrow patterns, not dependencies. License notes matter because Wisp may
follow the Path B commercialization route.

## Starter set
- donetick/donetick (AGPL) — the "Things" noticing primitive, NFC triggers,
  recurring chore engine. PATTERNS ONLY — AGPL, do not vendor code.
- grocy/grocy (MIT) — consumption/threshold modeling for T2. MIT: borrow freely.
- nspady/google-calendar-mcp + Google official remote MCPs — calendar wiring.
- RheingoldAI/daily-briefing-agent — gather → synthesize → prioritize agent shape.
- Vercel AI SDK + Vercel Cron heartbeat pattern (Drew Bredvick) — the deterministic
  sweep + scheduled agent split Wisp uses.
- homeassistant-ai/ha-mcp — future HA bridge if sensors ever arrive (post-v1).
- ntfy + Apprise — free push fan-out. iOS web-push requires home-screen PWA install.

## Second wave (Phase 2+)
- Mealie (AGPL) — meal planning concepts for the Meals cluster.
- sysadminsmedia/homebox (AGPL) — household inventory concepts for T2.

## Key takeaway
Nothing OSS implements "capture without assignment." That routing layer —
observation → responsibility matching without nagging a human owner — is
Wisp's novel core and gets built, not borrowed.
