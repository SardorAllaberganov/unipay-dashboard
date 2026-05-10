# LESSONS.md — UNIPAY Merchant Dashboard

Append-only rules learned from user corrections and validated approaches. **Phrased as rules, not recaps.** Lead with the rule, then `Why:` and `How to apply:` lines.

Review at session start (or via `/start_task`). Most recent on top.

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
