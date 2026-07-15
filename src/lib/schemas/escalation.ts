import { z } from "zod";

/**
 * EscalationPolicy — carried ONLY by criticality='critical' signals and pact
 * items. See CLAUDE.md (Soft accountability) and .claude/rules/db.md.
 *
 * The load-bearing invariant: `cancel_on_confirm` is the LITERAL `true`. A
 * policy that could survive a confirmation is invalid by schema — escalation
 * must always be cancellable by one tap. The ladder is walked by the
 * deterministic 15-minute heartbeat; there are no LLM calls in that path.
 */
export const EscalationChannel = z.enum(["push", "sms", "call"]);

export const EscalationStep = z.object({
  channel: EscalationChannel,
  /** minutes after the signal became due before this step fires */
  after_minutes: z.number().int().nonnegative(),
});

export const EscalationPolicy = z
  .object({
    ladder: z.array(EscalationStep).min(1),
    cancel_on_confirm: z.literal(true),
  })
  .refine(
    (p) =>
      p.ladder.every(
        (step, i) => i === 0 || step.after_minutes >= p.ladder[i - 1]!.after_minutes,
      ),
    { message: "ladder steps must be ordered by non-decreasing after_minutes" },
  );

export type EscalationChannel = z.infer<typeof EscalationChannel>;
export type EscalationStep = z.infer<typeof EscalationStep>;
export type EscalationPolicy = z.infer<typeof EscalationPolicy>;
