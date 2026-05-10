# Localization

Every user-facing string is a **key**, not a string. UZ first; RU and EN co-equal.

## Live languages
- `uz` — default, design-and-review-first
- `ru` — first-class
- `en` — first-class
- `kz`, `kaa` — planned, not v1 (Kazakh is `kz`, **NOT** `kk`)

## File layout (created on first copy block)

```
i18n/
  uz.json
  ru.json
  en.json
```

Mirror in design specs: every text element references a key, never a literal.

## Key naming convention

`<surface>.<screen>.<element>` — kebab-case within each segment.

```
mobile.send-money.review.fx-rate-disclaimer
mobile.send-money.review.cta-confirm
admin.kyc-queue.row.tier-badge
common.errors.LIMIT_DAILY_EXCEEDED.title
common.errors.LIMIT_DAILY_EXCEEDED.body
```

- `common.*` for cross-screen strings (errors, status labels, button text).
- `mobile.*` and `admin.*` for surface-specific strings.

## Workflow rules

### UZ locks first
1. Design and copy-review in `uz`.
2. Once `uz` is locked, translate to `ru` and `en` in parallel.
3. Verify all three for line length (Russian runs 15–25% longer; English varies).
4. Re-test with the **longest** translation in every viewport.

### Untranslated keys are blockers
Designs never ship with `[NEEDS_TRANSLATION]` placeholders. If a key is missing for any of `uz` / `ru` / `en`, the screen is **not done**.

### Pluralization
Use ICU MessageFormat for plural-sensitive strings:

```json
"mobile.history.transfers-count": "{count, plural, one {# transfer} other {# transfers}}"
```

Russian has more plural forms than English (one / few / many) — every count-bearing string must be tested in `ru`.

## Numbers, dates, currency

Driven by `users.preferred_language`, **not** device locale.

| Concern | `uz` / `ru` | `en` |
|---|---|---|
| Number grouping | space (` `) | comma (`,`) |
| Decimal separator | comma (`,`) | period (`.`) |
| Date format | `DD.MM.YYYY` | `MMM D, YYYY` |
| Time format | 24-hour | 12-hour |
| Currency | see [`money-and-fx.md`](./money-and-fx.md) | see [`money-and-fx.md`](./money-and-fx.md) |

## Forbidden

| Don't | Required |
|---|---|
| `<Text>Send</Text>` | `<Text>{t('mobile.send-money.cta-send')}</Text>` |
| `Daily limit reached` (literal in design spec) | key `common.errors.LIMIT_DAILY_EXCEEDED.title` |
| Concatenating localized strings | Use ICU format with placeholders |
| Translating from device locale | Use `users.preferred_language` |

## RTL
Not required for v1. Design ltr-first; do not architect for RTL flips.

## Error messages

Pulled from `error_codes` (uz/ru/en columns). Designs reference `error_codes.code`, not the message text. See [`error-ux.md`](./error-ux.md).

## Cross-references
- Money formatting per locale: [`money-and-fx.md`](./money-and-fx.md)
- Accessibility × localization (TTS pronunciation, bidi): [`accessibility.md`](./accessibility.md)
