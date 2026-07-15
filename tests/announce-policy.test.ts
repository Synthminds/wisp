import { describe, expect, it } from "vitest";
import {
  AnnounceInput,
  evaluateAnnounce,
  isVerifiedParent,
  stripUrls,
  truncate280,
} from "../src/lib/announce/policy";

const PARENTS = new Set(["+15085551234", "+15085555678"]);

// 12:00Z in July = 08:00 ET (not quiet); 00:30Z = 20:30 ET (quiet).
const DAYTIME = new Date("2026-07-15T12:00:00Z");
const QUIET = new Date("2026-07-16T00:30:00Z");

describe("stripUrls", () => {
  it("removes http/https and www links, collapsing whitespace", () => {
    expect(stripUrls("see https://example.com/x now")).toBe("see now");
    expect(stripUrls("go www.foo.io today")).toBe("go today");
  });
});

describe("truncate280", () => {
  it("caps at 280 characters", () => {
    const long = "a".repeat(500);
    expect(truncate280(long)).toHaveLength(280);
    expect(truncate280("short")).toBe("short");
  });
});

describe("isVerifiedParent", () => {
  it("accepts an allowlisted E.164 number", () => {
    expect(isVerifiedParent("+15085551234", PARENTS)).toBe(true);
  });
  it("rejects an unknown or malformed number", () => {
    expect(isVerifiedParent("+15085550000", PARENTS)).toBe(false);
    expect(isVerifiedParent("5085551234", PARENTS)).toBe(false);
    expect(isVerifiedParent(undefined, PARENTS)).toBe(false);
  });
});

describe("evaluateAnnounce", () => {
  it("sends a template during the day", () => {
    const input = AnnounceInput.parse({ source: "template", text: "Dinner at 6." });
    expect(evaluateAnnounce(input, DAYTIME, PARENTS)).toEqual({
      action: "send",
      text: "Dinner at 6.",
    });
  });

  it("queues during quiet hours instead of dropping", () => {
    const input = AnnounceInput.parse({ source: "template", text: "Reminder." });
    expect(evaluateAnnounce(input, QUIET, PARENTS)).toEqual({
      action: "queue",
      text: "Reminder.",
    });
  });

  it("rejects a parent_sms from an unverified sender", () => {
    const input = AnnounceInput.parse({
      source: "parent_sms",
      text: "hi",
      from: "+19998887777",
    });
    expect(evaluateAnnounce(input, DAYTIME, PARENTS)).toEqual({
      action: "reject",
      reason: "unverified_sender",
    });
  });

  it("accepts a parent_sms from a verified sender", () => {
    const input = AnnounceInput.parse({
      source: "parent_sms",
      text: "Home in 10.",
      from: "+15085551234",
    });
    expect(evaluateAnnounce(input, DAYTIME, PARENTS).action).toBe("send");
  });

  it("strips URLs and caps before deciding", () => {
    const input = AnnounceInput.parse({
      source: "template",
      text: "Details https://example.com/very/long",
    });
    const d = evaluateAnnounce(input, DAYTIME, PARENTS);
    expect(d.action).toBe("send");
    expect(d.text).toBe("Details");
  });

  it("rejects text that is empty after URL stripping", () => {
    const input = AnnounceInput.parse({
      source: "template",
      text: "https://example.com/only",
    });
    expect(evaluateAnnounce(input, DAYTIME, PARENTS)).toEqual({
      action: "reject",
      reason: "empty",
    });
  });
});
