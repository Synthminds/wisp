import { describe, expect, it } from "vitest";
import { humanOwner } from "../src/db/schema";
import { ConfirmationInput } from "../src/lib/schemas/confirmation";

describe("THE CONTRACT (schema)", () => {
  it("the human_owner enum has no 'wisp' member", () => {
    expect(humanOwner.enumValues).not.toContain("wisp");
    expect(humanOwner.enumValues).toEqual([
      "wes",
      "ria",
      "shared",
      "outsource",
      "tbd",
    ]);
  });
});

describe("Confirmation input — XOR of signal_id / plan_item_id", () => {
  const uuid = "00000000-0000-4000-8000-000000000000";

  it("accepts exactly a signal_id", () => {
    expect(ConfirmationInput.safeParse({ signal_id: uuid }).success).toBe(true);
  });

  it("accepts exactly a plan_item_id", () => {
    expect(ConfirmationInput.safeParse({ plan_item_id: uuid }).success).toBe(true);
  });

  it("rejects neither", () => {
    expect(ConfirmationInput.safeParse({}).success).toBe(false);
  });

  it("rejects both", () => {
    expect(
      ConfirmationInput.safeParse({ signal_id: uuid, plan_item_id: uuid }).success,
    ).toBe(false);
  });

  it("treats photo_url as optional (never a gate)", () => {
    expect(ConfirmationInput.safeParse({ signal_id: uuid }).success).toBe(true);
  });
});
