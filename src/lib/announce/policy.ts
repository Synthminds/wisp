/**
 * Announce policy — the whole server-side gate for what may reach a speaker,
 * minus the fleet fan-out (intercom-and-announce.md, fleet.md, webhooks.md).
 *
 * Two inputs only: Wisp event templates and SMS from the two verified parent
 * numbers. Every constraint here is enforced BEFORE anything reaches the fleet
 * client — never in the client. Pure and deterministic; the caller supplies the
 * verified-parent allowlist (from env) and dispatches / logs the decision.
 */
import { z } from "zod";
import { isQuietHours } from "../time/et";

export const ANNOUNCE_MAX_CHARS = 280;

export const AnnounceSource = z.enum(["template", "parent_sms"]);
export type AnnounceSource = z.infer<typeof AnnounceSource>;

export const AnnounceInput = z.object({
  source: AnnounceSource,
  /** Raw text — a Wisp template body, or a parent's SMS message. Untrusted. */
  text: z.string().min(1),
  /** E.164 sender, required and verified for `parent_sms`; ignored for templates. */
  from: z.string().optional(),
});
export type AnnounceInput = z.infer<typeof AnnounceInput>;

const URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+/gi;

/** Remove URLs (announcements are event text, never links). Collapses the gaps. */
export function stripUrls(text: string): string {
  return text.replace(URL_PATTERN, "").replace(/\s{2,}/g, " ").trim();
}

/** Hard cap at 280 characters, applied after URL stripping. */
export function truncate280(text: string): string {
  return text.length > ANNOUNCE_MAX_CHARS
    ? text.slice(0, ANNOUNCE_MAX_CHARS)
    : text;
}

const E164 = /^\+[1-9]\d{1,14}$/;

/** True when `from` is a well-formed E.164 number present in the allowlist. */
export function isVerifiedParent(
  from: string | undefined,
  allowlist: ReadonlySet<string>,
): boolean {
  if (!from) return false;
  const trimmed = from.trim();
  return E164.test(trimmed) && allowlist.has(trimmed);
}

export type AnnounceAction = "send" | "queue" | "reject";
export type AnnounceRejectReason = "unverified_sender" | "empty";

export interface AnnounceDecision {
  action: AnnounceAction;
  /** The sanitized text to speak — present for `send` and `queue`. */
  text?: string;
  /** Why a `reject` happened — the caller maps this to its response. */
  reason?: AnnounceRejectReason;
}

/**
 * Decide what happens to an announce request. Pure: no dispatch, no logging.
 *  - `parent_sms` from an unverified sender → reject (caller returns 200 with no
 *    body — don't reveal the endpoint exists).
 *  - text that is empty after URL stripping → reject (nothing to announce).
 *  - quiet hours (20:30–08:00 ET) → queue (caller logs the queue event, never
 *    a silent drop).
 *  - otherwise → send.
 */
export function evaluateAnnounce(
  input: AnnounceInput,
  now: Date,
  allowlist: ReadonlySet<string>,
): AnnounceDecision {
  if (input.source === "parent_sms" && !isVerifiedParent(input.from, allowlist)) {
    return { action: "reject", reason: "unverified_sender" };
  }

  const text = truncate280(stripUrls(input.text));
  if (text.length === 0) {
    return { action: "reject", reason: "empty" };
  }

  if (isQuietHours(now)) {
    return { action: "queue", text };
  }
  return { action: "send", text };
}
