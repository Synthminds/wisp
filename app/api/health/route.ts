import { NextResponse } from "next/server";

// External/probe route — never statically cached.
export const dynamic = "force-dynamic";

/**
 * Liveness probe. Deliberately does NOT touch the database or any secret so it
 * can answer even when downstream deps are down. Reports the one invariant that
 * defines this system so a monitor can assert it never drifts.
 */
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "wisp",
    contract: {
      statement: "AI plans. AI monitors. Humans execute.",
      wisp_execution_share: 0,
    },
  });
}
