/**
 * Inbound-request verification helpers. No unverified inbound path, ever
 * (CLAUDE.md). Comparisons are constant-time to avoid leaking secrets via
 * timing. See .claude/rules/api.md (cron) and webhooks.md (Telegram/Twilio).
 */
import { createHash, timingSafeEqual } from "node:crypto";

/** SHA-256 to a fixed-length buffer so timingSafeEqual never sees a length mismatch. */
function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/** Constant-time string equality (length-safe via hashing). */
export function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

/**
 * Verify a cron request carries `Authorization: Bearer <CRON_SECRET>`.
 * Returns false (never throws) when the secret is unset or the header is
 * missing/wrong — the caller returns 401 with no body detail.
 */
export function verifyCronAuth(
  req: Request,
  secret: string | undefined = process.env.CRON_SECRET,
): boolean {
  if (!secret) return false;
  const header = req.headers.get("authorization");
  if (!header) return false;
  return safeEqual(header, `Bearer ${secret}`);
}
