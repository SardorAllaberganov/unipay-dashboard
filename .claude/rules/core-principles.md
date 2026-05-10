# Core Principles

Foundational design principles for ZhiPay. Every screen, flow, and copy decision must satisfy these.

## Mobile-first
Design for the smallest viewport first. The admin dashboard is desktop-first (separate surface — see [`admin-dashboard-patterns.md`](./admin-dashboard-patterns.md)).

## Trust through transparency
Every fee, rate, limit, and status visible **before** the user commits. No hidden cost, no surprise rejection, no FX recalculation mid-flight.

## Localization-first
`uz` is the default — design and copy-review in Uzbek first. `ru` and `en` are first-class. RTL not required for v1. See [`localization.md`](./localization.md).

## No PII leakage
Full PAN, full PINFL, full document number **never** displayed in UI — not even briefly, not on tap-to-reveal, not in admin.

## Money correctness in copy
Every amount shown with currency code/symbol and locale-aware separator. Never display raw `bigint` minor units. See [`money-and-fx.md`](./money-and-fx.md).

## Compliance is a feature
KYC and AML interactions are designed for the actor (end-user vs ops reviewer), not bolted on as afterthoughts. See [`kyc-tiers-and-limits.md`](./kyc-tiers-and-limits.md) and [`admin-dashboard-patterns.md`](./admin-dashboard-patterns.md).

## No raw timestamps
Always formatted relative to the user's locale (`DD.MM.YYYY` for `uz`/`ru`, `MMM D, YYYY` for `en`). Relative time ("2h ago") is acceptable for recent events; absolute timestamps for anything > 24h.

## Fail loudly, recover gracefully
Failed transfers explain why and offer the next action, sourced from `error_codes`. Silent failure is forbidden. See [`error-ux.md`](./error-ux.md).

## Explicit over implicit
If a screen's behavior isn't obvious from looking at it, **fix the screen — not the spec**. No tooltip-only affordances for primary actions.

## Match the schema
Never propose UI that contradicts [`docs/models.md`](../../docs/models.md). If the design needs a field that doesn't exist or a state that isn't in the machine, propose a model change first — don't fake it in the UI.

## Defer to the docs
If any rule here conflicts with a fact in `docs/`, **the docs win**. Fix the doc, then update this file.
