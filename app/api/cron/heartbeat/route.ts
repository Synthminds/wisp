import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/src/lib/http/verify";
import { ErrorCodes } from "@/src/lib/errors";

// Cron entrypoint — never statically cached.
export const dynamic = "force-dynamic";

/**
 * The 15-minute heartbeat. DETERMINISTIC by contract: date math + escalation
 * ladder steps only. If you ever reach for the AI SDK here, stop — that logic
 * belongs in src/agents/ (.claude/rules/api.md, ai.md).
 *
 * First line verifies the cron secret; everything else is gated behind it.
 *
 * DB wiring is deferred until a Neon project exists (see progress.md). The
 * deterministic cores this route orchestrates are implemented and unit-tested:
 *   - src/lib/t1/derive.ts        → deriveT1DueSignals(active T1 rows, now)
 *   - src/lib/escalation/evaluate.ts → evaluateEscalation(policy, dueAt, now, state)
 * Once getDb() is live: read active T1 responsibilities + open signals, derive
 * due/overdue signals, step ladders for critical/pact signals, persist — all
 * inside this handler, still LLM-free.
 */
export async function POST(req: Request): Promise<NextResponse> {
  if (!verifyCronAuth(req)) {
    return NextResponse.json(
      { code: ErrorCodes.UNAUTHORIZED, message: "Unauthorized." },
      { status: 401 },
    );
  }

  const ranAt = new Date().toISOString();
  return NextResponse.json({ status: "ok", ranAt, llm: false });
}
