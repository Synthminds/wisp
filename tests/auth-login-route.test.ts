import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST } from "../app/api/auth/login/route";
import { hashPassword } from "../src/lib/auth/password";
import { SESSION_COOKIE } from "../src/lib/auth/session";

const url = "https://wisp.test/api/auth/login";
const post = (body: unknown) =>
  POST(
    new Request(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret";
    process.env.AUTH_WES_HASH = hashPassword("wes-password");
    process.env.AUTH_RIA_HASH = hashPassword("ria-password");
  });
  afterEach(() => {
    delete process.env.SESSION_SECRET;
    delete process.env.AUTH_WES_HASH;
    delete process.env.AUTH_RIA_HASH;
  });

  it("logs in a household user and sets the session cookie", async () => {
    const res = await post({ user: "wes", password: "wes-password" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", user: "wes" });
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${SESSION_COOKIE}=`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
  });

  it("401s on a wrong password with a generic error", async () => {
    const res = await post({ user: "wes", password: "ria-password" });
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("UNAUTHORIZED");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("400s on a user outside the closed enum (no public signup)", async () => {
    const res = await post({ user: "mallory", password: "x" });
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("INVALID_INPUT");
  });

  it("400s on a non-JSON body", async () => {
    const res = await POST(new Request(url, { method: "POST", body: "not json" }));
    expect(res.status).toBe(400);
  });

  it("401s when the server has no hash configured for the user", async () => {
    delete process.env.AUTH_RIA_HASH;
    const res = await post({ user: "ria", password: "ria-password" });
    expect(res.status).toBe(401);
  });
});
