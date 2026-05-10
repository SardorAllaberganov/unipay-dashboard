# KYC Tiers & Limits

KYC tier is the single biggest gate in the product. Every screen that involves money, cards, or compliance must respect the user's tier.

## Tiers (canonical — see [`docs/models.md`](../../docs/models.md) §2.2)

| tier | how attained | per-tx (UZS) | daily (UZS) | monthly (UZS) | max cards | Visa/MC? |
|---|---|---:|---:|---:|---:|:---:|
| `tier_0` | just signed up | 0 | 0 | 0 | 1 | no |
| `tier_1` | phone-verified (SMS OTP) | 5,000,000 | 5,000,000 | 20,000,000 | 2 | no |
| `tier_2` | full MyID-verified | 50,000,000 | 50,000,000 | 200,000,000 | 5 | yes |

> Numbers are placeholders pending Compliance sign-off.

## Design rules

### tier_0 cannot transfer
- Home screen surfaces an **upgrade path**: phone verification → MyID.
- Send-money entry points are visible but disabled with a clear "Verify to send" CTA.
- Never silently hide functionality — always explain *why* it's locked.

### Tier headroom must be visible
On send-money entry:
```
Daily       1 200 000 / 5 000 000 UZS   24%
Monthly     8 400 000 / 20 000 000 UZS  42%
```
- Color the meter when ≥ 80% used.
- Hide the row entirely on `tier_0` (since it's 0/0).

### Limit-exceeded is an upgrade moment, not a hard block
When `LIMIT_DAILY_EXCEEDED`, `LIMIT_MONTHLY_EXCEEDED`, or `LIMIT_PER_TX_EXCEEDED` triggers:
- Show the localized message from `error_codes`.
- Offer the next-higher-tier upgrade as a CTA when applicable (`tier_1 → tier_2` via MyID).
- Suggest splitting the transfer when `PER_TX_EXCEEDED` is the cause.

### Visa / Mastercard linking gates on tier_2
- "Add Visa" / "Add Mastercard" tiles are visible to `tier_1` users → tap routes to MyID flow first.
- After MyID success, return to the card-add flow.
- Never silently fail the link — explain the requirement.

### MyID expiry → demote to tier_1
When `kyc_verifications.expires_at` passes:
- User demoted to `tier_1`.
- Banner: "MyID verification expired — re-verify to restore higher limits."
- Linked Visa/MC cards transition to `frozen` (per [`card-schemes.md`](./card-schemes.md)).

### Tier changes are notifications, not silent
Every tier change generates a notification (`type=compliance`) so the user understands their new limits.

## Acceptance criteria pattern

```
GIVEN  user.kyc_tier = tier_1
AND    user_limit_usage.daily_used + amount > tier_1.daily_limit_uzs
WHEN   user submits the transfer
THEN   reject with error_code = LIMIT_DAILY_EXCEEDED
AND    show tier-upgrade CTA pointing to MyID flow
AND    no rows written to transfers
AND    no rows written to user_limit_usage
```

See [`acceptance-criteria.md`](./acceptance-criteria.md) for the full format.

## Cross-references
- Money math: [`money-and-fx.md`](./money-and-fx.md)
- KYC state machine: [`status-machines.md`](./status-machines.md)
- Card-scheme tier gating: [`card-schemes.md`](./card-schemes.md)
