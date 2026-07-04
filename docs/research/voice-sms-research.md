# Voice/SMS channel research (condensed) — full report in chat archive 2026-06-09

## Decision: BUILD hybrid. Do not buy an assistant product.
All off-the-shelf household assistants (Martin ~$21-30/mo, Ohai $9.99-29.99,
Dola) are walled gardens: no API, no webhook export, can't feed Wisp's
observation pipeline. Milo and Yohana both shut down — category churn is real.

## Build sequence
1. Week 2 — Telegram bot. $0, instant, both adults. Webhook + secret token.
2. Week 2 — START Twilio A2P 10DLC (Sole Prop): ~$4 brand + $15 vetting once,
   ~$2/mo number. Approval takes 1-4 weeks — paperwork first, build later.
3. Week 3+ — SMS live via Twilio once approved. validateRequest on every inbound.
4. Phase 2 — Voice via Twilio ConversationRelay + Claude (~$0.10-0.15/min
   all-in). Official Anthropic sample exists. Needs a small always-on WebSocket
   worker (Fly/Railway, $0-7/mo) — the one piece that can't live on Vercel.

## Rejected
- OpenAI Realtime: cost at our volume.
- ElevenLabs Agents: plan fee dominates at low volume.
- Vapi/Retell: fine managed fallbacks if ConversationRelay fights us.

## Research-on-demand
Same channels handle "Wisp, look this up": Claude web-search tool-use on the
SMS/Telegram thread. No separate product needed.
