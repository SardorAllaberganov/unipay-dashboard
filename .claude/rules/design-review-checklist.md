# Design Review Checklist

A design is **not done** until every box below is checked. Run this before requesting handoff or merging into the design system.

## Universal coverage

- [ ] All states covered: **empty, loading, success, error, offline, partial-data**.
- [ ] All KYC tiers handled: `tier_0` / `tier_1` / `tier_2`. Gated features visibly indicated. Upgrade path obvious. See [`kyc-tiers-and-limits.md`](./kyc-tiers-and-limits.md).
- [ ] Every status shown matches a state in the relevant `*_state_machine.md`. See [`status-machines.md`](./status-machines.md).
- [ ] Cross-references point at real files in `docs/` and `.claude/rules/`.

## Money & FX

- [ ] All amounts displayed in localized format (never raw `bigint` minor units). See [`money-and-fx.md`](./money-and-fx.md).
- [ ] Send-money review shows: `client_rate`, `fee_uzs`, `fx_spread_uzs`, `total_charge_uzs`, `amount_cny`, locked-rate disclaimer.
- [ ] Rate-lock countdown rendered when applicable.
- [ ] International-card fee differential visible.

## Cards

- [ ] Masked PAN only (first6 + last4). Never full PAN. Never CVV. See [`card-schemes.md`](./card-schemes.md).
- [ ] Correct scheme logo for `uzcard` / `humo` / `visa` / `mastercard`.
- [ ] Visa/MC tier_2-gating handled — `tier_1` gets MyID upgrade CTA, not a silent block.

## Localization

- [ ] All copy keyed for `uz` / `ru` / `en`. No hardcoded strings. See [`localization.md`](./localization.md).
- [ ] Longest-translation pass: no clipping or wrap regression.
- [ ] Number / date / currency formatting locale-correct.
- [ ] Pluralized strings tested in `ru` (one / few / many).

## Errors

- [ ] Every failure path renders an error state.
- [ ] Title and body sourced from `error_codes` (never hardcoded). See [`error-ux.md`](./error-ux.md).
- [ ] Retry CTA hidden when `retryable=false`.
- [ ] Compliance categories use the calm-review pattern (no AML logic exposed).

## Accessibility

- [ ] Contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text and non-text UI. See [`accessibility.md`](./accessibility.md).
- [ ] Tap targets ≥ 44pt on mobile, ≥ 24px on admin.
- [ ] Dynamic type to 200% — no clipping, no horizontal scroll.
- [ ] Focus order documented.
- [ ] Screen-reader labels documented.
- [ ] Reduced-motion fallback for non-trivial animation.
- [ ] No color-only signals.

## Privacy

- [ ] Full PAN, full PINFL, full document number never in UI — even on tap, even in admin.
- [ ] Sensitive fields masked at all times.

## Acceptance criteria

- [ ] Gherkin or checklist authored. See [`acceptance-criteria.md`](./acceptance-criteria.md).
- [ ] Each criterion references a data-model field, state-machine state, error code, or flow step.
- [ ] Engineering and compliance signed off where applicable.

## Doc cascade

- [ ] If this change altered behavior, the affected `docs/` file (`models.md`, PRD, `mermaid_schemas`) was updated in the same PR.
- [ ] If a state machine changed, every screen visualizing it was reviewed.

## Final smell test

Ask: **"Would a staff product designer at a regulated fintech approve this?"** — if no, iterate.
