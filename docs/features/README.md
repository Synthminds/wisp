# Feature plans

Design docs for the features Phase 1's foundation makes buildable. Each doc is
scoped to one feature: the goal, the data it touches, the flow, the contract
guards it must not violate, and how to verify it. They elaborate `docs/plan.md`
without replacing it — the phase gates there are still the law.

| Feature | Phase | Doc |
| --- | --- | --- |
| Capture + extraction pipeline | 2 | [capture-and-extraction.md](./capture-and-extraction.md) |
| Confirmation + escalation | 2 | [confirmation-and-escalation.md](./confirmation-and-escalation.md) |
| Weekly planner + pacts | 2 | [weekly-planner-and-pacts.md](./weekly-planner-and-pacts.md) |
| Display fleet + kiosk | 2.5 | [fleet-and-kiosk.md](./fleet-and-kiosk.md) |
| Intercom + announce | 3 | [intercom-and-announce.md](./intercom-and-announce.md) |
| Day-90 re-audit | measurement | [day90-reaudit.md](./day90-reaudit.md) |

Every feature inherits THE CONTRACT (`CLAUDE.md`): AI plans, AI monitors,
humans execute. If a feature's design would let Wisp complete or self-confirm a
task, the design is wrong — flag it, don't build it.
