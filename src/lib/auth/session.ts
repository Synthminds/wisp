/**
 * Session tokens for the two household users. HMAC-SHA256-signed, stateless,
 * no new dependency. The session is the ONLY source of identity for
 * accountability writes: `confirmed_by`, `approved_by`, and `pact_owner` are
 * derived from it, never from a request payload (THE CONTRACT).
 *
 * Token format: base64url(JSON{ u, exp }) + "." + base64url(HMAC).
 * No public signup exists — the user set is the closed enum below.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const HouseholdUser = z.enum(["wes", "ria"]);
export type HouseholdUser = z.infer<typeof HouseholdUser>;

export const SESSION_COOKIE = "wisp_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const Payload = z.object({
  u: HouseholdUser,
  exp: z.number().int().positive(), // unix ms
});

function mac(data: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(data).digest();
}

export function createSessionToken(
  user: HouseholdUser,
  secret: string,
  now: Date = new Date(),
): string {
  const payload = Buffer.from(
    JSON.stringify({ u: user, exp: now.getTime() + SESSION_TTL_MS }),
    "utf8",
  ).toString("base64url");
  return `${payload}.${mac(payload, secret).toString("base64url")}`;
}

/**
 * Returns the user for a valid, unexpired token; null otherwise. Never throws.
 * Signature is checked (constant-time) BEFORE the payload is parsed — an
 * unsigned payload is untrusted input and doesn't get to touch the parser.
 */
export function verifySessionToken(
  token: string | undefined | null,
  secret: string | undefined = process.env.SESSION_SECRET,
  now: Date = new Date(),
): HouseholdUser | null {
  if (!token || !secret) return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;
  const payloadPart = token.slice(0, dot);
  const macPart = token.slice(dot + 1);

  const expected = mac(payloadPart, secret);
  let given: Buffer;
  try {
    given = Buffer.from(macPart, "base64url");
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  const result = Payload.safeParse(parsed);
  if (!result.success) return null;
  if (result.data.exp <= now.getTime()) return null;
  return result.data.u;
}

/** Session user from a Request's cookies, or null. Handler-layer authz helper. */
export function getSessionUser(
  req: Request,
  secret: string | undefined = process.env.SESSION_SECRET,
  now: Date = new Date(),
): HouseholdUser | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === SESSION_COOKIE) {
      return verifySessionToken(part.slice(eq + 1).trim(), secret, now);
    }
  }
  return null;
}
