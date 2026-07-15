import { describe, expect, it } from "vitest";
import { POST } from "../app/api/auth/logout/route";
import { SESSION_COOKIE } from "../src/lib/auth/session";

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${SESSION_COOKIE}=`);
    // maxAge 0 → the browser drops it immediately.
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
  });
});
