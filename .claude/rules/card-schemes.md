# Card Schemes

Display rules for the four supported card schemes.

## Supported schemes (canonical — see [`docs/models.md`](../../docs/models.md) §3.2)

| code | display name | issuer country | 3DS | international | KYC required |
|---|---|---|:---:|:---:|---|
| `uzcard` | UzCard | UZ | yes | no | `tier_1+` |
| `humo` | Humo | UZ | yes | no | `tier_1+` |
| `visa` | Visa | any | yes | yes | **`tier_2`** |
| `mastercard` | Mastercard | any | yes | yes | **`tier_2`** |

## Brand-correct logos
Each scheme's logo follows the official brand guidelines. Maintain a `card-scheme-logo` primitive that switches by `scheme.code`. Never substitute a generic credit-card icon.

## Masked PAN format

Display **only** first 6 + 4 dots + last 4:

```
4242 42•• •••• 4242     ← display
4242424242424242        ← never displayed
```

The `linked_cards.masked_pan` field comes formatted as `first6+last4` from the backend — UI inserts dots / spacing for visual rhythm only. Never reconstruct the full PAN, even briefly.

## Card row layout (mobile, default)

```
[scheme logo]  Bank Name              Default ●
               4242 42•• •••• 4242    expires 12/27
```

- Show "Default" badge for the user's default card.
- Show `expires MM/YY` from `expiry_month` / `expiry_year`.
- Tap → card-management sheet.

## International card disclosure

Visa / Mastercard may carry a higher fee. On send-money review:

```
[Visa logo]  Visa •••• 4242
Service fee:  75 000.00 UZS  (1.5% — international card)
```

**Never hide the fee differential.** See [`money-and-fx.md`](./money-and-fx.md).

## tier_1 trying to add Visa / MC

The "Add Visa" / "Add Mastercard" tile is visible but on tap shows:

> "Visa & Mastercard require full verification. Verify with MyID to continue."

- **Primary CTA:** "Verify with MyID" → routes to MyID flow.
- **Secondary CTA:** "Use UzCard or Humo instead" → returns to scheme picker.

## Status mapping

Per [`status-machines.md`](./status-machines.md):

| `linked_cards.status` | UI treatment |
|---|---|
| `active` | full opacity, all actions available |
| `frozen` | dimmed + lock icon, "Frozen — contact support" |
| `expired` | dimmed + warning icon, "Expired — re-add card" |
| `removed` | hidden from list |

## 3DS WebView

When the user adds a card or makes their first transfer with it:
- 3DS challenge opens in a managed in-app WebView.
- Clear "Return to ZhiPay" affordance always visible.
- Branded loading state — never raw bank chrome.
- On success or failure, return to the originating screen with a status banner.

## Forbidden

- Showing the full PAN, even briefly.
- Storing or echoing the CVV anywhere in the UI.
- Showing the holder's full document number alongside the card.
- Falling back to a generic credit-card icon when scheme is known.
- Allowing card edit (PAN can never be edited — re-add only).

## Cross-references
- Tier gating: [`kyc-tiers-and-limits.md`](./kyc-tiers-and-limits.md)
- Fee disclosure: [`money-and-fx.md`](./money-and-fx.md)
- Card lifecycle: [`status-machines.md`](./status-machines.md)
- 3DS link flow: [`docs/mermaid_schemas/card_linking_flow.md`](../../docs/mermaid_schemas/card_linking_flow.md)
