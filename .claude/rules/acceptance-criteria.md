# Acceptance Criteria Authoring

Every design ticket carries acceptance criteria authored by design, signed off by engineering and compliance.

## Format

Either **Gherkin** (`Given / When / Then / And`) or a **checklist**. Pick the format that fits:
- Flow logic → Gherkin
- Screen-state coverage → checklist

## Required references

Each criterion must reference at least one of:
- A field in [`docs/models.md`](../../docs/models.md) (e.g. `user.kyc_tier`, `transfers.status`)
- A state in [`docs/mermaid_schemas/*_state_machine.md`](../../docs/mermaid_schemas/)
- A code in the `error_codes` table
- A flow step in [`docs/mermaid_schemas/*_flow.md`](../../docs/mermaid_schemas/)

If a criterion references none of these, it's not testable — rewrite it.

## Gherkin example

```
GIVEN  user.kyc_tier = tier_1
AND    user_limit_usage.daily_used + amount > tier_1.daily_limit_uzs
WHEN   user submits the transfer
THEN   reject with error_code = LIMIT_DAILY_EXCEEDED
AND    show tier-upgrade CTA pointing to MyID flow
AND    no rows written to transfers
AND    no rows written to user_limit_usage
```

## Checklist example (screen-state coverage)

```
Send-money review screen — acceptance:
- [ ] Renders all 4 fee/spread lines + total + recipient amount + locked rate
- [ ] Rate-lock countdown visible when fx_rates.valid_to - now() < 60s
- [ ] On tier_1 with international card → upgrade CTA shown instead of Confirm
- [ ] On insufficient daily headroom → inline banner with localized error_code
- [ ] On submit success → status moves to created, then processing
- [ ] On submit failure → matching error_code surfaced, retry CTA per retryable flag
```

## Forbidden patterns

| Don't | Required |
|---|---|
| "Should look good" / "Should feel fast" | Quantified: contrast ≥ 4.5:1, P95 < 300ms |
| Reference design pixels only | Reference data-model fields and state names |
| Skip error states | Every `error_code` path explicitly covered |
| Skip empty / loading states | All six states (empty / loading / success / error / offline / partial) covered |
| Vague acceptance ("user can send money") | Decomposed into testable steps with field references |

## Sign-off

- **Design** writes the AC.
- **Engineering** confirms feasibility and points the ticket.
- **Compliance** signs off on KYC, AML, money-handling, and PCI-impacting criteria.

AC is locked at sprint start. Mid-sprint changes require all three sign-offs again.

## Linkage to handoff

AC is part of the handoff package. See [`handoff.md`](./handoff.md).

## Cross-references
- Schema: [`docs/models.md`](../../docs/models.md)
- State machines: [`status-machines.md`](./status-machines.md)
- Error codes: [`error-ux.md`](./error-ux.md)
- Review checklist: [`design-review-checklist.md`](./design-review-checklist.md)
