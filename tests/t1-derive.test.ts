import { describe, expect, it } from "vitest";
import { deriveT1DueSignals } from "../src/lib/t1/derive";

const now = new Date("2026-07-15T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

describe("deriveT1DueSignals", () => {
  it("flags a weekly item whose next occurrence has arrived as due", () => {
    const { signals } = deriveT1DueSignals(
      [{ responsibilityId: "r1", frequency: "Weekly", lastDueAt: daysAgo(8) }],
      now,
    );
    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({ responsibilityId: "r1", kind: "due" });
  });

  it("marks a missed full cycle as overdue", () => {
    // daily, last occurred 3 days ago → next (2 days ago) and the one after
    // (1 day ago) have both passed → overdue.
    const { signals } = deriveT1DueSignals(
      [{ responsibilityId: "r2", frequency: "Daily", lastDueAt: daysAgo(3) }],
      now,
    );
    expect(signals[0]).toMatchObject({ responsibilityId: "r2", kind: "overdue" });
  });

  it("does not signal when the next occurrence is still in the future", () => {
    const { signals } = deriveT1DueSignals(
      [{ responsibilityId: "r3", frequency: "Weekly", lastDueAt: daysAgo(1) }],
      now,
    );
    expect(signals).toHaveLength(0);
  });

  it("routes open-ended cadences to manual, never scheduling them", () => {
    const { signals, manual } = deriveT1DueSignals(
      [{ responsibilityId: "r4", frequency: "As needed", lastDueAt: daysAgo(30) }],
      now,
    );
    expect(signals).toHaveLength(0);
    expect(manual).toEqual(["r4"]);
  });

  it("reports scheduled rows with no anchor as needsAnchor", () => {
    const { needsAnchor, signals } = deriveT1DueSignals(
      [{ responsibilityId: "r5", frequency: "Weekly", lastDueAt: null }],
      now,
    );
    expect(needsAnchor).toEqual(["r5"]);
    expect(signals).toHaveLength(0);
  });
});
