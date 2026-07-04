# Intercom + announce (Phase 3)

## Goal
Room-to-room voice without an always-on mic. Push-to-talk on any tablet →
transcribe → speak into selected rooms → SMS the transcript to both parents.
Announcements are event-only; Wisp never editorializes over the speakers.

## Intercom v1 (push-to-talk, transcribe-then-TTS)
1. Hold the orb on a tablet → record → release. No wake words, no live audio,
   no always-on mic.
2. Upload the blob; transcribe with OpenAI `gpt-4o-mini-transcribe` (intercom
   PTT is the ONLY STT use).
3. Delete the audio blob the moment transcription completes.
4. Fan out the text to selected rooms via the kiosk TTS API (fleet client).
5. SMS the transcript to both verified parent numbers.

## Announce — exactly two inputs
- Wisp event templates, and SMS from the two verified parent numbers. Nothing
  else can drive a speaker.
- Server-side enforcement (not in the client): 280-char cap, URLs stripped,
  quiet hours 20:30–08:00 ET (queued, not dropped).
- Event-only content. Romy's location patterns never reach a speaker.

## Data touched
- `device` (`announce_enabled`, `fkb_endpoint`); read-only `briefing` templates.
- No transcript persistence beyond the SMS record; the audio blob is deleted.

## Contract / security guards
- Two inputs only — reject any other announce source.
- Child-data rule: when in doubt about any surface (wall, speaker,
  notification), don't. Location patterns never announced.
- Verify every inbound path: Twilio `validateRequest` on parent SMS; the fleet
  TTS call stays on the tailnet.

## Verify
- Unit: quiet-hours queueing (20:30–08:00 ET), 280-char cap, URL stripping,
  rejection of an unverified announce source; blob deletion after transcribe.
- Integration (Phase-3 gate): one announcement lands in every room AND both
  parents receive the SMS transcript.
