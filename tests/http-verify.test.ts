import { describe, expect, it } from "vitest";
import { safeEqual, verifyCronAuth } from "../src/lib/http/verify";

describe("safeEqual", () => {
  it("is true for identical strings", () => {
    expect(safeEqual("hunter2", "hunter2")).toBe(true);
  });
  it("is false for different strings (including different lengths)", () => {
    expect(safeEqual("hunter2", "hunter3")).toBe(false);
    expect(safeEqual("short", "a-much-longer-value")).toBe(false);
  });
});

describe("verifyCronAuth", () => {
  const secret = "cron-secret-123";
  const withAuth = (value: string) =>
    new Request("https://wisp.test/api/cron/heartbeat", {
      headers: { authorization: value },
    });

  it("accepts a correct Bearer token", () => {
    expect(verifyCronAuth(withAuth(`Bearer ${secret}`), secret)).toBe(true);
  });
  it("rejects a wrong token", () => {
    expect(verifyCronAuth(withAuth("Bearer nope"), secret)).toBe(false);
  });
  it("rejects a missing Authorization header", () => {
    expect(
      verifyCronAuth(new Request("https://wisp.test/api/cron/heartbeat"), secret),
    ).toBe(false);
  });
  it("rejects when no secret is configured", () => {
    expect(verifyCronAuth(withAuth("Bearer anything"), undefined)).toBe(false);
  });
});
