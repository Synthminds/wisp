/**
 * Drizzle schema — the source of truth for the Wisp data model (satisfies the
 * kickoff contract in src/lib/schemas/db-types.ts). See .claude/rules/db.md.
 *
 * THE CONTRACT is enforced physically here, not in prose:
 *  - `human_owner` has NO 'wisp' member, and execution.owner uses it, so an
 *    AI-owned execution row is literally unrepresentable.
 *  - planning/monitoring owner is pinned to 'wisp' by CHECK.
 *  - confirmation enforces XOR (signal | plan_item) by CHECK, plus partial
 *    unique indexes per arm so a double-tap is the same row, not a duplicate.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, crudPolicy } from "drizzle-orm/neon";

// --- enums ---------------------------------------------------------------

/** Execution owners are human, forever. There is deliberately no 'wisp'. */
export const humanOwner = pgEnum("human_owner", [
  "wes",
  "ria",
  "shared",
  "outsource",
  "tbd",
]);
/** Whoever taps Done / approves a plan — always a specific human. */
export const confirmer = pgEnum("confirmer", ["wes", "ria"]);
export const monitoringTier = pgEnum("monitoring_tier", [
  "T1_calendar",
  "T2_state",
  "T3_human_capture",
]);
export const criticality = pgEnum("criticality", ["routine", "critical"]);
export const responsibilityStatus = pgEnum("responsibility_status", [
  "active",
  "paused",
  "retired",
]);
export const signalKind = pgEnum("signal_kind", [
  "due",
  "overdue",
  "low_stock",
  "conflict",
  "gap",
  "anomaly",
]);
export const signalState = pgEnum("signal_state", [
  "open",
  "surfaced",
  "resolved",
  "expired",
]);
export const observationState = pgEnum("observation_state", [
  "new",
  "routed",
  "dead_letter",
]);
export const capturedBy = pgEnum("captured_by", ["wes", "ria", "unknown"]);
export const planStatus = pgEnum("plan_status", [
  "proposed",
  "approved",
  "amended",
  "rejected",
]);
export const briefingAudience = pgEnum("briefing_audience", [
  "wes",
  "ria",
  "family",
]);
export const deviceKind = pgEnum("device_kind", [
  "cozyla",
  "satellite_a9",
  "satellite_a9plus",
  "phone",
]);

// Shared-household RLS: any authenticated member reads/writes. Per-row authz
// (e.g. pact_owner self-opt-in) is enforced in handlers on top of this.
// A table with no policy is intentionally unreadable from the app role.
const householdPolicy = () =>
  crudPolicy({ role: authenticatedRole, read: true, modify: true });

// --- tables --------------------------------------------------------------

export const responsibility = pgTable(
  "responsibility",
  {
    id: text("id").primaryKey(),
    category: text("category").notNull(),
    name: text("name").notNull(),

    planningDescription: text("planning_description").notNull(),
    planningOwner: text("planning_owner").notNull().default("wisp"),
    planningOwnerLegacy: humanOwner("planning_owner_legacy").notNull(),
    planningDod: text("planning_dod").notNull(),

    monitoringDescription: text("monitoring_description").notNull(),
    monitoringOwner: text("monitoring_owner").notNull().default("wisp"),
    monitoringOwnerLegacy: humanOwner("monitoring_owner_legacy").notNull(),
    monitoringDod: text("monitoring_dod").notNull(),

    executionDescription: text("execution_description").notNull(),
    executionOwner: humanOwner("execution_owner").notNull(), // never 'wisp'
    executionDod: text("execution_dod").notNull(),

    frequency: text("frequency").notNull(),
    tier: monitoringTier("monitoring_tier").notNull(),
    status: responsibilityStatus("status").notNull().default("active"),
  },
  (t) => [
    check("planning_owner_is_wisp", sql`${t.planningOwner} = 'wisp'`),
    check("monitoring_owner_is_wisp", sql`${t.monitoringOwner} = 'wisp'`),
    householdPolicy(),
  ],
);

export const observation = pgTable(
  "observation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: text("source").notNull(),
    rawText: text("raw_text").notNull(), // untrusted; never logged at info
    extract: jsonb("extract"), // ObservationExtract after safeParse
    responsibilityId: text("responsibility_id").references(
      () => responsibility.id,
    ),
    capturedBy: capturedBy("captured_by").notNull().default("unknown"),
    capturedAt: timestamp("captured_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deviceRef: text("device_ref").notNull(), // provider id — idempotency key
    state: observationState("state").notNull().default("new"),
  },
  (t) => [
    uniqueIndex("observation_device_ref_key").on(t.deviceRef),
    householdPolicy(),
  ],
);

export const signal = pgTable(
  "signal",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    responsibilityId: text("responsibility_id")
      .notNull()
      .references(() => responsibility.id),
    tier: monitoringTier("tier").notNull(),
    kind: signalKind("kind").notNull(),
    criticality: criticality("criticality").notNull().default("routine"),
    // EscalationPolicy | null — only critical/pact rows carry one; validated by
    // Zod at the boundary where cancel_on_confirm must be the literal `true`.
    escalationPolicy: jsonb("escalation_policy"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    state: signalState("state").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("signal_responsibility_idx").on(t.responsibilityId), householdPolicy()],
);

export const plan = pgTable(
  "plan",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weekOf: date("week_of").notNull(), // Monday ISO date
    status: planStatus("status").notNull().default("proposed"),
    approvedBy: confirmer("approved_by"), // set only by a human approval event
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  () => [householdPolicy()],
);

export const planItem = pgTable(
  "plan_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plan.id, { onDelete: "cascade" }),
    responsibilityId: text("responsibility_id")
      .notNull()
      .references(() => responsibility.id),
    proposal: text("proposal").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }),
    pact: boolean("pact").notNull().default(false), // self-opt-in only
    pactOwner: confirmer("pact_owner"), // must equal the session user who set it
  },
  (t) => [
    // A pact must name its owner; nobody pacts on an empty owner.
    check("pact_requires_owner", sql`${t.pact} = false OR ${t.pactOwner} IS NOT NULL`),
    householdPolicy(),
  ],
);

export const confirmation = pgTable(
  "confirmation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    signalId: uuid("signal_id").references(() => signal.id),
    planItemId: uuid("plan_item_id").references(() => planItem.id),
    confirmedBy: confirmer("confirmed_by").notNull(), // session-derived; no service path
    photoUrl: text("photo_url"), // optional state report; never a gate
    confirmedAt: timestamp("confirmed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "confirmation_xor",
      sql`(${t.signalId} IS NULL) <> (${t.planItemId} IS NULL)`,
    ),
    uniqueIndex("confirmation_signal_uniq")
      .on(t.signalId)
      .where(sql`${t.signalId} IS NOT NULL`),
    uniqueIndex("confirmation_plan_item_uniq")
      .on(t.planItemId)
      .where(sql`${t.planItemId} IS NOT NULL`),
    householdPolicy(),
  ],
);

export const briefing = pgTable(
  "briefing",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    forDate: date("for_date").notNull(),
    audience: briefingAudience("audience").notNull(),
    bodyMd: text("body_md").notNull(),
    signalIds: jsonb("signal_ids").notNull().default(sql`'[]'::jsonb`),
    deliveredVia: text("delivered_via")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  () => [householdPolicy()],
);

export const device = pgTable(
  "device",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: deviceKind("kind").notNull(),
    room: text("room").notNull(),
    fkbEndpoint: text("fkb_endpoint"), // http://tailnet-ip:2323 — null for cozyla/phone
    fkbPasswordEnv: text("fkb_password_env"), // ENV VAR NAME, never a secret
    announceEnabled: boolean("announce_enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  () => [householdPolicy()],
);

/** Failed extractions land here instead of being silently dropped. */
export const captureDeadletter = pgTable(
  "capture_deadletter",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: text("source").notNull(),
    rawText: text("raw_text").notNull(),
    reason: text("reason").notNull(),
    deviceRef: text("device_ref"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  () => [householdPolicy()],
);
