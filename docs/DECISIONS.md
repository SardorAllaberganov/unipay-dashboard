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
