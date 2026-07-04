import { z } from "zod";

/**
 * Confirmation — the ONLY execution event in Wisp (see CLAUDE.md, THE CONTRACT
 * + Soft accountability). One tap, one row.
 *
 * Invariants this schema encodes:
 *  - XOR: exactly one of signal_id / plan_item_id (also a DB CHECK).
 *  - confirmed_by is a human. It is DERIVED FROM THE SESSION in the handler;
 *    accepting it from a request payload is a bug. It exists here so agents,
 *    tests, and the DB layer share one shape.
 *  - photo_url is an optional state report — never required, never reviewed,
 *    never a gate. Nothing downstream may branch on its presence.
 */
export const ConfirmationInput = z
  .object({
    signal_id: z.string().uuid().nullable().default(null),
    plan_item_id: z.string().uuid().nullable().default(null),
    photo_url: z.string().url().nullable().default(null),
  })
  .refine(
    (v) => (v.signal_id === null) !== (v.plan_item_id === null),
    { message: "exactly one of signal_id or plan_item_id is required" },
  );

export const Confirmation = z.object({
  id: z.string().uuid(),
  signal_id: z.string().uuid().nullable(),
  plan_item_id: z.string().uuid().nullable(),
  /** session-derived; no service-account path exists */
  confirmed_by: z.enum(["wes", "ria"]),
  photo_url: z.string().url().nullable(),
  confirmed_at: z.string().datetime(),
}).refine(
  (v) => (v.signal_id === null) !== (v.plan_item_id === null),
  { message: "exactly one of signal_id or plan_item_id is required" },
);

export type ConfirmationInput = z.infer<typeof ConfirmationInput>;
export type Confirmation = z.infer<typeof Confirmation>;

/**
 * Handler contract (enforced in app/api + server actions, tested in vitest):
 *  1. validate payload with ConfirmationInput.safeParse
 *  2. set confirmed_by from the authenticated session
 *  3. insert idempotently (partial unique index per XOR arm)
 *  4. cancel any open escalation for the target IN THE SAME TRANSACTION
 */
