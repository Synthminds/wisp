/**
 * The pure decision layer of extraction (ai.md, capture-and-extraction.md):
 * parse → retry once → dead-letter, plus id-guess safety and intent→signal
 * routing. No LLM call, no DB write — those are injected by the agent. This is
 * the part that is deterministic and unit-testable with mocked model output.
 */
import { ObservationExtract } from "../schemas/observation";

/** Signal kinds an extracted observation may open (mirrors src/db/schema signal.kind). */
export type SignalKind = "due" | "low_stock";

export type ExtractionOutcome =
  /** Parsed and classified — ready to route + open a signal (if any). */
  | { status: "routed"; observation: ObservationExtract; signalKind: SignalKind | null }
  /** Parsed but intent is "unknown" — goes to human review, never actioned. */
  | { status: "review"; observation: ObservationExtract }
  /** First attempt failed to parse — retry once, appending this Zod error. */
  | { status: "retry"; zodError: string }
  /** Second attempt also failed — dead-letter and stop, never guess. */
  | { status: "dead_letter"; zodError: string };

/**
 * Route an intent to the signal it implies, or null. Only the two explicit
 * mappings from the spec fire here (restock → low_stock, deadline → due);
 * everything else opens no signal from extraction (the heartbeat/planner owns
 * those), rather than guessing.
 */
export function intentToSignalKind(
  intent: ObservationExtract["intent"],
): SignalKind | null {
  switch (intent) {
    case "restock":
      return "low_stock";
    case "deadline":
      return "due";
    default:
      return null;
  }
}

/**
 * Decide what to do with one model output given the attempt index (0 = first
 * call, 1 = the single retry). `raw` is the unparsed model output; validation
 * happens here with safeParse so the model retries on mismatch.
 */
export function evaluateExtractionAttempt(
  raw: unknown,
  attemptIndex: number,
): ExtractionOutcome {
  const parsed = ObservationExtract.safeParse(raw);
  if (!parsed.success) {
    const zodError = parsed.error.message;
    return attemptIndex === 0
      ? { status: "retry", zodError }
      : { status: "dead_letter", zodError };
  }
  const observation = parsed.data;
  if (observation.intent === "unknown") {
    return { status: "review", observation };
  }
  return {
    status: "routed",
    observation,
    signalKind: intentToSignalKind(observation.intent),
  };
}

/**
 * Map a model's responsibility guess to a real seed id, or null. A guess outside
 * the known set is discarded (never invent an id) — the observation still routes,
 * just without a responsibility link.
 */
export function mapResponsibilityGuess(
  guess: string | null,
  seedIds: ReadonlySet<string>,
): string | null {
  if (guess === null) return null;
  return seedIds.has(guess) ? guess : null;
}
