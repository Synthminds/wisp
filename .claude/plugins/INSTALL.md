# Claude Code plugin set — Wisp

Standard 10-plugin loadout (house convention). Install from the marketplace
at session zero:

1. feature-dev          — structured feature workflow
2. code-review          — fresh-context review pass before commits
3. commit-commands      — conventional commit helpers
4. frontend-design      — dashboard / wall-display UI work
5. claude-md-management — keep CLAUDE.md pruned and current
6. security-guidance    — webhook/RLS/injection review support
7. code-simplifier      — post-feature simplification pass
8. plugin-dev           — only if building custom plugins later
9. typescript-lsp       — type-aware navigation
10. superpowers         — workflow utilities

After install, verify with `/plugins` and confirm hooks don't conflict with
`.claude/settings.json` deny rules.
