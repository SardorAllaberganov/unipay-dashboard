# Design System — Layer Hierarchy

Building the design system from scratch. Layers, top-down. Import direction is **strictly downward** — a higher layer may consume lower layers, never the reverse.

## Hierarchy

```
Tokens     → colors, typography, spacing, radius, motion, elevation
Primitives → button, input, chip, icon, avatar, badge
Components → card, list-row, sheet, modal, toast, banner, segmented-control
Patterns   → KYC step, FX-quote breakdown, transfer-status timeline,
             card-link 3DS, recipient-picker, AML flag review,
             admin queue row, audit-log entry
Screens    → mobile: onboarding, send-money, history, card-management,
                     notifications, settings, MyID flow
             admin:  KYC queue, AML queue, transfer monitor, FX config,
                     commission rules, services / health, audit log
Flows      → must match docs/mermaid_schemas/*_flow.md exactly
```

## Import / dependency rules

| Layer | May reference | May NOT reference |
|---|---|---|
| Tokens | nothing | anything |
| Primitives | Tokens | other Primitives, Components, Patterns, Screens |
| Components | Tokens, Primitives | other Components, Patterns, Screens |
| Patterns | Tokens, Primitives, Components | other Patterns, Screens |
| Screens | all layers above | other Screens |
| Flows | Screens | (flows compose existing screens, never new pixels) |

**Rule: only downward, never sideways.** If a Pattern needs another Pattern, extract the shared part into a Component or a smaller Pattern that both consume.

## Cross-cutting concerns

These live at the **Token layer** (read by every layer above):
- Accessibility tokens (focus ring, min-tap-target, contrast pairs) — see [`accessibility.md`](./accessibility.md).
- Motion tokens (duration, easing).
- Locale tokens (number / date formatters, copy-key resolver).

## Mobile vs admin

- **Shared:** Tokens, Primitives.
- **Diverge at:** Components in some cases (touch-first vs density-first); Patterns and above are surface-specific.
- A pattern named `send-money-fx-breakdown` lives in mobile; `admin-aml-flag-review` lives in admin. They never interleave.

## Folder layout (created on first asset)

```
design/
  tokens/
  primitives/
  components/
  patterns/
  screens-mobile/
  screens-admin/
  flows/
  research/
```

(Lessons live in [`ai_context/LESSONS.md`](../../ai_context/LESSONS.md), not under `design/`.)

Naming: `kebab-case.md` per file. **One concern per file.**

## When to add to which layer

| Need | Add to |
|---|---|
| New color / spacing value | Tokens |
| New form control style | Primitives |
| New composite element used on ≥ 2 screens | Components |
| New domain-specific UX (KYC step, FX breakdown) | Patterns |
| New screen | Screens |
| New end-to-end flow | Flows + sync to `docs/mermaid_schemas/` |

## Anti-patterns

| Don't | Why |
|---|---|
| Hard-code a hex / px in a Component | Defeats Tokens — themes can't override |
| Cross-import Patterns | Creates tangled dependencies |
| Build a Screen without Patterns | Loses reuse; Pattern layer exists for this |
| Diverge tokens between mobile and admin | Brand fragments — keep tokens shared |
