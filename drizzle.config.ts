import { defineConfig } from "drizzle-kit";

// Migrations run under the owner (BYPASSRLS) connection only. App code never
// uses DATABASE_URL_OWNER. Never hand-edit generated files in drizzle/migrations.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_OWNER ?? "",
  },
  strict: true,
  verbose: true,
});
