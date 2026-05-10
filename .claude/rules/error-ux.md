# Error UX

All user-facing error messages come from the `error_codes` table. Designs **never invent error copy**.

## Source of truth

`error_codes` table — see [`docs/models.md`](../../docs/models.md) §7.

Each code carries:
- `code` — e.g. `LIMIT_DAILY_EXCEEDED`
- `category` — `kyc | acquiring | fx | provider | compliance | system`
- `message_uz`, `message_ru`, `message_en`
- `retryable` — boolean
- `suggested_action_uz`, `suggested_action_ru`, `suggested_action_en` — per-locale, parallel to `message_*` (split from singular `suggested_action` in Phase 16 to match the message/action authoring rhythm — see [`docs/models.md`](../../docs/models.md) §7)

## Error component contract

Every error renders with this structure:

```
[icon by category]
[localized title  — derived from message_*]
[localized body / suggested_action]
[primary CTA      — only if retryable=true OR a navigation makes sense]
[secondary CTA    — "Contact support" or "Get help"]
```

## Title vs body

- **Title** — user-friendly form ("Daily limit reached")
- **Body** — `suggested_action` localized + any context the user needs

## Retry CTA visibility

| `retryable` | Primary CTA |
|:---:|---|
| `true` | "Try again" |
| `false` | hidden — show navigation CTA instead (e.g. "Verify with MyID" for KYC errors) |

## Category-specific patterns

| Category | Pattern |
|---|---|
| `kyc` | Route to MyID flow; never expose internal KYC plumbing |
| `acquiring` | Suggest another card; show card-management deep link |
| `fx` | Refresh quote inline; don't navigate away |
| `provider` | Calm "We're confirming this" — no scary error face |
| `compliance` | Calm "We're reviewing this" — never expose AML logic, no retry |
| `system` | Generic apology + "Try again" + support link |

## Forbidden patterns

| Don't | Do |
|---|---|
| Hardcode error strings in screens | Pull from `error_codes` via key |
| Show stack traces or `failure_code` raw | Show localized `message_*` |
| Silent failure | Always render an error state |
| Modal-blocking errors for non-fatal cases | Inline banner / toast for recoverable errors |
| Log out the user on `KYC_EXPIRED` | Soft demote + re-verify CTA |
| Show technical jargon (HTTP codes, JSON) | Plain language sourced from the table |

## Sanctions / AML handling

For `SANCTIONS_HIT` and similar compliance categories:
- Body copy: "We're reviewing this transfer for compliance. We'll notify you within 24 hours."
- **Hide retry. Hide reason. Never expose internal AML logic.**
- Notification arrives later — see [`docs/mermaid_schemas/transfer_failure_recovery_flow.md`](../../docs/mermaid_schemas/transfer_failure_recovery_flow.md).

## Common error codes (quick reference)

| code | category | retryable | UX action |
|---|---|:---:|---|
| `KYC_REQUIRED` | kyc | no | Route to phone verification |
| `KYC_EXPIRED` | kyc | no | Re-run MyID; soft-demote tier |
| `LIMIT_DAILY_EXCEEDED` | compliance | no | Suggest waiting or upgrading tier |
| `LIMIT_PER_TX_EXCEEDED` | compliance | no | Suggest splitting transfer |
| `CARD_DECLINED` | acquiring | yes | "Try another card" + retry |
| `INSUFFICIENT_FUNDS` | acquiring | yes | "Top up card" + retry |
| `FX_STALE` | fx | yes | Refetch rate inline |
| `PROVIDER_UNAVAILABLE` | provider | yes | Backoff + retry |
| `RECIPIENT_INVALID` | provider | no | "Verify Alipay/WeChat handle" |
| `SANCTIONS_HIT` | compliance | no | Calm review pattern |

Pull the canonical list from the table — don't drift this snapshot.

## Cross-references
- Status display: [`status-machines.md`](./status-machines.md)
- Localization keys: [`localization.md`](./localization.md)
