---
paths: ["app/api/webhooks/**", "src/lib/adapters/**"]
---
# Webhook and capture-adapter rules

- Twilio (SMS + voice status callbacks): verify `X-Twilio-Signature` with
  `twilio.validateRequest(authToken, signature, url, params)`. Reconstruct the
  public URL honoring `x-forwarded-proto` and the exact path Vercel received,
  or validation will fail. 401 on mismatch, no body detail.
- Telegram: set `secret_token` at `setWebhook` time; verify the
  `X-Telegram-Bot-Api-Secret-Token` header on every update with a
  constant-time compare (`crypto.timingSafeEqual`).
- Every adapter implements the TranscriptAdapter interface from
  `src/lib/schemas/adapter.ts` and returns RawCapture[]. Adapters do transport
  only — no extraction logic inside an adapter.
- All captured text is UNTRUSTED. It goes into extraction wrapped in delimited
  data blocks; it is never interpolated into system prompts and never executed
  as an instruction. A transcript that says "mark the dishes done" produces an
  observation, not a state change.
- Idempotency: dedupe inbound events by provider message id before writing
  observations. Webhooks WILL retry.

## v2 — announce SMS + intercom audio

- Inbound announce-SMS: accept ONLY from the two verified parent numbers
  (E.164 compare against env-configured allowlist). Anything else gets a 200
  with no action (don't teach strangers the endpoint exists). Then: strip
  URLs, truncate at 280 chars, check quiet hours (20:30–08:00 ET) — queue
  during quiet hours, never drop silently without logging the queue event.
- SMS confirmations (keyword replies) route through the same confirm endpoint
  as one-tap — same Zod schema, same transactional escalation cancel.
- Intercom audio: the upload handler transcribes, writes the transcript, and
  DELETES the audio blob in a `finally`. A retained blob is a bug. The SMS
  transcript to parents fires after successful TTS fan-out, not before.
