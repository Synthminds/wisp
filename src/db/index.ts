/**
 * App database client — the `authenticated` role (RLS applies). Never import
 * DATABASE_URL_OWNER here; that connection is for migrations and seed only.
 *
 * Lazily initialized so `next build` can import route modules without a live
 * DATABASE_URL. The error surfaces on first query, not at module load.
 */
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

let cached: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set (authenticated role connection required).",
    );
  }
  cached = drizzle(neon(url), { schema });
  return cached;
}

export { schema };
