# Status Machines

Every UI status visualization must match the canonical state machine. **Never invent states.**

## Canonical sources

| Domain | File |
|---|---|
| Transfer | [`docs/mermaid_schemas/transfer_state_machine.md`](../../docs/mermaid_schemas/transfer_state_machine.md) |
| KYC | [`docs/mermaid_schemas/kyc_state_machine.md`](../../docs/mermaid_schemas/kyc_state_machine.md) |
| Card | [`docs/mermaid_schemas/card_state_machine.md`](../../docs/mermaid_schemas/card_state_machine.md) |

If a design needs a state that doesn't exist (`awaiting_3ds`, `partial_refund`, etc.), **propose a model + state-machine update first**. Update the canonical doc, then design against it. Never invent in the UI.

## Allowed states

### Transfer
`created`, `processing`, `completed`, `failed`, `reversed`

### KYC
`pending`, `passed`, `failed`, `expired`

### Card
`active`, `frozen`, `expired`, `removed`

## Design rules

### Status timeline pattern (transfer detail)
Render a timeline derived from `transfer_events`:

```
✓ Created                   14:32 today
✓ Auth captured             14:32 today
✓ Sent to Alipay            14:33 today
● Confirming...             14:33 today
○ Completed
```

- Filled circle = past, ring = current, hollow = future.
- Show `failure_code` (localized via `error_codes`) when state = `failed`.
- Show refund / reversal timestamp when state = `reversed`.
- Always include the actor (`system | user | provider | admin`) for each event.

### Status-to-tone mapping (proposal — confirm with brand tokens)

| State | Tone |
|---|---|
| `created`, `pending` | neutral / blue |
| `processing` | active / blue with motion |
| `completed`, `passed`, `active` | success / green |
| `failed`, `expired` | error / red |
| `reversed` | warning / amber |
| `frozen`, `removed` | muted / gray |

### Transitions are not user-controllable
The user never picks a status. Designs **must not** surface "Mark completed" or "Force fail" CTAs. Status moves only via system events (acquirer ack, provider webhook, ops action).

### Admin overrides
Ops can transition a stuck `processing` → `failed` (manual reversal) or unfreeze a card (`frozen` → `active`). These are admin-dashboard-only — see [`admin-dashboard-patterns.md`](./admin-dashboard-patterns.md). Always require a reason note that lands in `transfer_events.context`.

## State-machine awareness — required in every design ticket

For any screen that visualizes a status, the design package includes:
- The canonical state-machine file referenced.
- A diagram of which transitions the UI may *show* (not all transitions need their own animation).
- Empty / loading / error states for every visualizable state.

## Cross-references
- Acceptance criteria for state-driven flows: [`acceptance-criteria.md`](./acceptance-criteria.md)
- Failure UX: [`error-ux.md`](./error-ux.md)
- Card status visuals: [`card-schemes.md`](./card-schemes.md)
