# DECISIONS.md

Log every deviation from `STYLE_DISCIPLINE.md` here.

## Format

For each deviation:

1. **Rule** — the specific § number being deviated from.
2. **Reason** — technical constraint, product requirement, or accessibility trade-off.
3. **Scope** — which file / feature / route is affected.
4. **Review date** — when to revisit and either ratify or revert.

A deviation that isn't logged here is a bug.

---

## 2026-05-11 · Organization — add flows are standalone pages, not Dialogs/Sheets

1. **Rule** — The Prompt 4 spec called for "Add account → `<ResponsiveSheet>` form" and "+ Add подразделение → `<AddDepartmentDialog>`". §0.5 doesn't prescribe a default for create flows — it documents detail-page chrome (back link + action bar) for either pattern.
2. **Reason** — User explicitly requested: "in addition pages in organizations should be separate pages". Create flows tend to grow fields over time (bank account today is 7 fields, departments today is 3 fields; both will accrete more — head-of-staff Combobox once `/staff` exists, payment-types Checkbox group, notes Textarea, etc.). A Sheet/Dialog that grows tall enough to need internal scroll degrades UX (focus-ring clipping, sticky-footer layout fragility, no shareable URL for an in-progress form, no browser back). Promoting create to full pages gives shareable URLs (deep-linkable for "add child under department X" via `?parentId=X`), browser-native back, and clean §0.5 Pattern A action bar without nested-scroll headaches. Edit stays in the Sheet — edit is short, contextual, and benefits from staying near the row being edited.
3. **Scope** — [`AddBankAccountPage.tsx`](../src/features/organization/pages/AddBankAccountPage.tsx) at `/organization/bank-accounts/new`. [`AddDepartmentPage.tsx`](../src/features/organization/pages/AddDepartmentPage.tsx) at `/organization/departments/new[?parentId=X]`. Both registered as **siblings** of the `<OrganizationLayout>` route (not children) so the tabs strip doesn't render on them — back link is the only orientation chrome. The deleted `AddDepartmentDialog.tsx` is replaced; `BankAccountForm.tsx` simplified to edit-only.
4. **Review date** — Permanent shift in product convention. Apply the same pattern to future modules' create flows (Students, Refunds, Reports, etc.) — Sheet/Dialog reserved for edit + confirm + small-scope picker flows only. Revisit only if a usability test exposes a regression (e.g. context loss from leaving the list).

## 2026-05-11 · Organization — cross-feature imports of `PanelStates` and `BankCombobox`

1. **Rule** — `.claude/rules/design-system-layers.md` import direction: Components may reference Tokens / Primitives but NOT other Components, Patterns, or Screens (no sideways imports between features).
2. **Reason** — `<PanelStates>` lives at [`features/dashboard/components/PanelStates.tsx`](../src/features/dashboard/components/PanelStates.tsx) and uses the current `common.states.*` i18n keys; the legacy [`shared/EmptyState`](../src/components/shared/EmptyState.tsx) / [`ErrorState`](../src/components/shared/ErrorState.tsx) / [`OfflineState`](../src/components/shared/OfflineState.tsx) primitives use older keys (`states.errorTitle`, `common.retry`) that don't match the current `common.states.*` namespace. `<BankCombobox>` lives at [`features/onboarding/components/BankCombobox.tsx`](../src/features/onboarding/components/BankCombobox.tsx) and is fully generic but feature-local. Promoting either to `src/components/shared/` requires updating 5 dashboard imports (PanelStates) + 1 onboarding Step 3 import (BankCombobox) + adding the new shared file. Acceptable velocity tradeoff for landing Prompt 4 cleanly; flagged for cleanup.
3. **Scope** — Organization module's Profile / Departments / Bank Accounts / Branding pages import `PanelStates` directly from `@/features/dashboard/components/PanelStates`. `BankAccountForm.tsx` + `AddBankAccountPage.tsx` import `BankCombobox` from `@/features/onboarding/components/BankCombobox`. Both flagged in [`AI_CONTEXT.md`](../ai_context/AI_CONTEXT.md) "Open work" and [`product_states.md`](./product_states.md) outstanding follow-ups.
4. **Review date** — Promote both to `src/components/shared/` before the next feature module lands (Prompt 5 — Students). Promoting `PanelStates` also requires reconciling the older `EmptyState`/`ErrorState`/`OfflineState` primitives — likely retire them since they reference dropped i18n keys.

---

## 2026-05-11 · Dashboard — KPI hero number is `text-2xl md:text-3xl` (responsive, not always `text-3xl`)

1. **Rule** — §0.2 typography lock: `text-3xl` (28px) = "KPI hero numbers".
2. **Reason** — At mobile 2-column grid (~140px card width), full UZS amounts like `298 436 322 UZS` overflow `text-3xl font-mono` and previously clipped via `truncate` to `298 436 322 U…` — a real readability bug reported by the user. The fix uses `text-2xl` (22px, still in the §0.2 scale) on mobile and the canonical `text-3xl` (28px) at `md:` and above. Numbers also wrap naturally at the UZS thousand-space separators since `truncate` is removed; on tiny widths the amount may flow across two lines but stays fully visible.
3. **Scope** — [`src/features/dashboard/components/KpiCard.tsx`](../src/features/dashboard/components/KpiCard.tsx) hero number only. Sparklines, deltas, subtitles unchanged.
4. **Review date** — Revisit if a future format helper (compact UZS like `298.4M UZS`) lets us keep `text-3xl` at all widths without overflow. (Earlier of: compact-format helper landing, or 2026-Q3 design refresh.)

## 2026-05-11 · Dashboard — page mounts at `/` (not `/dashboard`)

1. **Rule** — Prompt 3 (Dashboard Home) header: "Page — `/dashboard`".
2. **Reason** — Same as the 2026-05-10 Auth decision below: the IA has one home route, `/`, and adding a parallel `/dashboard` would create two URLs for the same screen. Sign-in already redirects to `/` per the existing deviation. The greeting page header reads as the dashboard's own surface; no nested routing under `/dashboard/*` exists or is planned.
3. **Scope** — [`src/router.tsx`](../src/router.tsx) routes `<DashboardPage />` at `/`. [`src/features/dashboard/pages/DashboardPage.tsx`](../src/features/dashboard/pages/DashboardPage.tsx) reads `?from=&to=` for the date-range filter; that URL contract is unchanged.
4. **Review date** — Same trigger as the Auth deviation: when/if the IA grows nested dashboard surfaces, lift the page to `/dashboard` and redirect `/`.

## 2026-05-11 · ConfirmDialog — default `minReasonLength` raised 10 → 20

1. **Rule** — §0.9 v2.0: reason notes ≥ 20 chars for destructive actions; ≥ 10 only for low-stakes notes (audit context, optional reviewer comment).
2. **Reason** — [`src/components/shared/ConfirmDialog.tsx`](../src/components/shared/ConfirmDialog.tsx) had a hardcoded `minLength = 10`, predating the v2.0 threshold bump. Updating the default keeps every destructive consumer compliant by default; an explicit `minReasonLength={10}` override is available for low-stakes notes. Dashboard bulk-remind is the first consumer and uses the new default.
3. **Scope** — `ConfirmDialog` default + i18n keys `common.reasonLabel` / `common.reasonPlaceholder` now interpolate `{{count}}`. No other consumers existed at the time of the bump.
4. **Review date** — Re-verify with each new destructive consumer that they don't override below 20 without a compliance signoff.

## 2026-05-10 · Auth — sign-in success redirects to `/` (not `/dashboard`)

1. **Rule** — Prompt 1 (Auth) acceptance criterion: "Successful sign-in redirects to `?next=` if present (must start with `/`), else `/dashboard`."
2. **Reason** — There is no `/dashboard` route in this build. Dashboard lives at `/` (see [`router.tsx`](../src/router.tsx)). Adding a `/dashboard` route or redirect just to satisfy the prompt's literal wording would clutter the IA without user benefit.
3. **Scope** — [`src/features/auth/components/SignInForm.tsx`](../src/features/auth/components/SignInForm.tsx), [`src/features/auth/components/DevRoleSwitcher.tsx`](../src/features/auth/components/DevRoleSwitcher.tsx). Default redirect target is `/`. The `?next=` query parameter still wins when present and starts with `/`.
4. **Review date** — When/if the IA introduces a real `/dashboard` route distinct from `/`, swap the fallback target back to `/dashboard` in both places. (No earlier than 2026-Q3.)

## 2026-05-10 · Auth — password show/hide toggle button is 36×36, not 44×44

1. **Rule** — §0.7 "Tap targets ≥ 44×44pt on mobile."
2. **Reason** — The toggle sits inside the password [`Input`](../src/components/ui/input.tsx) (`h-9` = 36px). Forcing the button to 44px would either break the input height (which is locked to `h-9` per §controls) or have it overflow visually. Standard pattern across major auth surfaces (Stripe, Linear, Vercel) is the same 36px-or-smaller toggle inside an h-9 input.
3. **Scope** — [`src/features/auth/components/PasswordField.tsx`](../src/features/auth/components/PasswordField.tsx). Affects only the show/hide toggle; the input field itself is full-width and meets target on its own.
4. **Review date** — When we revisit form-control density (e.g. lifting `h-9` to `h-10` or moving toggles outside the input), reassess. No fixed date.
