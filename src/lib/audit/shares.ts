/**
 * Day-90 re-audit share computation (day90-reaudit.md) — the success-metric
 * calculator for the whole thesis. Pure: baseline shares come from the seed's
 * preserved legacy owners; measured shares come from window events (fixtures now,
 * a DB pull later). No DB or network here.
 *
 * Targets: Ria monitoring 56% → <20%, Ria planning 56% → <30%, Wisp execution
 * exactly 0% (0 by construction — the human_owner enum has no 'wisp').
 */

export type Owner = "wisp" | "wes" | "ria" | "shared" | "outsource" | "tbd";
export type Dimension = "planning" | "monitoring" | "execution";

/** The three ownership facts the re-audit reads from each responsibility. */
export interface ResponsibilityOwners {
  planningOwnerLegacy: Owner;
  monitoringOwnerLegacy: Owner;
  executionOwner: Owner;
}

/** One unit of load in the measurement window, attributed to whoever bore it. */
export interface AuditEvent {
  responsibilityId: string;
  dimension: Dimension;
  actor: Owner;
}

/** owner → share (0..1) for each dimension. Owners with no load are absent. */
export type ShareTable = Record<Dimension, Record<string, number>>;

const DIMENSIONS: Dimension[] = ["planning", "monitoring", "execution"];

function tallyToShares(counts: Record<string, number>, total: number): Record<string, number> {
  if (total === 0) return {};
  const shares: Record<string, number> = {};
  for (const [owner, n] of Object.entries(counts)) {
    shares[owner] = n / total;
  }
  return shares;
}

/** Baseline shares from the preserved legacy/human owners (the "before"). */
export function baselineShares(rows: readonly ResponsibilityOwners[]): ShareTable {
  const counts: Record<Dimension, Record<string, number>> = {
    planning: {},
    monitoring: {},
    execution: {},
  };
  const pick: Record<Dimension, (r: ResponsibilityOwners) => Owner> = {
    planning: (r) => r.planningOwnerLegacy,
    monitoring: (r) => r.monitoringOwnerLegacy,
    execution: (r) => r.executionOwner,
  };
  for (const row of rows) {
    for (const dim of DIMENSIONS) {
      const owner = pick[dim](row);
      counts[dim][owner] = (counts[dim][owner] ?? 0) + 1;
    }
  }
  return {
    planning: tallyToShares(counts.planning, rows.length),
    monitoring: tallyToShares(counts.monitoring, rows.length),
    execution: tallyToShares(counts.execution, rows.length),
  };
}

/** Measured shares from window events (the "after"). */
export function measuredShares(events: readonly AuditEvent[]): ShareTable {
  const counts: Record<Dimension, Record<string, number>> = {
    planning: {},
    monitoring: {},
    execution: {},
  };
  const totals: Record<Dimension, number> = { planning: 0, monitoring: 0, execution: 0 };
  for (const e of events) {
    counts[e.dimension][e.actor] = (counts[e.dimension][e.actor] ?? 0) + 1;
    totals[e.dimension] += 1;
  }
  return {
    planning: tallyToShares(counts.planning, totals.planning),
    monitoring: tallyToShares(counts.monitoring, totals.monitoring),
    execution: tallyToShares(counts.execution, totals.execution),
  };
}

export interface ShareComparison {
  baseline: ShareTable;
  measured: ShareTable;
}

export function computeShares(
  rows: readonly ResponsibilityOwners[],
  events: readonly AuditEvent[],
): ShareComparison {
  return { baseline: baselineShares(rows), measured: measuredShares(events) };
}

export interface Day90Targets {
  riaMonitoringUnder20: boolean;
  riaPlanningUnder30: boolean;
  wispExecutionZero: boolean;
  allMet: boolean;
}

/** Check the measured shares against the day-90 success criteria. */
export function meetsDay90Targets(measured: ShareTable): Day90Targets {
  const riaMonitoringUnder20 = (measured.monitoring.ria ?? 0) < 0.2;
  const riaPlanningUnder30 = (measured.planning.ria ?? 0) < 0.3;
  const wispExecutionZero = (measured.execution.wisp ?? 0) === 0;
  return {
    riaMonitoringUnder20,
    riaPlanningUnder30,
    wispExecutionZero,
    allMet: riaMonitoringUnder20 && riaPlanningUnder30 && wispExecutionZero,
  };
}
