import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  getSessionUser,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  verifySessionToken,
} from "../src/lib/auth/session";

const SECRET = "test-session-secret";
const now = new Date("2026-07-05T12:00:00Z");

describe("session tokens", () => {
  it("round-trips a valid token", () => {
    const token = createSessionToken("ria", SECRET, now);
    expect(verifySessionToken(token, SECRET, now)).toBe("ria");
  });

  it("expires after the TTL", () => {
    const token = createSessionToken("wes", SECRET, now);
    const later = new Date(now.getTime() + SESSION_TTL_MS + 1);
    expect(verifySessionToken(token, SECRET, later)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = createSessionToken("wes", "other-secret", now);
    expect(verifySessionToken(token, SECRET, now)).toBeNull();
  });

  it("rejects a tampered payload (identity cannot be forged)", () => {
    const token = createSessionToken("ria", SECRET, now);
    const [payload, mac] = token.split(".") as [string, string];
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    json.u = "wes"; // try to become someone else
    const forged =
      Buffer.from(JSON.stringify(json), "utf8").toString("base64url") + "." + mac;
    expect(verifySessionToken(forged, SECRET, now)).toBeNull();
  });

  it("rejects garbage, empty, and missing tokens without throwing", () => {
    for (const bad of [undefined, null, "", ".", "a.", ".b", "not-a-token", "a.b.c"]) {
      expect(verifySessionToken(bad, SECRET, now)).toBeNull();
    }
  });

  it("rejects everything when no secret is configured", () => {
    const token = createSessionToken("wes", SECRET, now);
    expect(verifySessionToken(token, undefined, now)).toBeNull();
  });
});

describe("getSessionUser", () => {
  const url = "https://wisp.test/api/anything";

  it("extracts the user from the session cookie", () => {
    const token = createSessionToken("wes", SECRET, now);
    const req = new Request(url, {
      headers: { cookie: `other=1; ${SESSION_COOKIE}=${token}; theme=dark` },
    });
    expect(getSessionUser(req, SECRET, now)).toBe("wes");
  });

  it("returns null with no cookie header", () => {
    expect(getSessionUser(new Request(url), SECRET, now)).toBeNull();
  });

  it("returns null for an invalid cookie value", () => {
    const req = new Request(url, {
      headers: { cookie: `${SESSION_COOKIE}=forged.token` },
    });
    expect(getSessionUser(req, SECRET, now)).toBeNull();
  });
});
