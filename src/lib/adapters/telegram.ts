/**
 * Telegram TranscriptAdapter — transport only (schemas/adapter.ts, webhooks.md).
 * A verified Telegram Update payload in, normalized RawCapture[] out. No LLM, no
 * DB, no extraction here; captured text is untrusted and is only carried, never
 * interpreted. Signature verification happens upstream in the webhook route.
 */
import { z } from "zod";
import type { RawCapture, TranscriptAdapter } from "../schemas/adapter";

type CapturedBy = "wes" | "ria" | "unknown";

/** Only the fields the adapter reads; unknown fields are ignored, not rejected. */
const TelegramUpdate = z
  .object({
    update_id: z.number(),
    message: z
      .object({
        message_id: z.number(),
        from: z.object({ id: z.number() }).optional(),
        chat: z.object({ id: z.number() }),
        date: z.number(), // unix seconds, UTC
        text: z.string().optional(),
      })
      .optional(),
  })
  .passthrough();

/** Map Telegram user ids → household user. Configured from env at wiring time. */
export type TelegramUserMap = ReadonlyMap<number, "wes" | "ria">;

/** Pure normalizer — a parsed Update → RawCapture[] (empty for non-text updates). */
export function toRawCaptures(
  payload: unknown,
  userMap: TelegramUserMap = new Map(),
): RawCapture[] {
  const parsed = TelegramUpdate.safeParse(payload);
  if (!parsed.success) return [];
  const msg = parsed.data.message;
  if (!msg || typeof msg.text !== "string" || msg.text.length === 0) return [];

  const capturedBy: CapturedBy =
    (msg.from && userMap.get(msg.from.id)) || "unknown";

  return [
    {
      text: msg.text,
      capturedBy,
      capturedAt: new Date(msg.date * 1000).toISOString(),
      // provider-unique id → idempotency key for dedupe before an observation write
      deviceRef: `telegram:${msg.chat.id}:${msg.message_id}`,
    },
  ];
}

/** Build the adapter with an optional Telegram-id → household-user map. */
export function createTelegramAdapter(
  userMap: TelegramUserMap = new Map(),
): TranscriptAdapter {
  return {
    source: "telegram",
    ingest: async (payload: unknown) => toRawCaptures(payload, userMap),
  };
}
