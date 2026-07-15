import { describe, expect, it } from "vitest";
import {
  reconstructPublicUrl,
  verifyTelegramSecret,
  verifyTwilioSignature,
} from "../src/lib/http/webhook";

const telegramReq = (headerValue?: string) =>
  new Request("https://wisp.test/api/webhooks/telegram", {
    headers: headerValue
      ? { "x-telegram-bot-api-secret-token": headerValue }
      : {},
  });

describe("verifyTelegramSecret", () => {
  it("accepts a matching secret-token header", () => {
    expect(verifyTelegramSecret(telegramReq("s3cret"), "s3cret")).toBe(true);
  });
  it("rejects a wrong or missing header, and an unset secret", () => {
    expect(verifyTelegramSecret(telegramReq("nope"), "s3cret")).toBe(false);
    expect(verifyTelegramSecret(telegramReq(), "s3cret")).toBe(false);
    expect(verifyTelegramSecret(telegramReq("s3cret"), undefined)).toBe(false);
  });
});

describe("verifyTwilioSignature", () => {
  // Twilio's documented example vector.
  const url = "https://mycompany.com/myapp.php?foo=1&bar=2";
  const params = {
    CallSid: "CA1234567890ABCDE",
    Caller: "+14158675309",
    Digits: "1234",
    From: "+14158675309",
    To: "+18005551212",
  };
  const authToken = "12345";
  const validSig = "RSOYDt4T1cUTdK1PDd93/VVr8B8=";

  it("accepts Twilio's published example signature", () => {
    expect(verifyTwilioSignature(authToken, validSig, url, params)).toBe(true);
  });

  it("rejects a tampered param", () => {
    expect(
      verifyTwilioSignature(authToken, validSig, url, { ...params, Digits: "9999" }),
    ).toBe(false);
  });

  it("rejects a wrong token, a missing signature, and an unset token", () => {
    expect(verifyTwilioSignature("wrong", validSig, url, params)).toBe(false);
    expect(verifyTwilioSignature(authToken, null, url, params)).toBe(false);
    expect(verifyTwilioSignature(undefined, validSig, url, params)).toBe(false);
  });
});

describe("reconstructPublicUrl", () => {
  it("honors x-forwarded-proto and x-forwarded-host with the query string", () => {
    const req = new Request("http://internal.local/api/webhooks/twilio?x=1", {
      headers: {
        "x-forwarded-proto": "https",
        "x-forwarded-host": "wisp.example.com",
      },
    });
    expect(reconstructPublicUrl(req)).toBe(
      "https://wisp.example.com/api/webhooks/twilio?x=1",
    );
  });
});
