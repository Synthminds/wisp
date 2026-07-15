/**
 * T1 due-signal derivation — the deterministic monitoring core for tier
 * T1_calendar. Given the last occurrence of each responsibility and "now",
 * decide which are due or overdue. Pure date math over the cadence engine
 * (./cadence); safe for the 15-minute heartbeat.
 *
 * v0 honesty (no silent caps):
 *  - `manual` cadences ("as needed", "ongoing", …) have no deterministic due
 *    date — returned separately, never auto-scheduled.
 *  - rows with no `lastDueAt` anchor yet are returned in `needsAnchor` — the
 *    first anchor comes from the calendar/seed, not a guess.
 */
import { nextDueDate, parseFrequency } from "./cadence";

export interface T1Input {
  responsibilityId: string;
  frequency: string;
  /** the last occurrence/derivation, or null if not yet anchored */
  lastDueAt: Date | null;
}

export interface T1DueSignal {
  responsibilityId: string;
  dueAt: Date;
  kind: "due" | "overdue";
}

export interface T1Derivation {
  signals: T1DueSignal[];
  /** cadence is open-ended — surface for a human, don't schedule */
  manual: string[];
  /** scheduled cadence but no anchor date yet — needs a first due date */
  needsAnchor: string[];
}

export function deriveT1DueSignals(inputs: T1Input[], now: Date): T1Derivation {
  const signals: T1DueSignal[] = [];
  const manual: string[] = [];
  const needsAnchor: string[] = [];

  for (const input of inputs) {
    const cadence = parseFrequency(input.frequency);
    if (cadence.kind === "manual") {
      manual.push(input.responsibilityId);
      continue;
    }
    if (input.lastDueAt === null) {
      needsAnchor.push(input.responsibilityId);
      continue;
    }

    const next = nextDueDate(cadence, input.lastDueAt);
    if (next === null) {
      // Defensive: only manual cadences yield null, and those are handled above.
      manual.push(input.responsibilityId);
      continue;
    }

    if (next.getTime() <= now.getTime()) {
      // Overdue when a *further* occurrence has also already passed.
      const following = nextDueDate(cadence, next);
      const overdue = following !== null && following.getTime() <= now.getTime();
      signals.push({
        responsibilityId: input.responsibilityId,
        dueAt: next,
        kind: overdue ? "overdue" : "due",
      });
    }
  }

  return { signals, manual, needsAnchor };
}
