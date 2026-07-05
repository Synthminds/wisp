/**
 * Password hashing for the two household users — node:crypto scrypt, no new
 * dependency (cost guardrails: ask before adding ANY dependency; none needed).
 *
 * Stored format (env vars AUTH_WES_HASH / AUTH_RIA_HASH):
 *   scrypt$<N>$<r>$<p>$<salt b64url>$<hash b64url>
 * Parameters ride along in the string so they can be raised later without
 * breaking existing hashes. Verification is constant-time.
 */
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LEN = 32;
const DEFAULTS = { N: 16384, r: 8, p: 1 } as const;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const { N, r, p } = DEFAULTS;
  const hash = scryptSync(password, salt, KEY_LEN, { N, r, p });
  return [
    "scrypt",
    N,
    r,
    p,
    salt.toString("base64url"),
    hash.toString("base64url"),
  ].join("$");
}

/** Constant-time verify. Returns false (never throws) on malformed input. */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (![N, r, p].every((n) => Number.isInteger(n) && n > 0)) return false;
  try {
    const salt = Buffer.from(parts[4]!, "base64url");
    const expected = Buffer.from(parts[5]!, "base64url");
    if (expected.length !== KEY_LEN) return false;
    const actual = scryptSync(password, salt, KEY_LEN, {
      N,
      r,
      p,
      // scryptSync default maxmem (32 MiB) rejects N > ~16384 at r=8; give
      // headroom so parameter bumps in the stored string keep verifying.
      maxmem: 128 * 1024 * 1024,
    });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
