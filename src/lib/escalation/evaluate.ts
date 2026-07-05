/**
 * Deterministic escalation evaluation — heartbeat territory, NO LLM
 * (.claude/rules/ai.md, api.md). Given a validated EscalationPolicy, when a
 * signal became due, the current time, and what's already been sent, decide
 * which ladder step (if any) fires now.
 *
 * cancel-on-confirm is absolute: once confirmed, nothing else ever fires. The
 * transactional cancel lives in the confirm handler; this function is the
 * read-side guard that makes a post-confirmation send impossible.
 */
import type {
  EscalationChannel,
  EscalationPolicy,
} from "@/src/lib/schemas/escalation";

export interface EscalationState {
  /** true once a human has confirmed the signal/plan_item */
  confirmed: boolean;
  /** highest ladder index already sent; -1 if nothing has fired yet */
  lastSentIndex: number;
}

export interface EscalationDecision {
  /** highest ladder index whose after_minutes threshold has elapsed; -1 if none */
  dueIndex: number;
  /** the channel to notify on now, or null if nothing new is due / cancelled */
  channel: EscalationChannel | null;
}

export function evaluateEscalation(
  policy: EscalationPolicy,
  dueAt: Date,
  now: Date,
  state: EscalationState,
): EscalationDecision {
  // Confirmation cancels the whole ladder — no further step can ever fire.
  if (state.confirmed) return { dueIndex: -1, channel: null };

  const elapsedMinutes = (now.getTime() - dueAt.getTime()) / 60_000;

  let dueIndex = -1;
  policy.ladder.forEach((step, i) => {
    if (elapsedMinutes >= step.after_minutes) dueIndex = i;
  });

  // Only fire when the reached step is beyond what we've already sent.
  if (dueIndex > state.lastSentIndex) {
    return { dueIndex, channel: policy.ladder[dueIndex]!.channel };
  }
  return { dueIndex, channel: null };
}
