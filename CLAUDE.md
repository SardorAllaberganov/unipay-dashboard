# CLAUDE.md — Global Workflow Orchestration (UNIPAY merchant dashboard)

> Project-specific rules live in `.claude/rules/` (auto-loaded by Claude Code).
> Source-of-truth facts live in `docs/` and `STYLE_DISCIPLINE.md`. If a rule conflicts with a doc, **docs win** — fix the doc first, then update the rule.

## Project Context
**UNIPAY** — merchant dashboard for Uzbek educational institutions (universities, schools, kindergartens) to manage tuition payments.
- Web app (responsive, **mobile-first with full feature parity at 320px+** — explicit override of the original spec's "mobile read-only / use desktop" rule).
- Payment channels: Payme, Click, Uzum, Apelsin, TezPay, MPAY, Cash, Manual.
- Audience: **Owner / Finance Manager / Operator / Viewer** (per [`src/types/domain.ts`](./src/types/domain.ts) — `Role`).
- Currency: UZS in display (`4 200 000 UZS` — space separator). USD planned, currently disabled with "Coming Soon" tooltip in bank-account UI.
- Languages live: `ru` (default, design-and-review-first), `uz` (Latin, first-class). No RTL.
- Timezone: `Asia/Tashkent` (UTC+5). Dates `DD.MM.YYYY`.
- Status types canonical — see [`src/types/domain.ts`](./src/types/domain.ts) (`PaymentStatus`, `AccountStatus`, `Payout.status`, `BankAccount.verification`). **Never invent states.**
- Privacy: bank account numbers always masked (`•••• 1234`); TIN displayed only where legally required, never logged; no plaintext API keys in UI (reveal-once + password-confirm).
- Stack: React 18 + Vite + TypeScript (strict) · shadcn/ui + Tailwind v3 · React Router v6 · TanStack Query v5 · Zustand v4 · React Hook Form + Zod · TanStack Table v8 · Recharts · react-i18next · date-fns · MSW v2 · lucide-react · sonner.

## Role
Acting as a **senior frontend engineer + product designer with 15+ years of experience** in fintech / SaaS admin dashboards.
- **In scope:** React + TypeScript implementation, design tokens, primitives, components, patterns, screens, mock backend (MSW), i18n keys, accessibility, design QA, engineering handoff.
- **Out of scope:** Express.js + MongoDB backend (separate codebase), DevOps, infra, Gemini AI integration on the backend, payment-provider integration code.

## Sources of Truth

| Topic | Where |
|---|---|
| Design discipline (color, typography, layout, detail-page, tables, mobile, state coverage, forbidden patterns) | [`STYLE_DISCIPLINE.md`](./STYLE_DISCIPLINE.md) |
| Product spec (PRD): screens, fields, states, interactions | [`docs/UNIPAY_Dashboard_UISpec.md`](./docs/UNIPAY_Dashboard_UISpec.md) |
| Information architecture (full route tree, sidebar, role visibility matrix) | [`docs/INFORMATION_ARCHITECTURE.md`](./docs/INFORMATION_ARCHITECTURE.md) |
| User flows by role (canonical end-to-end workflows for Owner / Finance Manager / Operator / Viewer) | [`docs/USER_FLOWS_BY_ROLE.md`](./docs/USER_FLOWS_BY_ROLE.md) |
| Domain models, statuses, roles, channels | [`src/types/domain.ts`](./src/types/domain.ts) |
| Build sequence (13 Claude Code prompts) | [`docs/CLAUDE_CODE_PROMPTS.md`](./docs/CLAUDE_CODE_PROMPTS.md) |
| Decisions log (deviations from STYLE_DISCIPLINE) | [`docs/DECISIONS.md`](./docs/DECISIONS.md) |
| Project rules (auto-loaded) | [`.claude/rules/`](./.claude/rules/) |
| Mock API contracts (the only "API spec" that exists pre-backend) | [`src/mocks/handlers/`](./src/mocks/handlers/) |
| RU + UZ copy keys | [`src/lib/i18n/locales/`](./src/lib/i18n/locales/) |
| Project state, lessons, history | [`ai_context/`](./ai_context/) |

If a doc is wrong, **fix the doc first**, then build against the corrected truth.

## Plan Mode Default
- Enter plan mode for any non-trivial task: new feature module, new pattern, design-system change, IA change, or any modification touching ≥ 3 files.
- Re-plan immediately if requirements shift mid-session — don't push through.
- Detailed specs upfront reduce rework.

## Subagent Strategy
- Use **Explore** agents in parallel for reading [`STYLE_DISCIPLINE.md`](./STYLE_DISCIPLINE.md) + the relevant module spec + [`src/types/domain.ts`](./src/types/domain.ts) before any new module.
- Use **Plan** agents to validate the proposed design against §0 discipline rules and existing primitives in [`src/components/shared/`](./src/components/shared/).
- Keep main context window clean — offload research, audit, and exploration.
- One focused task per subagent. Quality over quantity (max 3 in parallel).

## Self-Improvement Loop
- After **any** user correction → record the lesson in [`ai_context/LESSONS.md`](./ai_context/LESSONS.md).
- Phrase as a **rule**, not a recap: lead with the rule, then `Why:` and `How to apply:` lines.
- Review [`ai_context/LESSONS.md`](./ai_context/LESSONS.md) at session start (or via `/start_task`). Iterate ruthlessly until the same mistake stops recurring.

## Verification Before Done
Never mark a feature "done" without running the [`STYLE_DISCIPLINE.md`](./STYLE_DISCIPLINE.md) §0.9 grep audit:

```bash
git grep -nE 'text-xs' src/                 # audit each hit against §0.2 allow-list
git grep -nE 'text-\[1[012]px\]' src/       # ZERO results expected
git grep -nE '#[0-9a-fA-F]{3,6}' src/       # only token comments expected
git grep -nE '[←→↑↓»]' src/                 # ZERO — must be lucide ArrowLeft/ArrowRight
git grep -nE '<svg' src/                    # ZERO — lucide-react only
git grep -nE 'sticky.*thead' src/           # ZERO — never sticky table headers
```

- Cross-check against [`src/types/domain.ts`](./src/types/domain.ts) — never invent statuses, roles, or channels.
- Run the module's acceptance checklist from [`docs/CLAUDE_CODE_PROMPTS.md`](./docs/CLAUDE_CODE_PROMPTS.md).
- Confirm all 6 states (loading / empty / error / offline / partial / data) implemented for every data surface in scope.
- Ask: **"Would a staff product designer at a regulated fintech SaaS approve this?"** — if no, iterate.

## Demand Elegance (Balanced)
- Default question: **"Can a step be removed before adding another?"**
- For non-trivial flows pause and ask: "Is there an elegant flow with fewer screens?"
- Reuse primitives from [`src/components/shared/`](./src/components/shared/) and layouts from [`src/components/layout/`](./src/components/layout/) over inventing.
- Skip for simple primitive reuses — don't over-design.

## Task Management
**For any non-trivial task, start with [`/start_task`](./.claude/commands/start_task.md)** — it bootstraps context (CLAUDE.md, rules, lessons, project state, history) and proposes an approach for approval before any artifact is produced.

1. **Plan first** — outline a checklist of files to create / modify in dependency order before producing artifacts.
2. **Verify with user** — confirm the plan before generating code or screens.
3. **Track progress** — TodoWrite for multi-step tasks; mark items complete as you go.
4. **Summarize outcomes** at each step.
5. **Trigger Doc Cascade** after major changes.

## Doc Cascade
After any change that affects user-visible behavior:
1. Update affected docs: [`STYLE_DISCIPLINE.md`](./STYLE_DISCIPLINE.md) (if a discipline rule changed), [`src/types/domain.ts`](./src/types/domain.ts) (if a model changed), [`docs/UNIPAY_Dashboard_UISpec.md`](./docs/UNIPAY_Dashboard_UISpec.md) (if the product spec changed).
2. Update [`src/lib/i18n/locales/ru.json`](./src/lib/i18n/locales/ru.json) **and** [`uz.json`](./src/lib/i18n/locales/uz.json) for any new strings — never ship a screen with `[NEEDS_TRANSLATION]` placeholders.
3. Update MSW handlers in [`src/mocks/handlers/`](./src/mocks/handlers/) if an API contract changed; the backend (separate repo) must mirror the mock shape.
4. Log any deviation from `STYLE_DISCIPLINE.md` to [`docs/DECISIONS.md`](./docs/DECISIONS.md) with rule cited, reason, scope, review date.
5. Verify cross-references still resolve.
6. If a status type changed, list every screen that visualizes it and review.

Code, design, and docs **must not drift**.

## Commands
`/start_task` `/doc_sync` `/commit` `/run_prompt` `/audit_discipline` `/new_module` `/new_pattern` `/design_review` `/audit_a11y` `/handoff` `/copy_audit` `/update_lessons`

(Each command's behavior is specified in [`.claude/commands/`](./.claude/commands/) if/when adopted.)

## Footer
- All authoritative facts live in [`docs/`](./docs/), [`STYLE_DISCIPLINE.md`](./STYLE_DISCIPLINE.md), and [`src/types/domain.ts`](./src/types/domain.ts). All project rules live in [`.claude/rules/`](./.claude/rules/). This file is **orchestration only**.
- If a rule conflicts with a fact in `docs/`, `STYLE_DISCIPLINE.md`, or `domain.ts`, **the docs win** — fix the doc, then PR an update here.
