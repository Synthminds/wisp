/**
 * Entity types matching WISP-PROJECT-BRIEF.md §04 (v2). The Drizzle schema in
 * src/db/schema.ts is the source of truth once it exists; these types are the
 * kickoff contract it must satisfy.
 */
export type HumanOwner = "wes" | "ria" | "shared" | "outsource" | "tbd";
export type MonitoringTier = "T1_calendar" | "T2_state" | "T3_human_capture";
export type Criticality = "routine" | "critical";

/** THE CONTRACT, in types: planning/monitoring belong to wisp, execution never does. */
export interface Responsibility {
  id: string;
  category: string;
  name: string;
  planning:   { description: string; owner: "wisp"; owner_legacy: HumanOwner; definition_of_done: string };
  monitoring: { description: string; owner: "wisp"; owner_legacy: HumanOwner; definition_of_done: string };
  execution:  { description: string; owner: HumanOwner; definition_of_done: string }; // never "wisp" — DB enum enforces
  frequency: string;
  monitoring_tier: MonitoringTier;
  status: "active" | "paused" | "retired";
}

export interface Observation {
  id: string;
  source: string;            // CaptureSource
  raw_text: string;          // untrusted; never rendered unescaped, never logged at info
  extract: unknown;          // ObservationExtract after safeParse
  responsibility_id: string | null;
  captured_by: "wes" | "ria" | "unknown";
  captured_at: string;
  device_ref: string;        // unique per source — idempotency key
  state: "new" | "routed" | "dead_letter";
}

/**
 * Escalation exists ONLY for criticality='critical' signals and pact items.
 * cancel_on_confirm is the literal true: a policy that survives confirmation
 * is invalid by schema. The ladder is deterministic heartbeat logic.
 */
export interface EscalationPolicy {
  ladder: Array<{ channel: "push" | "sms" | "call"; after_minutes: number }>;
  cancel_on_confirm: true;
}

export interface Signal {
  id: string;
  responsibility_id: string;
  tier: MonitoringTier;
  kind: "due" | "overdue" | "low_stock" | "conflict" | "gap" | "anomaly";
  criticality: Criticality;                 // default "routine"
  escalation_policy: EscalationPolicy | null; // only critical/pact rows carry one
  due_at: string | null;
  payload: Record<string, unknown>;
  state: "open" | "surfaced" | "resolved" | "expired";
  created_at: string;
}

/**
 * The ONLY execution event in the system. XOR: exactly one of signal_id /
 * plan_item_id (DB CHECK + partial unique indexes for idempotency).
 * confirmed_by comes from the session — there is no service path.
 * photo_url is an optional state report: never required, never reviewed,
 * never a gate.
 */
export interface Confirmation {
  id: string;
  signal_id: string | null;
  plan_item_id: string | null;
  confirmed_by: "wes" | "ria";
  photo_url: string | null;
  confirmed_at: string;
}

export interface PlanItem {
  id: string;
  plan_id: string;
  responsibility_id: string;
  proposal: string;
  due_at: string | null;
  pact: boolean;                    // self-opt-in only
  pact_owner: "wes" | "ria" | null; // must equal the session user who set it
}

export interface Plan {
  id: string;
  week_of: string;           // Monday ISO date
  items: PlanItem[];
  status: "proposed" | "approved" | "amended" | "rejected"; // only a human approval event moves it from proposed
  approved_by: "wes" | "ria" | null;
  created_at: string;
}

export interface Briefing {
  id: string;
  for_date: string;
  audience: "wes" | "ria" | "family";
  body_md: string;
  signal_ids: string[];
  delivered_via: string[];   // ["telegram","ntfy","dashboard","announce"]
  created_at: string;
}

/**
 * Fleet registry — the single source of truth for displays.
 * fkb_password_env stores the ENV VAR NAME (e.g. "FKB_KITCHEN_PW"),
 * never a secret. FKB REST is LAN/Tailscale-only.
 */
export interface Device {
  id: string;
  kind: "cozyla" | "satellite_a9" | "satellite_a9plus" | "phone";
  room: string;
  fkb_endpoint: string | null;     // http://tailnet-ip:2323 — null for cozyla/phone
  fkb_password_env: string | null; // env var NAME, never the value
  announce_enabled: boolean;
  created_at: string;
}
