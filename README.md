# Wisp

Household monitoring AI for one family. **AI plans. AI monitors. Humans execute.**

## What this repo is right now

The v2 Claude Code kickoff scaffold: verified seed data, Zod/TS contracts
(including the accountability model), a wall-display dashboard spec (full +
compact + intercom), the full 18-section project brief, the phase-gated plan,
and the operating rules. No application code yet — Phase 1 builds it.

## Start a Claude Code session

1. Extract this directory, `git init`, open it in Claude Code.
2. Claude reads `CLAUDE.md` automatically and will read `TODO.md` and
   `progress.md` per its session-start rule.
3. Install the plugin set: see `.claude/plugins/INSTALL.md`.
4. Say: **"Read docs/plan.md and start Phase 1."**

## Ground truth files

- `CLAUDE.md` — operating rules: the contract, soft accountability, DoD,
  budget ledgers, fleet gotchas
- `docs/WISP-PROJECT-BRIEF.md` — full architecture (§01–§18)
- `docs/WISP-Project-Briefing-v4.pdf` — the v4 executive briefing (EXSUM +
  audit numbers + fleet/intercom/announce architecture)
- `docs/plan.md` — phase plan with hard gates (incl. the Phase 2.5 fleet gate)
- `seed/responsibilities.json` — 72 verified responsibilities. Do not
  hand-edit; regenerate via `scripts/generate-seed.py` (assertions verify
  owner counts on every run)
- `src/lib/schemas/` — observation, adapter, confirmation, db-types contracts
- `src/components/Dashboard.jsx` — wall-display SPEC with mock data (v4:
  full grid ≥1000px, compact <1000px, intercom PTT sheet). Not production code.

## The two budgets

Enduring: $50/month ceiling (projected ~$25–40). One-time capex: $500–750
approved for the display fleet, gated by Phase 2.5. Never mix the ledgers.
