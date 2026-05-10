# Money & FX Rendering

How amounts and exchange rates are stored, computed, and displayed.

## Storage vs display

Backend stores amounts in **smallest currency unit** (`bigint`):
- UZS in **tiyins** (1 UZS = 100 tiyins)
- CNY in **fen** (1 CNY = 100 fen)

UI **always** divides by 100 at display time. Never store, pass, or render floats.

## Formatting

| Locale | UZS example | CNY example |
|---|---|---|
| `uz` | `5 000 000 UZS` | `2 500 CNY` |
| `ru` | `5 000 000 UZS` | `2 500 CNY` |
| `en` | `5,000,000 UZS` | `2,500 CNY` |

- Group separator follows locale (space for `uz`/`ru`, comma for `en`).
- Decimal separator: comma for `uz`/`ru`, period for `en`.
- Currency code follows the amount, separated by a non-breaking space.
- Never round before display — backend already enforces flooring (`amount_cny = floor(amount_uzs × client_rate)`).

## What never appears in UI

| Forbidden | Use instead |
|---|---|
| `5000000` (raw tiyins) | `50 000.00 UZS` (formatted) |
| `1.234567` (rate as float string) | `1 234.57 UZS / CNY` |
| `5000000.0` (any float) | `bigint` divided by 100 |

## FX rate transparency

### Send-money breakdown — required structure

Every send-money review screen must render these lines:

```
You send                  5 000 000.00 UZS
Service fee                  50 000.00 UZS  (1.0%)
FX spread                     5 000.00 UZS
─────────────────────────────────────────
Total charge              5 055 000.00 UZS
─────────────────────────────────────────
Recipient gets                3 600.00 CNY
Rate                  1 CNY = 1 404.17 UZS  (locked)
```

Source fields (from `transfers`, `transfer_fees`, `fx_rates`):
- `amount_uzs`
- `fee_uzs`
- `fx_spread_uzs`
- `total_charge_uzs`
- `amount_cny`
- `client_rate`

### Rate-lock countdown
If the FX quote has a TTL:
- Display countdown: `Rate locked for 02:34`.
- When countdown hits 0, fetch a new quote and show a diff if the rate moved beyond a threshold.
- **Never silently substitute** a new rate.

### Rate immutability after submit
Once `transfer.status = processing`:
- The locked rate is **immutable** for that transfer.
- Detail screens display the historical `client_rate`, not the current market rate.
- Never recompute mid-flight.

## International cards
Visa / Mastercard may carry a different fee. The breakdown line must show the differential:
```
Service fee   75 000.00 UZS  (1.5% — international card)
```
Never hide the differential. See [`card-schemes.md`](./card-schemes.md).

## Edge cases

| Scenario | Display rule |
|---|---|
| Amount below per-tx minimum | Disable Confirm; inline error from `error_codes` |
| Amount above per-tx limit | Show suggested split + tier-upgrade CTA |
| FX rate stale (`FX_STALE`) | Refetch inline; do not navigate away |
| Provider down | Disable Confirm; show `PROVIDER_UNAVAILABLE` from `error_codes` |
| Total charge exceeds card balance | `INSUFFICIENT_FUNDS` from `error_codes`; suggest other card |

## Cross-references
- Tier-driven limits: [`kyc-tiers-and-limits.md`](./kyc-tiers-and-limits.md)
- Error display: [`error-ux.md`](./error-ux.md)
- Card-scheme rules: [`card-schemes.md`](./card-schemes.md)
- Schema fields: [`docs/models.md`](../../docs/models.md) §3, §4
