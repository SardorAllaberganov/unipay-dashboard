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
