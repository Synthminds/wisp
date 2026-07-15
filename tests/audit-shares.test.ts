import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  baselineShares,
  computeShares,
  measuredShares,
  meetsDay90Targets,
  type AuditEvent,
  type Owner,
  type ResponsibilityOwners,
} from "../src/lib/audit/shares";

const rows: ResponsibilityOwners[] = [
  { planningOwnerLegacy: "ria", monitoringOwnerLegacy: "ria", executionOwner: "wes" },
  { planningOwnerLegacy: "ria", monitoringOwnerLegacy: "ria", executionOwner: "ria" },
  { planningOwnerLegacy: "wes", monitoringOwnerLegacy: "shared", executionOwner: "shared" },
  { planningOwnerLegacy: "shared", monitoringOwnerLegacy: "wes", executionOwner: "wes" },
];

describe("baselineShares", () => {
  it("computes per-dimension shares from legacy/human owners", () => {
    const b = baselineShares(rows);
    expect(b.planning.ria).toBeCloseTo(0.5); // 2/4
    expect(b.monitoring.ria).toBeCloseTo(0.5); // 2/4
    expect(b.execution.wes).toBeCloseTo(0.5); // 2/4
    expect(b.execution.wisp).toBeUndefined(); // never — no wisp execution
  });
});

describe("measuredShares", () => {
  it("attributes window load by dimension and actor", () => {
    const events: AuditEvent[] = [
      { responsibilityId: "r1", dimension: "monitoring", actor: "wisp" },
      { responsibilityId: "r2", dimension: "monitoring", actor: "wisp" },
      { responsibilityId: "r3", dimension: "monitoring", actor: "ria" },
      { responsibilityId: "r1", dimension: "planning", actor: "wisp" },
      { responsibilityId: "r1", dimension: "execution", actor: "wes" },
    ];
    const m = measuredShares(events);
    expect(m.monitoring.wisp).toBeCloseTo(2 / 3);
    expect(m.monitoring.ria).toBeCloseTo(1 / 3);
    expect(m.planning.wisp).toBe(1);
    expect(m.execution.wes).toBe(1);
  });
});

describe("meetsDay90Targets", () => {
  it("passes when Ria's load is low and Wisp does no execution", () => {
    const events: AuditEvent[] = [
      // 9 wisp + 1 ria monitoring = Ria 10%
      ...Array.from({ length: 9 }, (_, i) => mk(`m${i}`, "monitoring", "wisp")),
      mk("mr", "monitoring", "ria"),
      // 8 wisp + 2 ria planning = Ria 20%
      ...Array.from({ length: 8 }, (_, i) => mk(`p${i}`, "planning", "wisp")),
      mk("pr1", "planning", "ria"),
      mk("pr2", "planning", "ria"),
      mk("e1", "execution", "wes"),
    ];
    expect(meetsDay90Targets(measuredShares(events)).allMet).toBe(true);
  });

  it("fails when Ria still carries the monitoring", () => {
    const events: AuditEvent[] = [
      mk("m1", "monitoring", "ria"),
      mk("m2", "monitoring", "wisp"),
    ];
    const t = meetsDay90Targets(measuredShares(events));
    expect(t.riaMonitoringUnder20).toBe(false);
    expect(t.allMet).toBe(false);
  });

  it("fails if Wisp ever appears on an execution event", () => {
    const t = meetsDay90Targets(measuredShares([mk("e1", "execution", "wisp")]));
    expect(t.wispExecutionZero).toBe(false);
  });
});

function mk(responsibilityId: string, dimension: AuditEvent["dimension"], actor: Owner): AuditEvent {
  return { responsibilityId, dimension, actor };
}

describe("against the real seed baseline", () => {
  it("reproduces the audit yardstick (Ria planning + monitoring 40/72)", () => {
    const seedPath = fileURLToPath(new URL("../seed/responsibilities.json", import.meta.url));
    const seed = JSON.parse(readFileSync(seedPath, "utf8")) as {
      responsibilities: Array<{
        planning: { owner_legacy: Owner };
        monitoring: { owner_legacy: Owner };
        execution: { owner: Owner };
      }>;
    };
    const mapped: ResponsibilityOwners[] = seed.responsibilities.map((r) => ({
      planningOwnerLegacy: r.planning.owner_legacy,
      monitoringOwnerLegacy: r.monitoring.owner_legacy,
      executionOwner: r.execution.owner,
    }));
    const { baseline } = computeShares(mapped, []);
    expect(baseline.planning.ria).toBeCloseTo(40 / 72); // 56%
    expect(baseline.monitoring.ria).toBeCloseTo(40 / 72); // 56%
    expect(baseline.execution.wisp).toBeUndefined(); // 0 by construction
  });
});
