import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { nextDueDate, parseFrequency } from "../src/lib/t1/cadence";

const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
// 2026-01-02 is a Friday (2026-01-01 is a Thursday).
const FRIDAY = new Date(Date.UTC(2026, 0, 2));

describe("parseFrequency (v0)", () => {
  const cases: Array<[string, string]> = [
    ["Daily", "daily"],
    ["Nightly", "daily"],
    ["Daily/weekly", "daily"], // tighter cadence wins
    ["Weekly", "weekly"],
    ["2-3x weekly", "weekly"],
    ["Weekly/as needed", "weekly"],
    ["Every 2 weeks", "biweekly"],
    ["Biweekly", "biweekly"],
    ["Monthly", "monthly"],
    ["Ongoing/monthly", "monthly"],
    ["Annual", "annual"],
    ["As needed/annual", "annual"],
    ["Daily school days", "school_day"], // school beats daily
    ["Most school days", "school_day"],
    ["As needed", "manual"],
    ["Ongoing", "manual"],
    ["Seasonal", "manual"],
    ["Recurring", "manual"],
    ["Year-round", "manual"],
  ];
  it.each(cases)("%s -> %s", (freq, kind) => {
    expect(parseFrequency(freq).kind).toBe(kind);
  });

  it("flags manual cadences as needing a human anchor", () => {
    expect(parseFrequency("As needed").needsAnchor).toBe(true);
    expect(parseFrequency("Weekly").needsAnchor).toBe(false);
  });
});

describe("nextDueDate (v0)", () => {
  it("advances daily by one day", () => {
    expect(iso(nextDueDate(parseFrequency("Daily"), FRIDAY))).toBe("2026-01-03");
  });
  it("advances weekly by seven days", () => {
    expect(iso(nextDueDate(parseFrequency("Weekly"), FRIDAY))).toBe("2026-01-09");
  });
  it("advances biweekly by fourteen days", () => {
    expect(iso(nextDueDate(parseFrequency("Every 2 weeks"), FRIDAY))).toBe("2026-01-16");
  });
  it("advances annual by one year", () => {
    expect(iso(nextDueDate(parseFrequency("Annual"), FRIDAY))).toBe("2027-01-02");
  });
  it("clamps monthly month-overflow (Jan 31 -> Feb 28)", () => {
    const jan31 = new Date(Date.UTC(2026, 0, 31));
    expect(iso(nextDueDate(parseFrequency("Monthly"), jan31))).toBe("2026-02-28");
  });
  it("skips the weekend for school-day cadence (Fri -> Mon)", () => {
    expect(iso(nextDueDate(parseFrequency("Daily school days"), FRIDAY))).toBe("2026-01-05");
  });
  it("returns null for manual cadences (never invents a date)", () => {
    expect(nextDueDate(parseFrequency("As needed"), FRIDAY)).toBeNull();
  });
});

// "No silent cap": document exactly how much of the T1 set v0 can schedule.
describe("T1 coverage over the real seed", () => {
  const seed = JSON.parse(
    readFileSync(path.join(process.cwd(), "seed", "responsibilities.json"), "utf8"),
  ) as { responsibilities: Array<{ monitoring_tier: string; frequency: string }> };
  const t1 = seed.responsibilities.filter((r) => r.monitoring_tier === "T1_calendar");

  it("parses every T1 frequency without throwing", () => {
    for (const r of t1) expect(parseFrequency(r.frequency).kind).toBeDefined();
  });

  it("schedules 26 of 49 T1 rows; 23 need a human anchor (v0 snapshot)", () => {
    const manual = t1.filter((r) => parseFrequency(r.frequency).kind === "manual");
    expect(t1).toHaveLength(49);
    expect(t1.length - manual.length).toBe(26);
    expect(manual.length).toBe(23);
  });
});
