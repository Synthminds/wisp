import { describe, expect, it } from "vitest";
import { evaluateEscalation } from "../src/lib/escalation/evaluate";
import { EscalationPolicy } from "../src/lib/schemas/escalation";

const policy = EscalationPolicy.parse({
  ladder: [
    { channel: "push", after_minutes: 0 },
    { channel: "sms", after_minutes: 30 },
    { channel: "call", after_minutes: 60 },
  ],
  cancel_on_confirm: true,
});

const due = new Date("2026-07-05T12:00:00Z");
const at = (min: number) => new Date(due.getTime() + min * 60_000);

describe("evaluateEscalation", () => {
  it("fires push immediately at due time when nothing sent yet", () => {
    const d = evaluateEscalation(policy, due, at(0), { confirmed: false, lastSentIndex: -1 });
    expect(d).toEqual({ dueIndex: 0, channel: "push" });
  });

  it("advances to sms after 30 minutes", () => {
    const d = evaluateEscalation(policy, due, at(35), { confirmed: false, lastSentIndex: 0 });
    expect(d).toEqual({ dueIndex: 1, channel: "sms" });
  });

  it("does not re-fire a step already sent", () => {
    const d = evaluateEscalation(policy, due, at(35), { confirmed: false, lastSentIndex: 1 });
    expect(d.channel).toBeNull();
    expect(d.dueIndex).toBe(1);
  });

  it("cancels the entire ladder once confirmed (cancel-on-confirm)", () => {
    const d = evaluateEscalation(policy, due, at(90), { confirmed: true, lastSentIndex: 1 });
    expect(d).toEqual({ dueIndex: -1, channel: null });
  });

  it("reaches call only after 60 minutes", () => {
    expect(
      evaluateEscalation(policy, due, at(59), { confirmed: false, lastSentIndex: 1 }).channel,
    ).toBeNull();
    expect(
      evaluateEscalation(policy, due, at(60), { confirmed: false, lastSentIndex: 1 }).channel,
    ).toBe("call");
  });
});
