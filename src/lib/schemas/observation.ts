import { z } from "zod";

/**
 * ObservationExtract — the spine of capture.
 * Every capture source (Telegram, SMS, voice, wearable transcript, email)
 * funnels raw text into extraction, which must produce exactly this shape.
 * Change deliberately: every adapter and the briefing agent depend on it.
 */
export const ObservationIntent = z.enum([
  "restock",      // something is running low / out
  "task",         // something needs doing (routes to a responsibility, NOT a person)
  "event",        // something is happening at a time
  "deadline",     // something is due by a time
  "state_report", // something was done / is in some state
  "idea",         // keep for the weekly plan, no action
  "unknown",      // extraction couldn't classify — goes to review, never guessed
]);

export const ObservationExtract = z.object({
  intent: ObservationIntent,
  summary: z.string().min(1).max(280),
  /** best-match responsibility id from seed, or null — never invent ids */
  responsibility_guess: z.string().nullable(),
  /** for restock/state: "low", "out", "half", a count, etc. */
  quantity_or_level: z.string().nullable(),
  /** unparsed time hint, e.g. "Friday", "before school" — heartbeat resolves it */
  due_hint: z.string().nullable(),
  for_whom: z.enum(["wes", "ria", "romy", "family", "unknown"]),
});

export type ObservationExtract = z.infer<typeof ObservationExtract>;
export type ObservationIntent = z.infer<typeof ObservationIntent>;
