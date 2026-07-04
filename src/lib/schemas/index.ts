/**
 * Barrel for the Zod/TS contracts. Import from "@/src/lib/schemas".
 *
 * Note: `Confirmation` is defined in two places — the Zod schema + inferred
 * type in confirmation.ts (the runtime contract) and the plain interface in
 * db-types.ts. They are structurally identical; the Zod one is canonical, so
 * db-types' version is re-exported under an alias to avoid an ambiguous name.
 */
export * from "./observation";
export * from "./adapter";
export * from "./confirmation";

export type {
  HumanOwner,
  MonitoringTier,
  Criticality,
  Responsibility,
  Observation,
  EscalationPolicy,
  Signal,
  PlanItem,
  Plan,
  Briefing,
  Device,
  Confirmation as ConfirmationRow,
} from "./db-types";
