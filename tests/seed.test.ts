import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

interface Row {
  id: string;
  planning: { owner: string; owner_legacy: string };
  monitoring: { owner: string; owner_legacy: string };
  execution: { owner: string };
  monitoring_tier: string;
}

const seed = JSON.parse(
  readFileSync(path.join(process.cwd(), "seed", "responsibilities.json"), "utf8"),
) as { _meta: unknown; responsibilities: Row[] };

const rows = seed.responsibilities;

describe("seed integrity", () => {
  it("has exactly 72 responsibilities", () => {
    expect(rows).toHaveLength(72);
  });

  it("matches the audited monitoring-tier split (49 / 8 / 15)", () => {
    const byTier = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.monitoring_tier] = (acc[r.monitoring_tier] ?? 0) + 1;
      return acc;
    }, {});
    expect(byTier).toEqual({
      T1_calendar: 49,
      T2_state: 8,
      T3_human_capture: 15,
    });
  });

  it("preserves the audited legacy monitoring owners (Ria 40 / Wes 10)", () => {
    const ria = rows.filter((r) => r.monitoring.owner_legacy === "ria").length;
    const wes = rows.filter((r) => r.monitoring.owner_legacy === "wes").length;
    expect(ria).toBe(40);
    expect(wes).toBe(10);
  });

  it("has unique ids", () => {
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
  });
});

describe("THE CONTRACT (seed)", () => {
  it("flips every planning + monitoring owner to 'wisp'", () => {
    for (const r of rows) {
      expect(r.planning.owner).toBe("wisp");
      expect(r.monitoring.owner).toBe("wisp");
    }
  });

  it("never assigns execution to 'wisp'", () => {
    const violations = rows.filter((r) => r.execution.owner === "wisp");
    expect(violations).toEqual([]);
  });

  it("only uses human execution owners", () => {
    const humans = new Set(["wes", "ria", "shared", "outsource", "tbd"]);
    for (const r of rows) {
      expect(humans.has(r.execution.owner)).toBe(true);
    }
  });
});
