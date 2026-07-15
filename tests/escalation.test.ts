import { describe, expect, it } from "vitest";
import { EscalationPolicy } from "../src/lib/schemas/escalation";

const valid = {
  ladder: [
    { channel: "push", after_minutes: 0 },
    { channel: "sms", after_minutes: 30 },
    { channel: "call", after_minutes: 60 },
  ],
  cancel_on_confirm: true as const,
};

describe("EscalationPolicy", () => {
  it("accepts a well-formed critical/pact ladder", () => {
    expect(EscalationPolicy.safeParse(valid).success).toBe(true);
  });

  it("requires cancel_on_confirm to be the literal true", () => {
    expect(
      EscalationPolicy.safeParse({ ...valid, cancel_on_confirm: false }).success,
    ).toBe(false);
    // even omitting it fails — a policy must always be cancellable by one tap
    const { cancel_on_confirm: _omit, ...withoutFlag } = valid;
    void _omit;
    expect(EscalationPolicy.safeParse(withoutFlag).success).toBe(false);
  });

  it("rejects an empty ladder", () => {
    expect(
      EscalationPolicy.safeParse({ ladder: [], cancel_on_confirm: true }).success,
    ).toBe(false);
  });

  it("rejects negative or non-integer delays", () => {
    expect(
      EscalationPolicy.safeParse({
        ladder: [{ channel: "push", after_minutes: -5 }],
        cancel_on_confirm: true,
      }).success,
    ).toBe(false);
    expect(
      EscalationPolicy.safeParse({
        ladder: [{ channel: "push", after_minutes: 1.5 }],
        cancel_on_confirm: true,
      }).success,
    ).toBe(false);
  });

  it("rejects an out-of-order ladder", () => {
    expect(
      EscalationPolicy.safeParse({
        ladder: [
          { channel: "sms", after_minutes: 60 },
          { channel: "push", after_minutes: 10 },
        ],
        cancel_on_confirm: true,
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown channel", () => {
    expect(
      EscalationPolicy.safeParse({
        ladder: [{ channel: "email", after_minutes: 0 }],
        cancel_on_confirm: true,
      }).success,
    ).toBe(false);
  });
});
