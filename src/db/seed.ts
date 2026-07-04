/**
 * `pnpm seed` — idempotent upsert of seed/responsibilities.json into the
 * responsibility table, keyed by id. Runs under the owner (BYPASSRLS)
 * connection. Re-running is safe: existing rows are updated, not duplicated.
 *
 * Guardrail: the JSON is canonical and regenerated only by
 * scripts/generate-seed.py. This loader re-asserts THE CONTRACT before writing
 * a single row — if any execution.owner is 'wisp', it refuses to seed.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { responsibility } from "./schema";

type HumanOwner = "wes" | "ria" | "shared" | "outsource" | "tbd";

interface SeedRow {
  id: string;
  category: string;
  name: string;
  planning: { description: string; owner: string; owner_legacy: HumanOwner; definition_of_done: string };
  monitoring: { description: string; owner: string; owner_legacy: HumanOwner; definition_of_done: string };
  execution: { description: string; owner: HumanOwner; definition_of_done: string };
  frequency: string;
  monitoring_tier: "T1_calendar" | "T2_state" | "T3_human_capture";
  status: "active" | "paused" | "retired";
}

interface SeedFile {
  _meta: Record<string, unknown>;
  responsibilities: SeedRow[];
}

function loadSeed(): SeedFile {
  const file = path.join(process.cwd(), "seed", "responsibilities.json");
  return JSON.parse(readFileSync(file, "utf8")) as SeedFile;
}

function assertContract(rows: SeedRow[]): void {
  if (rows.length !== 72) {
    throw new Error(`Expected 72 responsibilities, found ${rows.length}.`);
  }
  for (const r of rows) {
    if (r.planning.owner !== "wisp" || r.monitoring.owner !== "wisp") {
      throw new Error(`THE CONTRACT: ${r.id} planning/monitoring owner must be 'wisp'.`);
    }
    // @ts-expect-error — 'wisp' is intentionally not a HumanOwner; this catches drift.
    if (r.execution.owner === "wisp") {
      throw new Error(`THE CONTRACT: ${r.id} execution.owner may never be 'wisp'.`);
    }
  }
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL_OWNER;
  if (!url) {
    console.error("DATABASE_URL_OWNER is not set (owner connection required for seed).");
    process.exit(1);
  }

  const { responsibilities } = loadSeed();
  assertContract(responsibilities);

  const db = drizzle(neon(url));
  let count = 0;
  for (const r of responsibilities) {
    const values = {
      id: r.id,
      category: r.category,
      name: r.name,
      planningDescription: r.planning.description,
      planningOwnerLegacy: r.planning.owner_legacy,
      planningDod: r.planning.definition_of_done,
      monitoringDescription: r.monitoring.description,
      monitoringOwnerLegacy: r.monitoring.owner_legacy,
      monitoringDod: r.monitoring.definition_of_done,
      executionDescription: r.execution.description,
      executionOwner: r.execution.owner,
      executionDod: r.execution.definition_of_done,
      frequency: r.frequency,
      tier: r.monitoring_tier,
      status: r.status,
    } as const;

    await db
      .insert(responsibility)
      .values(values)
      .onConflictDoUpdate({ target: responsibility.id, set: values });
    count += 1;
  }

  console.log(`Seeded ${count} responsibilities (idempotent upsert by id).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
