/**
 * Inbound webhook signature verification for the two external capture channels
 * (webhooks.md). Pure crypto — no SDK dependency. Both verifiers return false
 * (never throw) on any failure; the caller returns 401 with no body detail.
 *
 * The constant-time primitive `safeEqual` lives in ./verify and is reused here.
 */
import { createHmac } from "node:crypto";
import { safeEqual } from "./verify";

/**
 * Telegram: the `secret_token` set at setWebhook time is echoed back in the
 * `X-Telegram-Bot-Api-Secret-Token` header on every update. Constant-time compare.
 */
export function verifyTelegramSecret(
  req: Request,
  secret: string | undefined = process.env.TELEGRAM_SECRET_TOKEN,
): boolean {
  if (!secret) return false;
  const header = req.headers.get("x-telegram-bot-api-secret-token");
  if (!header) return false;
  return safeEqual(header, secret);
}

/**
 * Twilio's request-signature scheme:
 *   data = fullUrl + concat(sortedKeys.map(k => k + params[k]))
 *   expected = base64(HMAC-SHA1(authToken, data))
 * compared constant-time against the `X-Twilio-Signature` header.
 *
 * `url` must be the exact public URL Twilio signed — reconstruct it honoring
 * `x-forwarded-proto` and the received path (see reconstructPublicUrl), or the
 * comparison will fail even for a genuine request.
 */
export function verifyTwilioSignature(
  authToken: string | undefined,
  signatureHeader: string | null | undefined,
  url: string,
  params: Record<string, string>,
): boolean {
  if (!authToken || !signatureHeader) return false;
  let data = url;
  for (const key of Object.keys(params).sort()) {
    data += key + params[key];
  }
  const expected = createHmac("sha1", authToken)
    .update(Buffer.from(data, "utf-8"))
    .digest("base64");
  return safeEqual(signatureHeader, expected);
}

/**
 * Reconstruct the public URL Twilio signed, from a proxied request. Vercel sits
 * behind a proxy, so trust `x-forwarded-proto`/`x-forwarded-host` when present.
 * Query string is preserved (Twilio signs the full URL including it).
 */
export function reconstructPublicUrl(req: Request): string {
  const original = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") ?? original.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? original.host;
  return `${proto}://${host}${original.pathname}${original.search}`;
}
