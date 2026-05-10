# Admin Dashboard Patterns

The admin dashboard is **internal only** — ops, compliance, KYC review, AML triage. Not customer-facing.

## Audience

- **Compliance officers** — KYC review, AML flag triage
- **Operations** — transfer monitoring, manual reversals
- **Finance** — FX config, commission rules versioning
- **Engineering on-call** — services health

## Surface principles

- **Keyboard-first** — every action available without a mouse. See [`accessibility.md`](./accessibility.md).
- **Density over breathing room** — reviewers process volume; don't waste vertical space.
- **Role visibility** — show the reviewer what they can / can't do based on role.
- **Audit by default** — every state-changing action logs to `transfer_events` or an analogous audit table.

## Required patterns

### Review queue (KYC verifications, AML flags)

```
[filter chips: status • severity • assigned-to • date-range]
[bulk-action bar: appears on row select]
─────────────────────────────────────────────
[ ] [tier badge] Phone           PINFL          Submitted   Status
[ ] [tier_2]    +998 90 123…    1234567...     2h ago      pending
[ ] [tier_2]    +998 91 234…    7654321...     45m ago     pending
─────────────────────────────────────────────
[pagination + count]
```

- Click row → side-sheet with full record + actions.
- Hotkeys: `j` / `k` next/prev, `Enter` open, `a` approve, `r` reject (require reason).

### Monitor dashboard

For transfer flow throughput, FX spread health, services availability:
- Live counts per status (`created` / `processing` / `completed` / `failed` / `reversed`).
- Rolling 60-min throughput chart.
- Service-health grid (alipay / wechat / uzcard / humo / visa / mastercard / myid) — green / amber / red.
- Auto-refresh every 30s; manual refresh button.

### Config screen (commission rules, services on/off, KYC tier limits)

- Show current effective version + history.
- **Edits create a new version**, never mutate the active row.
- Required: change reason + reviewer initials.
- Diff view: old vs new before save.

### Audit log view

- **Append-only** — no edit, no delete.
- Filter by user, transfer, action type, actor, date range.
- Show `actor`, `from_status`, `to_status`, `context` (jsonb pretty-printed), timestamp.

## Forbidden patterns

| Don't | Why |
|---|---|
| Soft-delete via "trash" UI | Audit-protected entities never delete |
| Inline-edit of past records | Versioning is required (new row, link to old) |
| Action without confirmation | Compliance changes need an undo grace period or reason note |
| Hide failed transfers | Surface them — they're the most important to triage |
| Show full PAN to ops | Same masking as customer-facing (see [`card-schemes.md`](./card-schemes.md)) |
| Toast-only confirmations for destructive actions | Modal + reason note; toast for non-destructive only |

## Permission visibility

Role-based access must be **visible** — not hidden behind disabled buttons without explanation:

| If user lacks permission | Treatment |
|---|---|
| Action irrelevant to their role | Don't render the control at all |
| Action requires elevation | Render the control + tooltip explaining the requirement |
| Action requires sign-off from another role | Show "Pending [role]" state |

## Cross-references
- KYC tier semantics: [`kyc-tiers-and-limits.md`](./kyc-tiers-and-limits.md)
- Status transitions admins can perform: [`status-machines.md`](./status-machines.md)
- Error display: [`error-ux.md`](./error-ux.md)
- Card masking: [`card-schemes.md`](./card-schemes.md)
- Keyboard / focus: [`accessibility.md`](./accessibility.md)
