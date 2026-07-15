/**
 * T1 calendar cadence engine (v0) — the deterministic core of monitoring tier
 * T1. It maps a responsibility's freeform `frequency` string to a structured
 * cadence and derives the next due date. This is pure date math: no DB, no LLM,
 * and it is safe to call from the 15-minute heartbeat.
 *
 * Scheduling policy (CLAUDE.md): all scheduling logic is America/New_York;
 * callers pass ET-anchored dates and this module does calendar arithmetic on
 * them. Store UTC, convert at the edge — so the arithmetic here uses the UTC
 * accessors to stay DST-agnostic (a "day" is a calendar day, not 23/24/25h).
 *
 * v0 scope: it resolves the unambiguous cadences (daily/nightly, weekly,
 * biweekly, monthly, annual, school-day). Genuinely open-ended frequencies
 * ("as needed", "ongoing", "seasonal", "recurring") map to `manual`: there is
 * no honest deterministic due date, so they need a human-set anchor. Callers
 * MUST treat `manual` as "surface for a human," never invent a date.
 */

export type CadenceKind =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "annual"
  | "school_day"
  | "manual";

export interface Cadence {
  kind: CadenceKind;
  /** fixed step in days for daily/weekly/biweekly; null for calendar/manual kinds */
  intervalDays: number | null;
  /** true when v0 cannot derive a due date without a human-set anchor */
  needsAnchor: boolean;
  /** the original frequency string, kept for traceability */
  source: string;
}

// Ordered most-specific-first. The first pattern that matches wins, so tighter
// cadences (school-day, nightly, daily) are checked before looser ones.
const RULES: Array<{ re: RegExp; kind: CadenceKind; intervalDays: number | null }> = [
  { re: /school day|school days|weekday|weekdays/, kind: "school_day", intervalDays: null },
  { re: /nightly/, kind: "daily", intervalDays: 1 },
  { re: /daily/, kind: "daily", intervalDays: 1 },
  { re: /biweekly|every 2 weeks|every two weeks/, kind: "biweekly", intervalDays: 14 },
  { re: /weekly/, kind: "weekly", intervalDays: 7 },
  { re: /monthly/, kind: "monthly", intervalDays: null },
  { re: /annual|yearly/, kind: "annual", intervalDays: null },
  // "year-round"/"ongoing"/"seasonal"/"recurring"/"as needed" are continuous or
  // open-ended — they fall through to `manual` (need a human-set anchor).
];

/** Parse a freeform frequency string into a structured cadence. Never throws. */
export function parseFrequency(frequency: string): Cadence {
  const f = frequency.trim().toLowerCase();
  for (const rule of RULES) {
    if (rule.re.test(f)) {
      return {
        kind: rule.kind,
        intervalDays: rule.intervalDays,
        needsAnchor: false,
        source: frequency,
      };
    }
  }
  // "as needed", "ongoing", "recurring", "seasonal", "tbd", …
  return { kind: "manual", intervalDays: null, needsAnchor: true, source: frequency };
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d.getTime());
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d.getTime());
  const targetMonth = r.getUTCMonth() + n;
  r.setUTCMonth(targetMonth);
  // Guard month overflow (e.g. Jan 31 + 1mo): clamp back into the target month.
  if (r.getUTCMonth() !== ((targetMonth % 12) + 12) % 12) {
    r.setUTCDate(0); // last day of the previous (i.e. intended) month
  }
  return r;
}

function addYears(d: Date, n: number): Date {
  const r = new Date(d.getTime());
  r.setUTCFullYear(r.getUTCFullYear() + n);
  return r;
}

/** True for Mon–Fri (UTC day-of-week). */
function isWeekday(d: Date): boolean {
  const day = d.getUTCDay();
  return day >= 1 && day <= 5;
}

/**
 * The next due date strictly after `from` for the given cadence, or null when
 * v0 cannot derive one deterministically (manual cadences). `from` is the last
 * occurrence (or "now" for a first derivation).
 */
export function nextDueDate(cadence: Cadence, from: Date): Date | null {
  switch (cadence.kind) {
    case "daily":
    case "weekly":
    case "biweekly":
      return addDays(from, cadence.intervalDays!);
    case "monthly":
      return addMonths(from, 1);
    case "annual":
      return addYears(from, 1);
    case "school_day": {
      let d = addDays(from, 1);
      while (!isWeekday(d)) d = addDays(d, 1);
      return d;
    }
    case "manual":
    default:
      return null;
  }
}

/** Convenience: parse + derive in one call. */
export function nextDueFromFrequency(frequency: string, from: Date): Date | null {
  return nextDueDate(parseFrequency(frequency), from);
}
