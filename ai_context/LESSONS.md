# LESSONS.md — UNIPAY Merchant Dashboard

Append-only rules learned from user corrections and validated approaches. **Phrased as rules, not recaps.** Lead with the rule, then `Why:` and `How to apply:` lines.

Review at session start (or via `/start_task`). Most recent on top.

---

## 2026-05-11 · DataTable column `meta`: header and cell alignment must be set together; date/time and amount columns also need `whitespace-nowrap` on BOTH sides

**Rule.** When defining a `<DataTable>` column via TanStack `ColumnDef`, the `meta.headerClassName` and `meta.cellClassName` are independent — applying `text-right` to one does NOT propagate to the other. Whatever alignment / wrapping the cell has, the **header must mirror**. Concretely:

- **Right-aligned amount column** →
  ```ts
  meta: {
    headerClassName: 'text-right',
    cellClassName: 'text-right whitespace-nowrap',
  }
  ```
  Both sides get `text-right`. The cell gets `whitespace-nowrap` so values like `"116 562 100 UZS"` don't break at the digit-group spaces. The header is short enough that nowrap rarely matters, but if the column has `w-[1%]` it should also wrap-nowrap so the header itself doesn't squeeze to 2 lines.

- **Date / datetime column** (typically narrow, `w-[1%]`) →
  ```ts
  meta: {
    headerClassName: 'w-[1%] whitespace-nowrap',
    cellClassName: 'whitespace-nowrap',
  }
  ```
  The header (`"Дата и время"`, `"Last payment"`, etc.) must NOT wrap to multiple lines just because the column is width-collapsed.

- **Mono ID column** → same: `headerClassName: 'w-[1%] whitespace-nowrap'`, `cellClassName: 'whitespace-nowrap'` so e.g. `TXN-…FCD2` doesn't break.

- **Numeric-tail columns like "Days overdue"** → `headerClassName: 'w-[1%] whitespace-nowrap text-right'`, `cellClassName: 'pr-3 text-right whitespace-nowrap'`.

**Why.** Repeated bug pattern across the Payments/Students/Pending tables: cells were right-aligned, headers stayed left-aligned (mismatch), and date/time headers wrapped to two lines because the column was width-collapsed with `w-[1%]` and the header text had spaces. Users flagged each instance separately. This rule consolidates: any time you write `cellClassName: 'text-right'`, also write `headerClassName: 'text-right'`. Any narrow column (`w-[1%]`) needs `whitespace-nowrap` on the header.

**How to apply.** When creating a `ColumnDef` for a DataTable column:
1. If the cell has `text-right`, the header gets `text-right` too.
2. If the column collapses via `w-[1%]`, the header gets `whitespace-nowrap`.
3. If the cell content includes spaces in formatted values (UZS amounts, datetimes, mono ids with `…`), the cell gets `whitespace-nowrap`.
4. Sanity-check by reading both `headerClassName` and `cellClassName` together — they should rhyme.

Reference fixes that applied this rule: [`PendingTable.tsx`](../src/features/payments/components/PendingTable.tsx) `remaining` + `dueDate` + `daysOverdue` columns; [`TransactionsTable.tsx`](../src/features/payments/components/TransactionsTable.tsx) `id` + `amount` / `commission` / `net` + `datetime` columns; [`StudentsTable.tsx`](../src/features/students/components/list/StudentsTable.tsx) `amount` + `lastPayment` columns.

---

## 2026-05-11 · `BigInt.prototype.toJSON` patch makes `Money.amount` a `number` at runtime — dividing by `100n` throws TypeError

**Rule.** When a Money-bearing object reaches the UI through MSW (i.e. anywhere outside the seed code itself), `money.amount` is a `number`, NOT a `bigint`, even though the TS type says `bigint`. The global patch in [`src/main.tsx`](../src/main.tsx) collapses bigint → number for JSON serialization so MSW handlers can `HttpResponse.json({ data: tx })` without throwing. Net effect: at runtime, `money.amount` is whatever JSON gave back — a number. Code that does `money.amount / 100n` therefore mixes a JS number with a bigint literal and throws `TypeError: Cannot mix BigInt and other types, use explicit conversions`. **Always coerce to Number first** when you need a UZS-major-units value: `Number(money.amount) / 100`. `formatMoney` already accepts both bigint and number, so it doesn't need this — but ad-hoc arithmetic (refund eligibility / dialog descriptions / amount limits) does.

**Why.** A user reported the transaction detail page showed `<ErrorState>` instead of content. Root cause was `<RefundDialog>` (mounted via `<TransactionDetailActionBar>`) failing with `Cannot mix BigInt and other types` on `Number(transaction.amount.amount / 100n)`. The line typechecks because TS thinks `.amount` is `bigint`, but runtime is `number`. Same bug in [`RefundsTable.tsx`](../src/features/payments/components/RefundsTable.tsx) `approveTarget.amount.amount / 100n`. The error boundary surfaced the issue as "page broken" rather than a clean stack.

**How to apply.** Any time you write arithmetic on a `Money.amount`, write `Number(m.amount) / 100` (no `100n` literal). If you need to push amounts back to the wire (e.g. POSTing a refund), send the UZS-major as a plain `number` — the MSW handler converts back via `uzs(amountUzs)` which wraps in `BigInt(...) * 100n`. Server-side store code can still use `100n` since `m.amount` there really is a bigint. The "number at runtime" only applies after a fetch round-trip.

---

## 2026-05-11 · html + body need `overflow: hidden; height: 100%` for the SPA app-shell to contain scroll properly

**Rule.** In [`src/styles/globals.css`](../src/styles/globals.css) the @layer base contains:
```css
html, body { height: 100%; overflow: hidden; }
```
This locks the document to the viewport so the `<main>` element (which has `flex-1 overflow-y-auto`) owns all vertical scrolling. Without this, certain pages (Transactions specifically, with its bordered shell + bare DataTable + horizontal-overflow Table primitive) leak overflow up to the html level, making the *whole document* scrollable. The user sees the page over-scroll past the bottom of the main content and reveal a blank background.

**Why.** The AppShell layout is `<div className="flex h-dvh"><Sidebar/><main className="flex-1 overflow-y-auto">…</main></div>`. The intent is clear — main is the only scroll container. But in practice some layouts leak: the Transactions page reported `html.scrollHeight = 4262` while every other page (Students / Staff / Pending / etc.) reported `800` = viewport. Diagnosing the exact path was painful; the architectural fix is to physically prevent html/body from scrolling at all. This is the standard "app-shell" pattern used by Slack / Linear / etc. — html and body never scroll.

**How to apply.** Don't remove these rules. If you ever see a "document over-scrolls past content" symptom, this rule is your guard rail. The dvh-based outer flex container + `main.overflow-y-auto` does the actual scroll. Any future "stick this to bottom of viewport" requirement should pin to `main` (or use position:fixed with `--sidebar-width` offset like `<DetailActionBar>` does), not rely on the html-level scroll.

---

## 2026-05-11 · `npm run lint` runs `--report-unused-disable-directives` — stale `eslint-disable-next-line` comments fail CI as errors

**Rule.** After any change that quiets a previously-noisy lint rule — tightening a hook's dependency array, adding a missing return, removing the last `any` from a block, etc. — grep the same file for the matching `eslint-disable-next-line` (or block-level `/* eslint-disable ... */`) comment and remove it in the same change. The [`lint`](../package.json) script is `eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0`, so an orphaned suppression is reported as an error and fails CI just like a real lint violation. Local IDE eslint with default settings does NOT report unused directives, so this only surfaces when CI runs.

**Why.** [`Step3Review.tsx`](../src/features/students/components/import/Step3Review.tsx) carried `// eslint-disable-next-line react-hooks/exhaustive-deps` above a `useMemo` whose deps array `[t, onPatch]` was already complete. The suppression survived a prior cleanup pass. Local `eslint --ext ts,tsx` without `--report-unused-disable-directives` was silent; CI failed.

**How to apply.** When you fix the underlying issue, audit suppressions in the same diff. Pattern to grep before committing a hook-related change: `git grep -nE '// eslint-disable-next-line react-hooks/(exhaustive-deps|rules-of-hooks)' src/`. Same idea applies to other rules — if you remove the last `any` cast in a file, check for `@typescript-eslint/no-explicit-any` disables. The simplest verification is `npm run lint` (not just `eslint` from the IDE) before declaring a change clean.

---

## 2026-05-11 · MSW responses containing `Money.amount: bigint` throw on `HttpResponse.json` — patch `BigInt.prototype.toJSON` globally

**Rule.** Any MSW handler that serializes domain models containing `Money` (or any other `bigint` field) needs JSON to know how to handle bigint. The standard fix: patch `BigInt.prototype.toJSON` once in [`src/main.tsx`](../src/main.tsx) before anything else runs:

```ts
(BigInt.prototype as unknown as { toJSON: (this: bigint) => number }).toJSON = function (this: bigint) {
  return Number(this);
};
```

This converts bigint to a JSON number when `JSON.stringify` runs (which `HttpResponse.json` and our `send` request body use). Safe for UZS tiyins / USD cents because the values fit comfortably under `Number.MAX_SAFE_INTEGER` (9e15) — a 10 billion UZS payment is 1e12 tiyins.

**Why.** Default JavaScript `JSON.stringify({ amount: 5n })` throws `TypeError: Do not know how to serialize a BigInt`. The Students module hit this immediately: every list / detail / schedule / transactions endpoint embeds `Money` objects with bigint amounts, and the list-page query failed before rendering. The visible symptom was the `<ErrorState>` rendering with literal text "states.errorTitle" / "states.errorDescription" because those keys are stale (the component used pre-`common.states.*` paths). Two bugs stacked: the underlying fetch failure, AND the i18n keys in `<ErrorState>` / `<OfflineState>` that prevent the user from seeing a real error message.

**How to apply.** When designing a new MSW handler that uses Money: relax — the global patch covers it. When designing a real backend API: the wire format for Money should be `{ amount: <number>, currency: 'UZS' | 'USD' }` with raw tiyins/cents as a JS number (since UZS amounts stay well below 2^53). `formatMoney` in [`src/lib/format.ts`](../src/lib/format.ts) already accepts both `bigint` and `number` — the type system still says `bigint` is the canonical in-memory form, but at runtime through MSW the value is `number`. No need to rehydrate at the client unless a consumer explicitly needs `typeof === 'bigint'` (rare; only `formatMoney` checks, and it handles both cases).

Also fixed in this batch: [`<ErrorState>`](../src/components/shared/ErrorState.tsx) and [`<OfflineState>`](../src/components/shared/OfflineState.tsx) referenced `t('states.errorTitle')` / `t('states.errorDescription')` / `t('states.offlineTitle')` / `t('states.offlineDescription')` / `t('common.retry')` — all stale. The canonical keys live at `common.states.errorTitle` / `common.states.errorBody` / `system.offline.title` / `system.offline.body` / `common.actions.retry`. When i18next can't find a key, it renders the key path verbatim, which is what masked the underlying serialization bug. **If a user reports "literal key text on screen," the i18n key is wrong AND there's likely a real error underneath bringing that state into view.**

---

## 2026-05-11 · Collapse "actions" columns to content via `meta: { headerClassName: 'w-[1%]' }` — never trust `table-layout: auto` to keep icon-only cells flush right

**Rule.** Whenever a `<DataTable>` column holds a single icon-only control (kebab, status badge, year number, narrow chip) and the consumer wants it flush against the table's right edge, set `meta: { headerClassName: 'w-[1%]', cellClassName: 'pr-3' }` on the column. The `w-[1%]` is a known table-layout idiom that tells the browser "collapse this column to its content"; `pr-3` trims the default `px-4` right padding so the icon's optical center is closer to the visible right edge.

This requires the `ColumnMeta` declaration-merge in [`DataTable.tsx`](../src/components/shared/DataTable.tsx) (`declare module '@tanstack/react-table' { interface ColumnMeta<TData, TValue> { headerClassName?: string; cellClassName?: string } }`) and DataTable's `<TableHead>` / `<TableCell>` reading those into `className`.

**Why.** With `table { width: 100% }` and `table-layout: auto` (default), the browser distributes residual width to columns based on content sizing. An actions column with an `sr-only` header and only a 36×36 kebab inside is the smallest column, but `auto` still gives it whatever's left over after other columns claim theirs — which on narrow viewports + many other columns drifts the kebab position visibly between rows. User reported: "some kebabs are not properly right-aligned." With `w-[1%]`, the column collapses to its content + padding, the kebab sits at a stable position next to the right edge, and every row's kebab lines up vertically.

**How to apply.** Touched the staff page in this batch ([`StaffTable.tsx`](../src/features/staff/components/list/StaffTable.tsx) actions column). Re-applied across the entire Students module for actions / select-checkbox / year / status / channel / receipt / row-index columns. Also useful for `text-right` amount columns — `meta: { cellClassName: 'text-right' }` keeps them right-aligned without inline className overrides. Default reaching: any column with content shorter than its label + padding-rhythm.

---

## 2026-05-11 · NBSP in JS regex character classes triggers `no-irregular-whitespace` ESLint — use ` ` escape

**Rule.** When you write a regex that needs to match the non-breaking space (U+00A0) — typically because you're parsing a UZS amount like `"5 000 000"` where the digit-group separator may be NBSP — write the character class as `[\s ]` (with the escape sequence) rather than `[\s ]` (with a literal NBSP). ESLint's `no-irregular-whitespace` rule fires on the literal NBSP and points at column 35 with an inscrutable "Irregular whitespace not allowed" error.

**Why.** Russian and Uzbek locale formatting uses NBSP between digit groups (`Intl.NumberFormat('ru', ...).format(5000000)` → `"5 000 000"` with NBSPs). The regex needs to strip both regular whitespace AND NBSP to convert back to `Number`. The literal-NBSP form looks indistinguishable from a regular space in most editors, so the lint error is the first visible signal something's wrong. The ` ` escape is functionally identical to the matching engine but trivially auditable in source.

**How to apply.** Any amount-parsing helper that handles user input from a `<Input>` whose displayed value flowed through `formatMoney` / `Intl.NumberFormat` needs this — see [`parseAmountToMoney` in AddStudentPage](../src/features/students/pages/AddStudentPage.tsx) and the parallel helpers in [`ScheduleTab.tsx`](../src/features/students/components/profile/ScheduleTab.tsx) + [`TemplateForm.tsx`](../src/features/students/components/schedules/TemplateForm.tsx). If the lint error fires on a regex line, `od -c` the line to confirm `302 240` bytes (UTF-8 for U+00A0) — if you see them, replace the literal with ` `.

---

## 2026-05-11 · §0.9 audit "Unicode arrows" false-positives on Cyrillic + Russian em-dashes — known limitation, log new noise in MSW fixtures

**Rule.** The `git grep -rnE '[←→↑↓»]'` audit (run via [`scripts/audit-discipline.sh`](../scripts/audit-discipline.sh)) reports byte-collision matches on Cyrillic letters and idiomatic Russian em-dashes (`—`) when grep operates in byte mode. **These are false positives.** Real Unicode arrows (`←→↑↓`) in source code must still be zero, but the audit's reported hits inside Cyrillic strings and em-dashes inside Russian copy are NOT actionable.

**Why.** macOS / Linux `grep` defaults vary by locale. Even with `LC_ALL=en_US.UTF-8`, the character class `[←→↑↓»]` expanded as bytes can overlap with Cyrillic UTF-8 byte sequences (Cyrillic codepoints in U+0400..U+04FF encode as `0xD0 0x80..0xD3 0xBF`, and the arrow codepoints encode as `0xE2 0x86 0x90..0xE2 0x86 0x93`). Some intermediate bytes alias. Em-dashes (`—`, U+2014) and en-dashes (`–`, U+2013) also fire under the same grep pattern in some configurations. Pre-existing repo state.

**How to apply.** When the audit reports "Unicode arrows in copy" hits, scan the output for ACTUAL `←→↑↓»` characters (rare) — those are real violations. Cyrillic lines and em-dashes in Russian-language fixture copy can be ignored. For my own new code (TypeScript/JSX), strip em-dashes from line comments to minimize false positives, but leave them in Russian user-facing strings (em-dash is correct Russian typography in copy). Long term: replace the audit's `grep` with a Python or Node script that respects UTF-8 boundaries.

---

## 2026-05-11 · Generic `<TreePicker>` over flat `TreeItem<TMeta>[]` is the right primitive — one component, four call sites

**Rule.** A tree-shaped picker (department / category / region) with multi-select-with-subtree-toggle / single-select / leafOnly / search-with-ancestor-expand / optional renderMeta — all in one component. API: `TreeItem<TMeta>[]` flat array (each item has `parentId: string | null`), `mode: 'single' | 'multi'`, optional `subtreeToggle`, `leafOnly`, `renderMeta`. Lives at [`src/components/shared/TreePicker.tsx`](../src/components/shared/TreePicker.tsx).

**Why.** Three feature modules currently render department-tree pickers: organization (drag-drop tree editor — different problem), staff (multi-select access picker), students (filter / Add / Apply Template / Change Department — 4 separate call sites in one module). Forking the component per use case multiplies the surface area; a generic shape supports all four students cases without per-site code. The `TMeta` generic lets callers attach domain data (e.g. `Department` with `studentCount`) that `renderMeta` can surface as a trailing chip without baking it into the picker's core.

**How to apply.** New picker need? Use `<TreePicker>` first. Adapt the data into a `TreeItem[]` shape with `id`, `parentId`, `label`, optional `meta`, optional `disabled`. Pick `mode` and constraints. The picker handles search, expand-on-match, subtree-toggle, single-select highlight (brand-50 / brand-700), and `disabled` row state for free. Promotion: when the staff feature's `DepartmentTreePicker` gets touched again, refactor it to consume the shared TreePicker (its multi-select-with-subtree-toggle semantics are exactly what students uses for filter).

---

## 2026-05-11 · No `position: sticky` on scroll headers — filter bars, page-level toolbars, anything that pins to viewport top

**Rule.** Headers and filter bars inside scrollable surfaces (`<main>`, page tabs, list pages) **flow with content** — do not pin them with `position: sticky` (or any `top-0 z-*` + `backdrop-blur` recipe). When the user scrolls down past the filter row, it scrolls away with everything else.

This extends the existing §0.5 rule ("No sticky on detail-page header") and §0.9 rule ("No `position: sticky` on `<thead>`") to **all** page-level chrome: filter rows, search bars, action toolbars above tables, etc. The only sticky element currently sanctioned in the app is the onboarding step indicator inside `<OnboardingLayout>` — that's a wizard chrome, not a content header.

**Why.** Sticky filter bars feel useful in theory but cause real problems in practice:
- They eat ~50–60px of vertical viewport, which matters most on mobile where the user has 600–800px to begin with.
- The `bg-background/95 backdrop-blur` recipe creates a translucent strip that obscures the first row of data underneath as the user scrolls.
- They make `position: sticky` z-index conflicts likely with dropdowns, sheets, and toasts that render through portals.
- Users on small screens have already adapted to scrolling back up to filter — the sticky bar doesn't save real time, it just adds layout fragility.

**How to apply.** When adding a filter row above a table or list, render it as a normal flow element with `mb-4` (or whatever gap looks right) above the data. Do **not** add `sticky top-0`, `z-10`, `backdrop-blur`, or `bg-background/95` to lock it in place. Audit grep before merging: `git grep -nE 'sticky\\s+top-' src/features/` should return only the onboarding step indicator. If a new use case truly needs sticky chrome, log it as a §0.5 deviation in DECISIONS.md with a screen-recording justification.

---

## 2026-05-11 · MSW under a Vite sub-path deploy — pass `serviceWorker.url` built from `BASE_URL`

**Rule.** Whenever `vite.config` sets `base` to anything other than `/` (GitHub Pages sub-path, Netlify alias, sub-directory CDN), the MSW worker registration must point at the same prefix. Pass `serviceWorker: { url: \`${import.meta.env.BASE_URL}mockServiceWorker.js\` }` to `worker.start()`. The default registration at `/mockServiceWorker.js` will 404 silently and MSW will no-op every request, masquerading as "the backend doesn't respond."

**Why.** MSW's `worker.start()` registers the service worker at `/mockServiceWorker.js` by default. On a sub-path deploy, the file is served under the base prefix (e.g. `/unipay-dashboard/mockServiceWorker.js`) but the registration call hits the unprefixed root. The 404 is silent — no thrown error, no console scream — the worker just never registers, and every `fetch` falls through to the real network. Symptoms look identical to "the backend isn't responding" (because there isn't one), which is exactly the bug the user reported on the Pages deploy.

**How to apply.** Reference: [`src/main.tsx`](../src/main.tsx). Any time someone bumps `vite.config.ts` `base` away from `/`, or adds a new MSW-using build target, audit `worker.start()` for the `serviceWorker.url` arg. Also worth knowing: for demo / preview deploys, gate MSW behind a `VITE_USE_MOCKS` env flag (default true in dev + preview, false in real prod) — never use `import.meta.env.DEV` as the gate because it doesn't survive a preview deploy. See DECISIONS 2026-05-11 "MSW ships in production builds".

---

## 2026-05-11 · Tap-to-copy rows — canonical pattern (haptic + icon-swap + sr-only live region + fallback)

**Rule.** Any "tap to copy" affordance — bank details, transaction IDs, reference codes, API keys, etc. — follows this pattern:
- **Element**: `<button>` (not a `<div role="button">`) so keyboard + screen-reader behavior is built-in.
- **Clipboard write**: `await navigator.clipboard.writeText(value)`; on failure or when `navigator.clipboard` is undefined (non-secure context), fall back to a hidden `<textarea>` + `document.execCommand('copy')` so the feature works on `http://localhost` and inside legacy WebViews.
- **Haptic**: `if (typeof navigator.vibrate === 'function') navigator.vibrate(10)` — feature-detected so desktop / unsupported mobile silently skip.
- **Visual feedback**: trailing icon swaps `Copy → Check` (use `text-success-700`) for **1500ms**. Store the timer in a `useRef` and clear it on unmount and on subsequent copies.
- **Toast**: sonner `toast.success(t('common.actions.copied'))`. Don't invent a new key — `common.actions.copy` / `common.actions.copied` already exist in both RU + UZ.
- **Screen reader**: `aria-label` on the button combines verb + label + value, e.g. `Скопировать: МФО, 00440`. Add an inline `<span className="sr-only" role="status" aria-live="polite">{copied ? t('common.actions.copied') : ''}</span>` so the success state is announced after the click.

**Why.** Built once, copy-paste-able everywhere. The fallback matters for dev/preview environments where the secure-context check fails. The 1500ms timer beats both a flash-and-gone (too quick to read) and a sticky check (confuses the next interaction). The aria-live announcement is what turns a silent-success animation into something a screen-reader user actually perceives.

**How to apply.** Reference implementation: [`BankAccountFormParts.tsx`](../src/features/organization/components/BankAccountFormParts.tsx) → `CopyableRow`. When the next feature needs a copyable identifier (Transaction ID, Payout reference, API key fingerprint), copy that component or promote it to `src/components/shared/` first — DO NOT re-derive the pattern from scratch.

---

## 2026-05-11 · `overflow-y-auto` clips the input focus ring on the horizontal axis — outset the scroll wrapper with `-mx-1 px-1`

**Rule.** Any scroll container that wraps form inputs must carry `-mx-1 px-1` (and `-my-1 py-1` if vertical edges are also at the clip line). The negative margin pulls the scroll boundary 4px past the parent's content edge while the inner padding restores the visual content position. Without this, inputs whose `focus-visible:ring-2 ring-offset-2` halo sits 4px outside the input box get their ring clipped along whichever container edge is nearest.

**Why.** Per the CSS spec, when one of `overflow-x` / `overflow-y` is `auto` and the other is `visible`, the visible axis is computed to `auto`. So a `overflow-y-auto` wrapper implicitly clips horizontally too — even when content doesn't actually overflow horizontally. User flagged this directly: focus rings on inputs inside the Bank Account add Sheet were invisible because the scroll wrapper's horizontal clip line bisected the ring.

**How to apply.** Every internal scroll container — `ResponsiveSheet`'s middle slot, `DepartmentDetailPanel`'s form body, `DepartmentTree`'s tree list, future feature pages with their own scroll — carries `-mx-1 px-1 -my-1 py-1` (or just the horizontal pair if vertical edges are far from any input). 4px on each side covers `ring-2` (2px ring) + `ring-offset-2` (2px gap). Don't bump the input's own ring offset to 0 — that changes the design system; outset the wrapper instead.

---

## 2026-05-11 · Nested flex-col `overflow-y-auto` needs a `min-h-0` chain on every `flex-1` ancestor

**Rule.** When `overflow-y-auto` lives on a `flex-1` child inside a `flex flex-col` parent, every `flex-1` ancestor in the chain back to a definite-height container must also carry `min-h-0`. Without it, flex's default `min-height: auto` lets the child grow to fit its content rather than be constrained to the remaining space — and `overflow-y-auto` never engages because there's nothing to overflow.

**Why.** Flex containers have an automatic minimum size equal to their content size, which means a `flex-1` child can grow past its allocated proportion. The `min-h-0` override lets the child be smaller than its content, which is what triggers the overflow. User reported "not all overflowed elements are scrolling" — root cause was the Sheet's middle wrapper had `flex-1` but the form's scroll container inside couldn't actually scroll because the flex calculation never produced a height constraint.

**How to apply.** Pattern for a Sheet/Dialog with scrollable middle:
```
<Container className="flex max-h-[90dvh] flex-col">
  <Header className="shrink-0" />
  <ScrollWrapper className="min-h-0 flex-1 overflow-y-auto -mx-1 px-1">
    {form}
  </ScrollWrapper>
  <Footer className="shrink-0" />
</Container>
```
Same pattern for the form itself if it has its own flex-col with a scrollable body (e.g. `DepartmentDetailPanel` has `<form className="flex h-full min-h-0 flex-col">` so its `flex-1 overflow-y-auto` field area engages).

---

## 2026-05-11 · `@dnd-kit` PointerSensor needs `delay`-based activation for touch UX

**Rule.** For drag-drop surfaces that coexist with scrollable content on touch devices, use `useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 8 } })`. Long-press starts the drag; quick taps and scroll gestures don't fire spurious drags.

**Why.** The default `distance`-based activation (e.g. `{ distance: 4 }`) fires the moment a pointer moves 4px in any direction — which is exactly what happens during a finger scroll on touch. Result: every attempt to scroll the Departments tree on mobile triggered a drag instead. `delay`-based activation makes touch scroll the default and explicit long-press the drag affordance.

**How to apply.** Any new dnd-kit surface in this codebase uses the delay-based constraint. `KeyboardSensor` stays default-configured for a11y. `tolerance: 8` allows a small finger jitter during the 250ms hold window without canceling the drag.

---

## 2026-05-11 · Add/Create flows are standalone pages — Sheets/Dialogs reserved for edit + confirm + small-scope pickers

**Rule.** Any user-facing "Add X" / "Create X" / "New X" flow in this app renders as a standalone page route, not a `<Dialog>` / `<Sheet>` / `<ResponsiveSheet>`. Edit flows stay in Sheets (short, contextual, near the row being edited). Confirms stay in `<ConfirmDialog>`. Small pickers (color, date, tree-node) stay in Popovers.

**Why.** Create forms accrete fields over time. A 3-field add-department dialog becomes a 7-field form once "head of staff Combobox" and "payment types Checkbox group" and "notes Textarea" land. Modal layouts with nested scroll degrade UX (focus-ring clipping, sticky-footer fragility, no shareable URL for in-progress state, no browser back). Pages give shareable URLs (e.g. `?parentId=X` for "add child"), browser-native back, and a clean §0.5 Pattern A action bar. User explicitly confirmed this convention after the org module shipped.

**How to apply.** Register the add page as a **sibling** of the parent layout route, not a child — so the layout's chrome (tabs, etc.) doesn't render on the add page. The back link is the only orientation chrome needed. Use §0.5 Pattern A: `<BackLink to="…" pluralName="…" />` row → `text-page-title` heading → form (`max-w-2xl space-y-4`) → fixed-bottom action bar (`fixed inset-x-0 bottom-0 … md:left-[var(--sidebar-width,4rem)]`) with Cancel + WriteButton-Save (full-width `flex-1` on mobile, right-aligned content-sized on `md+`). Page wrapper gets `pb-28` to clear the bar at full scroll.

---

## 2026-05-10 · Never run `git add` / `git commit` / `git push` without an explicit `/commit` invocation

**Rule.** Write file changes, run verifications (typecheck, lint, build, audit), and stop. Do not stage, commit, or push until the user runs `/commit` or explicitly says "commit and push." This holds even after small follow-up fixes that feel obviously safe to land.

**Why.** The user wants to review every batch of changes before they hit the remote. Self-driving the commit pipeline removes the review step and produces commits the user didn't sign off on. They flagged this directly after a sequence where I committed and pushed three follow-up changes (tsconfig fix → vite base + workflow → README) without being asked.

**How to apply.** After any code change, end the turn at "verifications clean, ready to commit when you run `/commit`." Never chain `git add`/`git commit`/`git push` into the same response as the file edits unless the user has just invoked `/commit` or said the word "commit." If unsure, ask.

---

## 2026-05-10 · Active sidebar items keep `font-medium` (500) — never escalate to `font-semibold` on active

**Rule.** A sidebar nav-link's active state is signalled by `bg-brand-50` + `text-brand-700` + the 2px `before:` accent stripe. Font-weight stays at `font-medium` (500) for both resting and active items.

**Why.** Bumping the active item to `font-semibold` (600) reflows the row width slightly and breaks the vertical rhythm of the list — the user explicitly called this out as wrong. The colour shift is already a strong visual signal.

**How to apply.** Whenever you write or edit a `<NavLink>`'s active className, do not include `font-semibold`. Same goes for any tab strip or stepper that uses an active-bg pattern.

---

## 2026-05-10 · Sidebar items are flex rows with `leading-none` — icon and label always share one baseline

**Rule.** Every sidebar nav-link is `flex h-10 items-center gap-2.5 leading-none` (or `h-9 leading-normal`, but always `flex items-center`). The icon (`size-4` or `size-[18px] shrink-0`) sits to the left of a `<span class="truncate">` label. No vertical stacking, no `flex-col` fallbacks.

**Why.** The user pointed out the icon was visually offset from the label. The cause was the row's default line-height stretching the text box past the icon's bounding box. `leading-none` locks them.

**How to apply.** New sidebar items, mobile sheet items, command palette items: always render `<Icon />` + `<span>` side by side inside `flex items-center`. Never `<div className="flex-col">{icon}{label}</div>` for nav surfaces.

---

## 2026-05-10 · §0.9 audit greps don't distinguish code from comments — describe forbidden patterns without using their literal tokens

**Rule.** Don't write `<svg>` or `→` inside a code comment. Replace with prose: "the SVG element" / "right-arrow character". Same for `sticky.*thead`.

**Why.** The `git grep '<svg'` audit fired on a comment that said "Recharts renders SVG internally — we never write `<svg>` in source." The pattern matched. Same trap with Unicode arrows and "no sticky `<thead>` rule" comments.

**How to apply.** Run [`scripts/audit-discipline.sh`](../scripts/audit-discipline.sh) before claiming a §0.9 audit pass. If a hit lands inside a comment, rewrite the comment in plain prose rather than disabling the grep.

---

## 2026-05-10 · Data-viz primitives use Recharts (or another wrapper) — never write `<svg>` in source

**Rule.** `Sparkline`, charts, micro-trend visuals all render through Recharts (`<LineChart>`, `<BarChart>`, etc.). Source code never contains a literal `<svg>` element.

**Why.** §0.9 forbids inline `<svg>` for icons and the audit grep is library-agnostic. The rule's intent is "no hand-rolled vector authoring in source"; data viz built on Recharts respects that — the SVG is rendered internally by the library, not authored by us.

**How to apply.** Need a chart? Reach for Recharts first. Need a status dot, illustration, or pictogram? Use `lucide-react`. Need a micro-line trend? Wrap a Recharts `<LineChart>` in a fixed-size div, like `Sparkline.tsx`.

---

## 2026-05-10 · `<main>` is full-bleed — max-width caps live on an inner `<div>`

**Rule.** Inside `<AppShell>`, `<AuthLayout>`, `OnboardingLayout`, `LockedLayout` — `<main>` carries padding only. If a page needs a max-width container, wrap an inner `<div className="mx-auto max-w-3xl">` around the content.

**Why.** §0.3 says admin reviewers process volume on ultrawide displays. The audit grep `max-w-.*main|main.*max-w` will fire. Putting the cap inside the main keeps the audit clean and gives surfaces the option to opt out per-page.

**How to apply.** Whenever creating a new layout component, structure as `<main className="px-4 py-8 md:px-6"><div className="mx-auto max-w-3xl">...</div></main>`. Never `<main className="mx-auto max-w-3xl ...">`.

---

## 2026-05-10 · `text-xs` (13px) is allowed in 5 specific categories — audit each hit before "fixing" it

**Rule.** §0.2 allow-list for `text-xs`:
1. Chip / badge bodies (`StatusBadge`, `RoleBadge`, `ChannelBadge`, scheme chips).
2. Tooltip body.
3. `<kbd>` keyboard hints.
4. Avatar fallback initials.
5. Uppercase + tracking-wider category labels (sidebar section headers, KPI labels, definition labels).

Anything else is forbidden — buttons, table cells, meta lines, breadcrumbs, etc. all use `text-sm` minimum.

**Why.** The audit grep `git grep -nE 'text-xs' src/` will return many hits. Treating them all as violations causes time-wasting "fixes" to legitimate uses. The audit is "audit each hit", not "all hits are bad".

**How to apply.** When `text-xs` shows up in the grep, classify the hit against the 5 categories above. Only if it doesn't fit, refactor.

---

## 2026-05-10 · For app-wide state with DOM side effects or cross-tab sync, prefer `useSyncExternalStore` over Zustand

**Rule.** Module-level state that (a) needs to apply DOM side effects at first paint (`data-density` on `<html>`), (b) syncs across tabs via the `storage` event, or (c) must be readable outside React (`getNetworkState()` for ancestors of `WriteButton`) — use `useSyncExternalStore` with a module-level cache + listener set + `storage` listener. Zustand stays for ephemeral UI state.

**Why.** Zustand's `persist` middleware writes async; first paint can flicker the wrong density. Cross-tab sync via Zustand requires extra wiring. The vanilla `useSyncExternalStore` pattern handles all three concerns cleanly with no library.

**How to apply.** New stores in this app: preferences, maintenance, auth, network — all `useSyncExternalStore` per the pattern in [`lib/preferences.ts`](../src/lib/preferences.ts). New ephemeral UI state (modals, transient flags) can still use Zustand or `useState`.

---

## 2026-05-10 · UserMenu lives in the TopBar — never duplicate it inside the Sidebar

**Rule.** The sidebar's bottom rail carries only the collapse-toggle chevron. The user identity + actions (settings, shortcuts, sign-out) live in a `<DropdownMenu>` triggered by an avatar-only icon button on the right side of the TopBar.

**Why.** The user explicitly moved the UserMenu from sidebar to topbar. Sidebar bottom is precious vertical space; mixing nav controls and identity controls there confuses the visual hierarchy.

**How to apply.** Any future iteration that adds account-level affordances (notifications, theme, language, avatar) places them in the TopBar's right cluster, not the sidebar. The sidebar bottom only ever holds the collapse toggle.

---

## 2026-05-10 · Card padding is `p-5` everywhere (Header / Content / Footer) — not `p-6`

**Rule.** `<CardHeader>` `p-5`, `<CardContent>` `p-5 pt-0`, `<CardFooter>` `p-5 pt-0`. Same applies to standalone `<Card>` blocks that hold a single section.

**Why.** ZhiPay's reference rhythm; the looser `p-6` (24px) drift makes tables-in-cards feel under-dense for fintech reviewers and bumps every page taller than it needs to be.

**How to apply.** Any new Card primitive override or one-off card uses `p-5`, not `p-6`. Cross-cutting updates that affect Card padding go through `components/ui/card.tsx`, never via `className="p-6"` overrides on consumers.

---

## 2026-05-10 · Button default is `h-9`, sm `h-8`, lg `h-10`, icon `h-9 w-9` — match table-row rhythm

**Rule.** The default Button height is 36px (`h-9`), aligning with `<TableHead>` height and the standard tabular row at compact density (`--row-h: 40px`). Inputs, Selects, Tabs trigger, Toggle defaults all match.

**Why.** A 40px button next to a 40px table row felt visually heavy when both rendered in the same toolbar. ZhiPay's tighter 36px feels right with the table density.

**How to apply.** Don't override Button height per-instance unless the surface explicitly asks for it. Form rows that mix Input + Button + Select land at `h-9` consistently — easier to scan, less vertical drift.

---

## 2026-05-10 · Token system is layered — add scale ramps additively, keep semantic aliases pointing into them

**Rule.** When introducing a new token system (or extending one), add new tokens *alongside* the old. Re-route the old semantic aliases to point into the new ramps via `var(--brand-50)` etc. Don't do a hard cutover.

**Why.** A wide refactor that renames every `bg-primary-light` to `bg-brand-50` simultaneously breaks every consumer file. Re-routing the alias to point at the new scale value keeps the old class strings working while new code can opt into the canonical token.

**How to apply.** When the next token rev lands, add the new vars + Tailwind colors first, then re-point legacy aliases to the new vars in the same PR. Migration of consumers is a separate cleanup pass.

---

## 2026-05-10 · macOS filesystem is case-insensitive — `Topbar.tsx` and `TopBar.tsx` are the same file

**Rule.** Don't rely on filename case for distinct files. The exported component name controls the import name. If a spec asks for `TopBar.tsx`, the file on disk can be `Topbar.tsx` and `import { TopBar } from './Topbar'` works.

**Why.** A `Write` to `TopBar.tsx` after the file already exists as `Topbar.tsx` triggers "File has not been read yet" because the harness keys by exact path. The actual file content is in `Topbar.tsx`.

**How to apply.** Stick with whatever case is already on disk. Don't try to `mv Topbar.tsx TopBar.tsx` — git treats it as no-op on case-insensitive FS, and the rename can ghost the file in CI on case-sensitive Linux.

---

## 2026-05-10 · Surfaces outside `<AppShell>` (sign-in, full-bleed system states) need their own `<TooltipProvider>`

**Rule.** `<AuthLayout>` wraps its content in `<TooltipProvider delayDuration={200}>`. Any surface that renders outside the AppShell tree must do the same — otherwise tooltips throw "must be used inside `<TooltipProvider>`".

**Why.** AppShell hoists the TooltipProvider as its outermost element. Sign-in and full-bleed system states live in their own subtree (`AuthLayout`), so they don't inherit it.

**How to apply.** New full-bleed surfaces: wrap them in `AuthLayout` (which already provides Tooltip context) rather than rolling chrome from scratch.

---

_(Add new entries above this line.)_
