# Engineering Handoff

A design is **ready for dev** only when the handoff package is complete.

## Required artifacts

| Artifact | Description |
|---|---|
| Final screens | Every state: empty, loading, success, error, offline, partial. No "TODO" frames. |
| Flow diagram | Aligned with the corresponding [`docs/mermaid_schemas/*_flow.md`](../../docs/mermaid_schemas/). |
| Copy keys | All strings keyed for `uz` / `ru` / `en`. No literals. See [`localization.md`](./localization.md). |
| State-machine refs | For any status visualization, link the relevant `*_state_machine.md`. |
| Accessibility annotations | Focus order, screen-reader labels, min-tap-target, reduced-motion fallback. See [`accessibility.md`](./accessibility.md). |
| Acceptance criteria | Gherkin + checklist embedded in the ticket. See [`acceptance-criteria.md`](./acceptance-criteria.md). |
| Edge cases | Card-scheme variants, KYC-tier gating, network failure, rate-lock expiry, sanctioned-recipient. |
| Token usage | Component / pattern usage list with token references — no raw hex / px. |

## Surface-specific addenda

### Mobile

- Min iOS / Android version targeted.
- Telegram WebView gotchas if the app embeds in TG.
- Dynamic-type 200% screenshots.
- Biometric / OTP / 3DS WebView handling diagram.

### Admin dashboard

- Keyboard-shortcut map.
- Role-permission matrix per action.
- Audit-log expectations: which actions write events.
- Bulk-action behavior + undo grace.

## Pre-handoff design QA

Before sending the package:
- [ ] Run [`design-review-checklist.md`](./design-review-checklist.md) end-to-end.
- [ ] All cross-references resolve (`docs/`, other `.claude/rules/` files).
- [ ] No domain facts hardcoded — all reference the schema or `error_codes`.
- [ ] AC signed by engineering and compliance (where applicable).

## Post-handoff

- Stay engaged for design QA when the build lands.
- Open follow-up tickets for any drift between design and built UI.
- Update [`ai_context/LESSONS.md`](../../ai_context/LESSONS.md) with anything that surfaced during build.

## Doc cascade trigger

If the handoff package adds or modifies a flow, status visualization, or copy key:
1. Update the corresponding [`docs/`](../../docs/) artifact in the same PR.
2. If a state machine changed, list every screen that needs review.
3. The handoff is **incomplete** until docs and design agree.

## Cross-references
- Review checklist: [`design-review-checklist.md`](./design-review-checklist.md)
- Acceptance criteria: [`acceptance-criteria.md`](./acceptance-criteria.md)
- Accessibility annotations: [`accessibility.md`](./accessibility.md)
- Localization keys: [`localization.md`](./localization.md)
