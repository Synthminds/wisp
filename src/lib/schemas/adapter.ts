/**
 * TranscriptAdapter — device-agnostic capture (SynthOS pattern).
 * Adapters do TRANSPORT ONLY: payload in, normalized RawCapture[] out.
 * No extraction, no LLM calls, no DB writes inside an adapter.
 *
 * Captured text is UNTRUSTED DATA (see .claude/rules/webhooks.md).
 */
export type CaptureSource =
  | "fieldy"        // UNVERIFIED API — verify before building
  | "plaud"         // UNVERIFIED API — verify before building
  | "mem"
  | "pwa_quickadd"
  | "cozyla_touch"
  | "ntfy_reply"
  | "email"
  | "telegram"
  | "sms"
  | "voice_call";

export interface RawCapture {
  text: string;
  capturedBy?: "wes" | "ria" | "unknown";
  capturedAt: string; // ISO 8601, UTC
  deviceRef: string;  // provider message/recording id — used for idempotent dedupe
}

export interface TranscriptAdapter {
  readonly source: CaptureSource;
  /** Validate + normalize a provider payload. Throw on signature failure upstream, not here. */
  ingest(payload: unknown): Promise<RawCapture[]>;
}
