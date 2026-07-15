import { describe, expect, it } from "vitest";
import {
  etWallClock,
  etDateKey,
  isQuietHours,
  isSchoolDay,
} from "../src/lib/time/et";

const at = (iso: string) => new Date(iso);

describe("etWallClock", () => {
  it("converts a UTC instant to ET wall-clock fields", () => {
    // 12:00Z in July is EDT (UTC-4) → 08:00 ET, a Wednesday.
    expect(etWallClock(at("2026-07-15T12:00:00Z"))).toEqual({
      year: 2026,
      month: 7,
      day: 15,
      hour: 8,
      minute: 0,
      weekday: 3,
    });
  });

  it("applies DST — the same 12:00Z is an hour earlier in winter", () => {
    // January is EST (UTC-5) → 07:00 ET, not 08:00. Proves the zone handles DST.
    const jan = etWallClock(at("2026-01-15T12:00:00Z"));
    expect(jan.hour).toBe(7);
    expect(jan.weekday).toBe(4); // Thursday
  });
});

describe("etDateKey", () => {
  it("keys by the ET calendar date, not the UTC date", () => {
    // 00:30Z on the 16th is still 20:30 on the 15th in ET.
    expect(etDateKey(at("2026-07-16T00:30:00Z"))).toBe("2026-07-15");
  });
});

describe("isQuietHours (20:30–08:00 ET, wraps midnight)", () => {
  it("is quiet at exactly 20:30 ET (inclusive start)", () => {
    expect(isQuietHours(at("2026-07-16T00:30:00Z"))).toBe(true); // 20:30 ET
  });

  it("is not quiet at 20:29 ET (just before the window)", () => {
    expect(isQuietHours(at("2026-07-16T00:29:00Z"))).toBe(false); // 20:29 ET
  });

  it("is quiet at 07:59 ET (still inside)", () => {
    expect(isQuietHours(at("2026-07-16T11:59:00Z"))).toBe(true); // 07:59 ET
  });

  it("is not quiet at exactly 08:00 ET (exclusive end)", () => {
    expect(isQuietHours(at("2026-07-16T12:00:00Z"))).toBe(false); // 08:00 ET
  });

  it("is quiet across midnight", () => {
    expect(isQuietHours(at("2026-07-16T04:00:00Z"))).toBe(true); // 00:00 ET
  });
});

describe("isSchoolDay", () => {
  it("is true on a weekday with no holiday", () => {
    expect(isSchoolDay(at("2026-07-15T12:00:00Z"))).toBe(true); // Wednesday
  });

  it("is false on the weekend", () => {
    expect(isSchoolDay(at("2026-07-18T15:00:00Z"))).toBe(false); // Saturday
    expect(isSchoolDay(at("2026-07-19T15:00:00Z"))).toBe(false); // Sunday
  });

  it("is false on an injected no-school date", () => {
    const noSchool = new Set(["2026-07-15"]);
    expect(isSchoolDay(at("2026-07-15T12:00:00Z"), noSchool)).toBe(false);
  });
});
