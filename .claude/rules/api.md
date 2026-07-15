---
paths: ["app/api/**", "app/actions/**"]
---
# API and server action rules

- Route Handlers (`app/api/**/route.ts`) are for: webhooks (Twilio, Telegram),
  cron entrypoints, capture ingestion, and anything callable from outside.
- Server Actions (`'use server'`) are for internal UI mutations only (approve
  plan, confirm execution, adjust threshold). Remember: every exported server
  action is a public POST endpoint — validate input with Zod even for
  "internal" actions.
- Cron routes: first line of the handler verifies
  `request.headers.get('authorization') === \`Bearer ${process.env.CRON_SECRET}\``
  and returns 401 otherwise. `export const dynamic = 'force-dynamic'`.
- The heartbeat route is deterministic: queries + date math + notifications +
  escalation ladder steps. If you find yourself importing the AI SDK there,
  stop — that logic belongs in `src/agents/`.
- Execution confirmation endpoints require an authenticated human user id in
  the session. There is no service-account path to mark execution done.

## v2 — confirmation + pact + announce

- The confirm endpoint validates with the Confirmation Zod schema
  (`src/lib/schemas/confirmation.ts`), inserts idempotently, and cancels any
  open escalation for the confirmed signal/plan_item IN THE SAME TRANSACTION.
  Confirm-then-cancel as two requests is a bug.
- One-tap means one tap: the endpoint takes the XOR id + optional photo_url,
  nothing else. `confirmed_by` comes from the session, never the payload.
- Pact endpoints reject any request where `pact_owner !== session.user`.
  Setting a pact on someone else's behalf returns 403 with code
  `PACT_SELF_ONLY`.
- Announce endpoints accept only template ids (Wisp events) or the verified
  inbound-SMS path — there is no free-text announce API. Quiet-hours and the
  280-char cap are enforced here, server-side, before anything reaches the
  fleet client.
