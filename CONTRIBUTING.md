# Contributing — UNIPAY Merchant Dashboard

**Read [`STYLE_DISCIPLINE.md`](./STYLE_DISCIPLINE.md) before opening any PR.**

It is the single source of truth for design constraints — color tokens, typography lock, layout primitives, icon discipline, detail-page convention, data-table rules, mobile patterns, mandatory state coverage, and the forbidden-patterns table.

**Violations of §0.9 block merge.** CI runs the audit greps:

```bash
npm run audit:discipline
```

Module-specific rules live in [`.claude/rules/`](./.claude/rules/) and load automatically into Claude Code sessions.

When a rule conflicts with a doc in `docs/` or `STYLE_DISCIPLINE.md`, **the docs win** — fix the doc first, then update the rule.
