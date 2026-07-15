/**
 * The one place America/New_York wall-clock logic lives (CLAUDE.md: "School-day
 * logic lives in one module, not scattered. Store UTC, convert at the edge.").
 *
 * All functions take a UTC `Date` instant and answer questions about the ET wall
 * clock at that instant. Pure — `Intl.DateTimeFormat` with a fixed IANA zone does
 * the DST math, so there is no dependency and no ambient-timezone assumption.
 * Quiet hours, the 06:00 briefing, the Sunday planner, and school-day cadence all
 * sit on this module.
 */

const ET = "America/New_York";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: ET,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  weekday: "short",
});

export interface EtWallClock {
  year: number;
  month: number; // 1–12
  day: number; // 1–31
  hour: number; // 0–23
  minute: number; // 0–59
  weekday: number; // 0 = Sunday … 6 = Saturday
}

/** The ET wall-clock fields at a given UTC instant. */
export function etWallClock(instant: Date): EtWallClock {
  const parts = partsFormatter.formatToParts(instant);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
  };
}

/** "YYYY-MM-DD" for the ET calendar date at `instant` — the key for holidays,
 *  daily idempotency, and re-audit day bucketing. */
export function etDateKey(instant: Date): string {
  const { year, month, day } = etWallClock(instant);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

// Quiet hours: 20:30 ET (inclusive) through 08:00 ET (exclusive), wrapping midnight.
const QUIET_START_MIN = 20 * 60 + 30; // 20:30
const QUIET_END_MIN = 8 * 60; // 08:00

/**
 * True during announce quiet hours (20:30–08:00 ET, server-side per fleet.md).
 * 20:30 is quiet; 08:00 is not. The window wraps midnight, so it is a union.
 */
export function isQuietHours(instant: Date): boolean {
  const { hour, minute } = etWallClock(instant);
  const mins = hour * 60 + minute;
  return mins >= QUIET_START_MIN || mins < QUIET_END_MIN;
}

/**
 * Dates with no school, as ET "YYYY-MM-DD" keys. District-specific and empty by
 * default — the authoritative calendar is loaded here (or injected) rather than
 * guessed. `isSchoolDay` is Mon–Fri minus this set.
 */
export const NO_SCHOOL_DATES: ReadonlySet<string> = new Set<string>();

/** True on a school day: Monday–Friday in ET and not a no-school date. */
export function isSchoolDay(
  instant: Date,
  noSchool: ReadonlySet<string> = NO_SCHOOL_DATES,
): boolean {
  const { weekday } = etWallClock(instant);
  if (weekday === 0 || weekday === 6) return false;
  return !noSchool.has(etDateKey(instant));
}
