# HISTORY.md — UNIPAY Merchant Dashboard

Append-only log of major changes. Most recent on top.

---

## 2026-05-11 — Prompt 4 (Organization module) + mobile fixes + addition pages refactor

**Summary.** Full Organization module — 4 sub-routes (Profile / Departments / Bank Accounts / Branding) under `/organization/*` via nested `<OrganizationLayout />` + horizontal-scroll `OrgTabsNav`. MSW handler with 16 endpoints and a 111-node fixture tree (3 faculties × 4 departments × 2 years × 3 groups = 72 leaves + 39 inner). Departments page uses `@dnd-kit/core` for drag-drop reparent with cycle prevention, reparent-confirm requiring reason ≥20 when affected students > 50, cascade-delete with reason ≥20 when children exist. Bank Accounts page has optimistic create + 5s server-side verification flip + exclusive default. Branding page applies the saved primary color inline on the receipt preview only (never `:root`). `LogoUploader` / `ColorPicker` / `ReceiptPreview` promoted from onboarding to `src/components/shared/`. Followed by two mid-session refactors: (1) mobile fixes — hidden action icons on mobile (44px tap targets via the row itself), delay-based touch activation for dnd-kit, `min-h-0` chain so `overflow-y-auto` actually engages, focus-ring outset (`-mx-1 px-1`) on every scroll wrapper since `overflow-y-auto` implicitly forces `overflow-x: auto` per CSS spec and clips `ring-offset-2`; (2) addition pages refactor — `<BankAccountForm>` add mode and `<AddDepartmentDialog>` retired in favor of standalone routes `/organization/bank-accounts/new` and `/organization/departments/new[?parentId=X]`, registered as siblings of `<OrganizationLayout>` so they render full-bleed without tabs. Both use §0.5 Pattern A (back link + page title + fixed-bottom action bar).

**Files written.**
- New module: [`src/features/organization/`](../src/features/organization/) — 7 pages (`OrganizationLayout`, `ProfilePage`, `DepartmentsPage`, `BankAccountsPage`, `BrandingPage`, `AddBankAccountPage`, `AddDepartmentPage`), 7 components (`OrgTabsNav`, `DepartmentTree`, `DepartmentNode`, `DepartmentDetailPanel`, `BankAccountCard`, `BankAccountForm` edit-only Sheet, `BankAccountFormParts` shared pickers), 8 hooks (`useOrganization` / `useUpdateOrganization` / `useBranding` / `useUpdateBranding` / `useBankAccounts` / `useBankAccountMutations` / `useDepartments` w/ `buildTree` + `descendantIds` / `useDepartmentMutations`), `schemas.ts` (profile · branding · bankAccount · department factories), `api.ts`.
- New MSW: [`src/mocks/handlers/organization.ts`](../src/mocks/handlers/organization.ts) — 16 endpoints, TATU org seed, deterministic 111-node tree, 2 bank accounts, server-side `setTimeout(5000)` verification flip survives navigation since the store is module-level. Registered in [`mocks/handlers/index.ts`](../src/mocks/handlers/index.ts).
- Promoted to `src/components/shared/`: [`LogoUploader.tsx`](../src/components/shared/LogoUploader.tsx) (now takes `labels` prop + `maxSizeBytes` + `minDimensions` + `accept`), [`ColorPicker.tsx`](../src/components/shared/ColorPicker.tsx), [`ReceiptPreview.tsx`](../src/components/shared/ReceiptPreview.tsx) (i18n keys moved to `common.receipt.*`).
- Modified: [`src/types/domain.ts`](../src/types/domain.ts) (`Organization`, `Branding`, `LegalForm`, `OrgType`, `ORG_TYPES`, `LEGAL_FORMS` — onboarding schemas re-export the two enums for back-compat), [`src/router.tsx`](../src/router.tsx) (replaced `/organization` Placeholder with the nested `<OrganizationLayout>` route + 4 child routes + 2 sibling add-page routes; new imports), [`src/features/onboarding/schemas.ts`](../src/features/onboarding/schemas.ts) (re-routes `ORG_TYPES` / `LEGAL_FORMS` to domain.ts), [`src/features/onboarding/pages/Step2ContactBranding.tsx`](../src/features/onboarding/pages/Step2ContactBranding.tsx) (imports updated; `LogoUploader` consumer passes new `labels` prop; receipt-preview key references switched to `common.receipt.*`), [`src/components/shared/ResponsiveSheet.tsx`](../src/components/shared/ResponsiveSheet.tsx) (both branches now `flex max-h-[…] flex-col` with `shrink-0` header/footer + `min-h-0 flex-1 overflow-y-auto py-* -mx-1 px-1` body), [`src/lib/i18n/locales/{ru,uz}.json`](../src/lib/i18n/locales/) (full `organization.*` namespace + `common.receipt.*` migration + per-page `addPageTitle` + `backPlural` keys), [`package.json`](../package.json) (3 new `@dnd-kit/*` deps).
- Deleted: `src/features/organization/components/AddDepartmentDialog.tsx` (replaced by the page), `src/features/onboarding/components/{LogoUploader,ColorPicker,ReceiptPreview}.tsx` (promoted to shared).

**Deviations logged.**
- "Add flows are standalone pages, not Dialogs/Sheets" — overrides Prompt 4's "Sheet form" / "AddDepartmentDialog" wording. Permanent product convention; edit stays in a Sheet.
- Cross-feature import of `PanelStates` from `features/dashboard/components/` and `BankCombobox` from `features/onboarding/components/` — both flagged for promotion to `shared/` before Prompt 5.

**Verifications.** typecheck · `eslint --max-warnings 0` · `vite build` — all clean across every checkpoint. §0.9 audit greps over new files: `text-xs` / `<svg` / Unicode arrows / `sticky.*thead` / `h-screen` / `max-w` on `<main>` / `text-[10–12px]` — all zero. Brand-color `:root` audit (`grep -rE "documentElement\.style|setProperty.*brand|--brand-"` in org + shared files): zero hits — acceptance passes by construction. Dev server boots HTTP 200.

**Lessons (appended to LESSONS.md).**
- `overflow-y-auto` implicitly forces `overflow-x: auto` per CSS spec, which clips the input's 4px-outside focus ring. Use the `-mx-1 px-1` outset pattern on every internal scroll wrapper (pulls the clip line 4px past the visual content edge).
- Nested flex-col scroll containers need a `min-h-0` chain. Every `flex-1` ancestor of an `overflow-y-auto` child must carry `min-h-0` — without it, the flex calculation lets the child grow to fit its content rather than be constrained to remaining space.
- For touch ergonomics in `@dnd-kit/core`, use `useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 8 } })`. `distance`-based activation competes with scroll on touch and fires spurious drags during page scroll.
- Add/Create flows go to standalone pages by default; Sheets/Dialogs are reserved for edit + confirm + small-scope pickers. Shareable URLs + browser back + clean §0.5 Pattern A action bar beat nested-scroll modal layouts as soon as a form crosses ~4 fields.

---

## 2026-05-11 — Dashboard polish + datepicker bug fixes

**Summary.** A cluster of late-day fixes after Prompt 3 landed and the DateRangePicker rewrite went in: KPI hero typography made responsive so full UZS amounts don't clip; datepicker trigger bug that prevented the popover from opening; Revenue chart Y-axis labels that were clipped behind the chart; KPI grid stack changed to 1-per-row on phones.

**Files written.**
- Modified: [`src/features/dashboard/components/KpiCard.tsx`](../src/features/dashboard/components/KpiCard.tsx) — hero number `truncate text-3xl ... leading-none` → `text-2xl ... leading-tight md:text-3xl md:leading-none`. Removing `truncate` lets the number wrap at the existing UZS thousand-space separators on tight mobile widths; bumping down to `text-2xl` on `<md` keeps it on one line in most cases. Logged in [`DECISIONS.md`](../docs/DECISIONS.md) (2026-05-11 KPI hero entry).
- Modified: [`src/features/dashboard/components/KpiRow.tsx`](../src/features/dashboard/components/KpiRow.tsx) — grid `grid-cols-2 lg:grid-cols-4` → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. User report: 2-column mobile felt cramped even with the responsive hero. New stack: 1-col `<sm`, 2-col `sm–lg`, 4-col `lg+`. Loading skeleton row updated to match.
- Modified: [`src/features/dashboard/pages/DashboardPage.tsx`](../src/features/dashboard/pages/DashboardPage.tsx) — inlined the `<Button>` trigger as the direct child of `<DateRangePicker>` (instead of an intermediate `<DateRangeTrigger />` function component). Radix `PopoverTrigger asChild` uses `Slot`, which can't forward ref/onClick through a function component that doesn't itself forward them — symptom: the popover silently never opened. The `useDateRangeLabel(value)` hook now runs in `DashboardPage` and its result is passed into the trigger directly.
- Modified: [`src/features/dashboard/components/RevenueChart.tsx`](../src/features/dashboard/components/RevenueChart.tsx) — `<YAxis width={48}>` → `width={72}`. Localized compact labels like `200 млн` are roughly 50-55px wide at `fontSize 13`, so the prior 48px reservation clipped them. Default Recharts width (60) was also borderline.

**Verifications.** typecheck · `eslint --max-warnings 0` · `vite build` — all clean.

**Lessons.**
- **Radix `asChild` clones the immediate child JSX element** — when that JSX is `<MyComponent />`, the merged props (onClick, ref, etc.) land on `MyComponent` and only reach the DOM if the component spreads/forwards them. The cheapest fix is inlining the underlying element (shadcn's `Button` already forwards ref) so `Slot` clones directly. The wrapper-component pattern works only if the wrapper uses `React.forwardRef` and spreads `...props`.
- **Recharts `<YAxis width>` doesn't auto-grow to fit the formatted tick label.** When using `tickFormatter` with locale-aware compact (`200 млн`, `1,5 млрд`), set `width` explicitly to accommodate the longest label at the chosen `tick.fontSize`. Cyrillic + space + suffix tends to need 70-80px at `fontSize 13`.
- **For volume-tolerant KPI cards on mobile, 1-per-row beats 2×2.** The 2×2 mobile layout from the original Prompt 3 spec felt cramped under realistic UZS amounts; making each card full-width gives the responsive hero typography enough room to breathe and renders the sparkline at full card width as a nice side effect.

---

## 2026-05-11 — DateRangePicker — adopt ZhiPay sidebar + dual-calendar + apply/cancel format

**Summary.** Replaced the inline pill-row + popover calendar from Prompt 0 with the ZhiPay-style panel: quick-select sidebar (Today / Yesterday / Last 7 days / Last 30 days / Custom) on the left, two-month calendar with custom prev/next header bar on the right, and a footer carrying the resolved `from – to` summary + Cancel / Apply buttons. Apply commits — selections don't fire until the user clicks Apply. Mobile (below 768px) collapses to a single month and stacks the sidebar above the calendar.

**API shape change.** The picker now takes `value: DateRangeValue` (a `{ range: 'today' | 'yesterday' | '7d' | '30d' | 'custom', customFrom?, customTo? }` discriminated union) instead of `{ from, to }`. Consumers receive named preset semantics for free (so "today" stays "today" across midnight rollovers instead of drifting). A `resolveDateRange(value)` helper computes the concrete `{ from, to }` for calendar highlighting and API filtering. A `useDateRangeLabel(value)` hook returns the localized trigger label. The trigger is passed as `children` via `asChild` so consumers control the button visual.

**Files written.**
- New: [`src/components/shared/dateRange.ts`](../src/components/shared/dateRange.ts) — types + `resolveDateRange()` + `useDateRangeLabel()`. Split into a sibling file so the component file stays "components only" for `react-refresh/only-export-components`.
- Modified: [`src/components/shared/DateRangePicker.tsx`](../src/components/shared/DateRangePicker.tsx) — rewritten end-to-end to match the ZhiPay layout (sidebar `md:w-[210px]` + dual-month calendar + footer apply/cancel). Custom month-header bar with `<ChevronLeft />` / `<ChevronRight />` chevron buttons. Hides the Calendar primitive's built-in `nav` and `caption_label` via `classNames` overrides so the custom header is the only nav surface.
- Modified: [`src/features/dashboard/pages/DashboardPage.tsx`](../src/features/dashboard/pages/DashboardPage.tsx) — state migrated to `DateRangeValue` (default `30d`). URL sync persists `?range=<key>` for presets and adds `&from=&to=` only when `range=custom`. `apiRange` derives via `resolveDateRange()`. Renders an `<DateRangeTrigger />` `Button` as the picker's child with calendar icon + label from `useDateRangeLabel`.
- Modified: [`src/lib/i18n/locales/{ru,uz}.json`](../src/lib/i18n/locales/) — new `common.daterange.{title,quick-select,today,yesterday,7d,30d,custom,cancel,apply,prevMonth,nextMonth}` namespace.

**Verifications.** typecheck · `eslint --max-warnings 0` · `vite build` · §0.9 audit (sole `text-xs` hit is the "Быстрый выбор" `uppercase tracking-wider` section header — allow-listed §0.2) — all clean.

**Lessons.**
- `react-refresh/only-export-components` flags helper functions and hooks sharing a file with components, even via re-exports. The fix is splitting helpers into a sibling `.ts` file and importing them explicitly — re-exporting from the component file doesn't satisfy the rule. Cost: one extra import per consumer; benefit: fast refresh keeps working.
- For date-range pickers, storing the preset key (`'today' | '7d' | 'custom'`) rather than the resolved `{from, to}` is the right primitive — it keeps semantics stable across day boundaries and gives consumers a free badge label without reverse-deriving "is this 7 days back from today?" by inspecting timestamps.
- shadcn's Calendar component (wrapping react-day-picker) supports custom `month` + `onMonthChange` controlled props; hiding the built-in `nav` via `classNames: { nav: 'hidden' }` lets you swap in a custom header bar without forking the primitive.

---

## 2026-05-11 — Onboarding — global Skip Setup affordance

**Summary.** Onboarding wizard's 5-step / many-field flow was too long; added a "Пропустить" ghost button to the sticky step-indicator bar so it's visible on every step. Click → `ConfirmDialog` ("Можно настроить позже в разделе «Организация».") → reuses [`useOnboardingComplete`](../src/features/onboarding/hooks/useOnboardingComplete.ts) mutation + `updateUser({ onboardingComplete: true })` + sonner success toast + `navigate('/')` (the same finish-path Step 5 uses). No data persisted beyond what the user already saved as draft.

**Files written.**
- New: [`src/features/onboarding/components/SkipSetupButton.tsx`](../src/features/onboarding/components/SkipSetupButton.tsx) — encapsulates the button + dialog + mutation. Lives next to the `StepIndicator` in `OnboardingLayout`'s sticky bar.
- Modified: [`src/features/onboarding/components/OnboardingLayout.tsx`](../src/features/onboarding/components/OnboardingLayout.tsx) — wraps the indicator + skip button in `flex items-start justify-between gap-3`. Indicator stays `min-w-0 flex-1` so its progress segments still grow into available width; the ghost button sits right-aligned.
- Modified: [`src/lib/i18n/locales/{ru,uz}.json`](../src/lib/i18n/locales/) — new `onboarding.skipSetup.{action,title,body,confirm,toast}` namespace.

**Verifications.** typecheck · `eslint --max-warnings 0` · `vite build` · §0.9 audit — all clean.

**Lessons.**
- Discoverability beats step-1-only for opt-out actions. A user 80% through a wizard might still want out; gating the bail behind a confirm dialog gives the right friction without making the user back-navigate to find the escape hatch.
- Reusing the existing finish-path (complete mutation + `updateUser` + navigate) keeps the skip flow isomorphic to Step 5's "no invites" finish — same toast, same redirect, same backend signal. No new MSW endpoint needed.

---

## 2026-05-11 — Prompt 3 (Dashboard Home) — KPIs, charts, recent activity

**Summary.** First real feature page on top of the foundation. Replaces the placeholder Dashboard at `/` with a full dashboard: dynamic greeting (Tashkent timezone), `<DateRangePicker>` URL-synced via `?from=&to=`, 4 KPI cards (Total Received / Pending / Overdue / Last Payout) with deltas + 7-day area sparklines, two charts (BarChart D/W/M with count↔amount toggle + Donut status breakdown with center label + legend), two list panels (Recent Transactions + Unpaid Students with bulk-remind WriteButton → destructive ConfirmDialog ≥ 20-char reason note → MSW success → toast). Every panel renders all 6 states (§0.8): loading skeleton, empty, error+retry, offline (no-cache fallback), offline-note (banner above stale data), partial (banner with shown/total), data.

**Files written.**
- New module: [`src/features/dashboard/`](../src/features/dashboard/) — `api.ts` (typed fetch wrappers, response `_meta` shape), `pages/DashboardPage.tsx`, 6 hooks (`useDashboardSummary`, `useRevenueSeries`, `usePaymentStatusBreakdown`, `useRecentTransactions`, `useUnpaidStudents`, `useBulkRemindUnpaid`), 9 components (`KpiSparkline`, `KpiCard`, `KpiRow`, `RevenueChart`, `PaymentStatusChart`, `RecentTransactions`, `UnpaidStudents`, `GreetingTitle`, `PanelStates`).
- New MSW: [`src/mocks/handlers/dashboard.ts`](../src/mocks/handlers/dashboard.ts) — 6 endpoints + deterministic 240-student seed (mulberry32 PRNG, 3M–8M UZS tuitions, Payme-dominant channel mix, 65/20/15 paid/pending/overdue split). Honors `?_state=partial|empty|error` so each panel's 6-state coverage is QA-reproducible. Registered in [`src/mocks/handlers/index.ts`](../src/mocks/handlers/index.ts).
- New helpers: [`src/lib/greeting.ts`](../src/lib/greeting.ts) — `getGreetingKey()` reads Tashkent hour via `Intl.DateTimeFormat`, returns `'morning' | 'day' | 'evening'`.
- Modified: [`src/components/shared/ConfirmDialog.tsx`](../src/components/shared/ConfirmDialog.tsx) (default `minReasonLength` 10 → 20 per §0.9 v2.0; new `reasonPlaceholder` prop; i18n-driven label via `common.reasonLabel` ICU); [`src/router.tsx`](../src/router.tsx) (`/` now mounts `<DashboardPage />`); [`src/components/unipay/index.ts`](../src/components/unipay/index.ts) (drops orphan Sparkline re-export); [`src/lib/i18n/locales/{ru,uz}.json`](../src/lib/i18n/locales/) (full `dashboard.*` namespace + `common.reasonLabel/reasonPlaceholder` + `common.states.{errorTitle,errorBody,partialNote,slowNote,offlineNoCache}`); [`docs/DECISIONS.md`](../docs/DECISIONS.md) (two deviations logged: route choice + ConfirmDialog threshold bump).
- Deleted: `src/pages/Dashboard.tsx` (placeholder retired), `src/components/shared/KpiCard.tsx` (legacy — only consumer was the placeholder), `src/components/shared/Sparkline.tsx` (legacy LineChart variant — Dashboard now uses Recharts `AreaChart` in `KpiSparkline`).

**Layout details.**
- Mobile 2×2 KPI grid → `lg:grid-cols-4`. Charts row: full-width stack → `lg:grid-cols-3` with RevenueChart `lg:col-span-2`. Panels row: full-width stack → `lg:grid-cols-2`.
- DateRangePicker writes `?from=YYYY-MM-DD&to=YYYY-MM-DD` to the hash route, hooks read those as ISO strings and pass to MSW.
- GreetingTitle re-evaluates at each hour boundary via `setTimeout(msUntilNextHour)` so the greeting flips without a reload.
- 6-state primitives: `KpiCardSkeleton`, `ChartSkeleton`, `ListRowSkeleton`, `PanelErrorState`, `PanelEmptyState`, `PanelOfflineState` (no-cache), `PanelOfflineNote` (banner above stale data), `PanelPartialNote` (shown/total banner). Live under [`src/features/dashboard/components/PanelStates.tsx`](../src/features/dashboard/components/PanelStates.tsx).

**Verifications.** typecheck · `eslint --max-warnings 0` · `vite build` · §0.9 audit greps — all clean. Dev server boots clean (port 5175). Recharts is the only chart library used; no hand-authored vector markup in source. `text-xs` hits inside the module map to allow-list items (§0.2 KPI category labels + avatar fallback initials).

**Deviations logged.**
- `/` (not `/dashboard`) — same rationale as the 2026-05-10 Auth deviation; only one home route exists.
- ConfirmDialog default `minReasonLength` raised 10 → 20 per §0.9 v2.0. No external consumers existed at the time of the bump.

**Lessons.**
- For donut center labels in Recharts, layer an absolutely-positioned `<div>` over the `ResponsiveContainer` rather than fighting `<Pie>`'s built-in label slots — keeps `text-2xl tabular font-mono` discipline intact without re-implementing typography on the SVG layer.
- QA-only `?_state=` query overrides on MSW handlers make 6-state coverage demonstrable without flipping the network. The 6 states aren't theoretical when each panel has a code path AND a way to trigger it.
- For optimistic typing on response shapes that may carry `_meta`, prefer wrapping list endpoints as `{ items, _meta? }` from the start. Backfilling `_meta` later requires touching every consumer; doing it up front costs one extra destructure per consumer.
- `setTimeout(msUntilNextHour)` is the cheapest way to make a time-of-day greeting live-update — no `setInterval` polling every minute, no date-fns timezone math, just `Intl.DateTimeFormat` + a one-shot timer that re-arms.

---

## 2026-05-11 — Prompt 2 (Onboarding) — 5-step wizard

**Summary.** Linear 5-step onboarding wizard for new institution accounts. Triggered when `user.onboardingComplete === false`. Lives at `/onboarding/:step` inside `<AppShell>`, with the sidebar nav locked, mobile bottom tab nav (none today) suppressed in spirit, and `<main>`'s top padding dropped so the wizard's sticky step indicator butts directly against TopBar.

**Files written.**
- New module: [`src/features/onboarding/`](../src/features/onboarding/) — `schemas.ts`, `api.ts`, `context/OnboardingContext.tsx`, `fixtures/{uzBanks,uzRegions}.ts`, four hooks (`useOnboardingDraft`, `useOnboardingComplete`, `useOnboardingGuard`, `useOfflineDraftQueue`), eleven components (`OnboardingLayout`, `StepIndicator`, `StepActionBar`, `PhoneInput`, `ColorPicker`, `LogoUploader`, `ReceiptPreview`, `BankCombobox`, `BankAccountFields`, `DepartmentTreeEditor`, `InviteStaffFields`), six pages (`OnboardingPage`, `Step1OrgInfo`..`Step5InviteStaff`).
- New MSW: [`src/mocks/handlers/onboarding.ts`](../src/mocks/handlers/onboarding.ts) — in-memory draft + university/school/kindergarten template fixtures. Registered in [`src/mocks/handlers/index.ts`](../src/mocks/handlers/index.ts).
- Modified: [`src/types/domain.ts`](../src/types/domain.ts) (added `User.onboardingComplete`), [`src/lib/auth.ts`](../src/lib/auth.ts) (added `updateUser(patch)`; profile carries `onboardingComplete`; DEV owner defaults `false`, other DEV roles `true`), [`src/mocks/handlers/auth.ts`](../src/mocks/handlers/auth.ts) (fake users carry `onboardingComplete`), [`src/components/layout/AppShellContext.tsx`](../src/components/layout/AppShellContext.tsx) (added `onboardingActive` + setter), [`src/components/layout/AppShell.tsx`](../src/components/layout/AppShell.tsx) (state + `<main>` padding conditional), [`src/components/layout/Sidebar.tsx`](../src/components/layout/Sidebar.tsx) (nav links → disabled `<span>` + Tooltip when active), [`src/router.tsx`](../src/router.tsx) (registered `/onboarding/:step`; `OnboardingGuardWrapper` wraps `<Routes>`; extended `KNOWN_PATH_PREFIXES`), [`src/lib/i18n/locales/{ru,uz}.json`](../src/lib/i18n/locales/) (full `onboarding.*` namespace + `common.actions.{collapse,expand}`).

**Install.** `canvas-confetti@^1.9.4`, `@types/canvas-confetti@^1.9.0` — dynamic-imported in Step 5's finish flow so it ships as its own ~4.3 KB gzipped chunk.

**Layout fixes that landed late.** The sticky step indicator inside `<main>` (a scroll container with `overflow-y-auto`) needed `top-0` (relative to `<main>`, not the viewport) — initial pass used `top-[var(--app-header-h,3.5rem)]` which left a permanent gap above the indicator. A second pass tried `-mt-4 md:-mt-6` to butt the indicator against TopBar, but with the parent's `overflow-y: auto`, the negative margin pushed the indicator above the scroll viewport's clip line and it disappeared on scroll. Final fix: AppShell drops `<main>`'s top padding when `onboardingActive`, indicator stays at simple `top-0`, no negative top margin. Content's bottom padding tightened from `pb-32` (8rem) to `pb-16` (4rem) per user feedback.

**Verifications.** typecheck · `eslint --max-warnings 0` · `vite build` — all clean.

**Lessons.**
- `position: sticky` inside an `overflow: auto` parent uses `top` relative to **the parent**, not the viewport. If `<main>` is the scroll container, `top-0` sticks at `<main>`'s padding edge. The viewport-offset pattern only works if scrolling happens at the document level.
- Negative top margin on a sticky child of an `overflow-y: auto` parent will clip the child above the scroll viewport on any scroll. Don't try to use `-mt-*` to defeat parent padding for sticky elements — instead, drop the parent's padding conditionally.
- For "lock the chrome while a modal-flow is active," `AppShellContext` flag + reader components (Sidebar reads, AppShell reads) is cleaner than threading props through every nav consumer.
- Dynamic-import `canvas-confetti` at the call site keeps it out of the main bundle; build chunked it to ~4.3 KB gzipped without any rollupOptions config.

---

## 2026-05-11 — Prompt 1 (Auth) — sign-in / forgot / reset

**Summary.** First feature module on top of the v2.0 foundation. Sign-in becomes async (hits MSW), gets a 5/15-min lockout via a fourth `useSyncExternalStore` store, gets a `PasswordField` with show/hide, gets a DevRoleSwitcher behind `import.meta.env.DEV`, and lives at `/sign-in` under a new `src/features/auth/` module. Forgot- and reset-password flows ship alongside it. AuthLayout grows a lg+ brand panel split.

**Files written.**
- New module: [`src/features/auth/`](../src/features/auth/) — `schemas.ts`, `api.ts`, `hooks/{useFailedAttempts,useForgotPassword,useResetPassword}.ts`, `components/{SignInForm,DevRoleSwitcher,PasswordField,LockedAlert}.tsx`, `pages/{SignInPage,ForgotPasswordPage,ResetPasswordPage}.tsx`.
- Modified: [`src/lib/auth.ts`](../src/lib/auth.ts) (async `signIn` via MSW; `unipay-signout-reason` flag), [`src/mocks/handlers/auth.ts`](../src/mocks/handlers/auth.ts) (sign-in / sign-out / forgot-password / reset-password endpoints; role by email prefix or domain hint), [`src/router.tsx`](../src/router.tsx) (registered `/forgot-password` + `/reset-password`; switched SignIn import; extended `isKnownPath`), [`src/components/auth/AuthLayout.tsx`](../src/components/auth/AuthLayout.tsx) (lg+ brand panel split: `bg-brand-600` + radial gradient + logo + tagline on left, form column on right), [`src/lib/i18n/locales/{ru,uz}.json`](../src/lib/i18n/locales/) (new `auth.signIn.*` / `auth.forgot.*` / `auth.reset.*` / `auth.dev.*` namespaces; old flat keys removed), [`docs/DECISIONS.md`](../docs/DECISIONS.md) (two deviations logged).
- Deleted: `src/pages/SignIn.tsx` (migrated to feature module).

**Verifications.** typecheck · `eslint --max-warnings 0` · `vite build` — all clean. §0.9 audit's `Unicode arrows` regex still has pre-existing UTF-8 byte-collision false positives on Cyrillic + em-dashes in legacy comments; my new files don't add to the false-positive set.

**Deviations logged.**
- Sign-in success redirects to `/` (not `/dashboard` per prompt) — there is no `/dashboard` route in this build. Logged in DECISIONS with review condition.
- `PasswordField` show/hide toggle is 36×36 (inside `h-9` Input) — under §0.7's 44×44 target. Standard cross-product pattern; logged.

**Lessons.**
- Zod schemas as `(t) => z.object(...)` factory functions, memoized via `useMemo([t])` in the consuming form, give clean per-locale validation messages without dragging i18n into every error message at display time.
- A "session-expired" signal needs a flag the post-redirect page can read because `signOut` itself has no router context; sessionStorage is the right channel since it's session-scoped just like the auth state itself.
- For full-bleed surfaces wrapping their own `<TooltipProvider>`, lg+ brand panel split is best done as a top-level `lg:flex` with one `<aside>` and one form column — both columns share the provider above.

---

## 2026-05-10 — Chrome polish (favicon, notifications bell, radius bump, Pages CI fix)

**Summary.** Five small landing changes after the v2.0 foundation: real branded favicon, a polished notifications bell, a softer corner-radius hierarchy on cards and form controls, GitHub Pages Jekyll-bypass, and a fresh i18n group for notification copy.

**Files written / replaced.**
- Branding: [`public/favicon.svg`](../public/favicon.svg) (new), [`index.html`](../index.html) — favicon ref + `theme-color` meta.
- Notifications: [`src/components/layout/NotificationsBell.tsx`](../src/components/layout/NotificationsBell.tsx) — `unreadCount?: number` prop (default 0); dot conditional on `> 0`; tighter `right-2 top-2 size-1.5` anchor; `aria-label` + tooltip + popover header pull from `notifications.*` keys.
- i18n: [`src/lib/i18n/locales/ru.json`](../src/lib/i18n/locales/ru.json) + [`uz.json`](../src/lib/i18n/locales/uz.json) — new `notifications.{title,empty,unreadCount}` group.
- Radius bump (parallel `lg → xl` for cards, `md → lg` for h-9 controls): [`src/components/ui/card.tsx`](../src/components/ui/card.tsx), [`button.tsx`](../src/components/ui/button.tsx) (default + sm + lg), [`input.tsx`](../src/components/ui/input.tsx), [`select.tsx`](../src/components/ui/select.tsx) (trigger), [`textarea.tsx`](../src/components/ui/textarea.tsx), [`toggle.tsx`](../src/components/ui/toggle.tsx), [`Topbar.tsx`](../src/components/layout/Topbar.tsx) (search button).
- CI: [`.nojekyll`](../.nojekyll) (new), [`public/.nojekyll`](../public/.nojekyll) (new) — silences Pages auto-Jekyll which choked on `{{ }}` JS literals in [STYLE_DISCIPLINE.md](../STYLE_DISCIPLINE.md) code blocks.

**Commits.** `7878e09` favicon, `10d78a6` notifications fix, `19505c3` Pages nojekyll. Radius bump uncommitted at sync time.

**Verifications.** typecheck · lint --max-warnings 0 · build · §0.9 audit (touched files clean) — all clean.

**Lessons.**
- Even with `actions/deploy-pages@v4` wired up, GitHub Pages will still run Jekyll on the source branch unless Settings → Pages → Source is explicitly set to "GitHub Actions". `.nojekyll` is the belt-and-suspenders signal so the auto-build noops if the setting drifts.
- A solo bumped `rounded-lg → rounded-xl` on the Card lifts cards out of the `--radius` token cascade (Tailwind's `xl` is hardcoded 12px). Acceptable for a one-off softer card edge — the controls below still ride the cascade.
- "More border" can mean radius, not stroke. Verify before bumping border colors / inner dividers / shadow.

---

## 2026-05-10 — Prompt 0 v2.0 — Foundation rewrite

**Summary.** Re-scaffolded the entire foundation against the v2.0 prompt: scale-based color tokens, motion + density + tabular as DOM hooks, module-level state stores via `useSyncExternalStore`, AppShell pattern with command palette + help overlay + breadcrumb topbar, system states catalog with reference-id error reporting, HashRouter with maintenance gate + path-aware auth guard, AuthLayout for full-bleed system surfaces, new domain primitives (`Money` bigint, `MaskedAccount`, `WriteButton`, `KeyboardHint`).

**Files written / replaced.**
- Tokens: [`tailwind.config.ts`](../tailwind.config.ts), [`src/styles/globals.css`](../src/styles/globals.css)
- Domain: [`src/types/domain.ts`](../src/types/domain.ts) (Role `finance_manager`, Money `bigint`, Tone, Locale, StatusDomain)
- Stores: [`src/lib/preferences.ts`](../src/lib/preferences.ts), [`src/lib/maintenanceState.ts`](../src/lib/maintenanceState.ts), [`src/lib/auth.ts`](../src/lib/auth.ts), [`src/lib/referenceId.ts`](../src/lib/referenceId.ts), [`src/lib/systemEvents.ts`](../src/lib/systemEvents.ts), [`src/lib/tone.ts`](../src/lib/tone.ts), [`src/lib/format.ts`](../src/lib/format.ts) (bigint-aware)
- Hooks: [`src/hooks/useNetworkState.ts`](../src/hooks/useNetworkState.ts), [`src/hooks/useKeyboardShortcuts.ts`](../src/hooks/useKeyboardShortcuts.ts)
- Provider: [`src/providers/ThemeProvider.tsx`](../src/providers/ThemeProvider.tsx)
- Auth chrome: [`src/components/auth/AuthLayout.tsx`](../src/components/auth/AuthLayout.tsx)
- System states: [`src/components/system/SystemStateLayout.tsx`](../src/components/system/SystemStateLayout.tsx), [`SystemErrorBoundary.tsx`](../src/components/system/SystemErrorBoundary.tsx), [`NotFoundState.tsx`](../src/components/system/NotFoundState.tsx), [`ServerErrorState.tsx`](../src/components/system/ServerErrorState.tsx), [`ForbiddenState.tsx`](../src/components/system/ForbiddenState.tsx), [`MaintenanceState.tsx`](../src/components/system/MaintenanceState.tsx), [`OfflineState.tsx`](../src/components/system/OfflineState.tsx), [`OfflineBanner.tsx`](../src/components/system/OfflineBanner.tsx)
- Domain primitives: [`src/components/unipay/Money.tsx`](../src/components/unipay/Money.tsx), [`MaskedAccount.tsx`](../src/components/unipay/MaskedAccount.tsx), [`WriteButton.tsx`](../src/components/unipay/WriteButton.tsx), [`KeyboardHint.tsx`](../src/components/unipay/KeyboardHint.tsx), [`index.ts`](../src/components/unipay/index.ts)
- Layout shell: [`AppShell.tsx`](../src/components/layout/AppShell.tsx), [`AppShellContext.tsx`](../src/components/layout/AppShellContext.tsx), [`UnipayLogo.tsx`](../src/components/layout/UnipayLogo.tsx), [`Sidebar.tsx`](../src/components/layout/Sidebar.tsx), [`Topbar.tsx`](../src/components/layout/Topbar.tsx), [`UserMenu.tsx`](../src/components/layout/UserMenu.tsx), [`CommandPalette.tsx`](../src/components/layout/CommandPalette.tsx), [`HelpOverlay.tsx`](../src/components/layout/HelpOverlay.tsx), [`ThemeToggle.tsx`](../src/components/layout/ThemeToggle.tsx), [`NotificationsBell.tsx`](../src/components/layout/NotificationsBell.tsx), [`shortcuts.ts`](../src/components/layout/shortcuts.ts)
- Pages: [`src/pages/SignIn.tsx`](../src/pages/SignIn.tsx), [`Dashboard.tsx`](../src/pages/Dashboard.tsx), [`Placeholder.tsx`](../src/pages/Placeholder.tsx)
- Router: [`src/router.tsx`](../src/router.tsx) (HashRouter, gates, system preview routes)
- Entry: [`src/App.tsx`](../src/App.tsx), [`src/main.tsx`](../src/main.tsx)
- Primitives updated: [`src/components/ui/table.tsx`](../src/components/ui/table.tsx) (uses `var(--row-h)`), [`button.tsx`](../src/components/ui/button.tsx) (h-9 default), [`card.tsx`](../src/components/ui/card.tsx) (`p-5`), [`input.tsx`](../src/components/ui/input.tsx) / [`select.tsx`](../src/components/ui/select.tsx) / [`tabs.tsx`](../src/components/ui/tabs.tsx) / [`toggle.tsx`](../src/components/ui/toggle.tsx) (h-9 alignment)
- New primitive: [`src/components/ui/kbd.tsx`](../src/components/ui/kbd.tsx)
- i18n: [`src/lib/i18n/locales/ru.json`](../src/lib/i18n/locales/ru.json), [`uz.json`](../src/lib/i18n/locales/uz.json) — restructured for `nav.section.*` / `system.*` / `common.actions.*`
- Mocks: [`src/mocks/handlers/auth.ts`](../src/mocks/handlers/auth.ts) (matches new `User` shape)
- Docs: [`STYLE_DISCIPLINE.md`](../STYLE_DISCIPLINE.md) v2.0 (§0.11 + §0.12 added by user), [`docs/DECISIONS.md`](../docs/DECISIONS.md), [`ai_context/AI_CONTEXT.md`](./AI_CONTEXT.md), `ai_context/HISTORY.md` (this file), [`docs/product_states.md`](../docs/product_states.md)

**Files removed.** `src/app/` (App.tsx, router.tsx, providers.tsx, layouts/), `src/features/`, `src/stores/` (Zustand-based — replaced by useSyncExternalStore stores in `lib/`), `src/components/layout/MobileTabNav.tsx`, `src/components/layout/nav-config.tsx`, `src/lib/api/` (TanStack Query client moved into `App.tsx` inline), `src/lib/is-detail-route.ts` (no longer needed; detail routes detected via TopBar breadcrumb logic).

**Verifications.** typecheck · `eslint --max-warnings 0` · `vite build` · §0.9 audit greps — all clean.

**Lessons.**
- `text-xs` audit needs care in code comments — Unicode arrows and the literal token `<svg` in comments will trip the grep. Use ASCII-only descriptions.
- Mac case-insensitive filesystem treats `Topbar.tsx` and `TopBar.tsx` as the same file — exported component name controls the import name.
- Backward-compat token aliases (`--primary-light`, `--success-light`, `--surface-2`) save a wide refactor of existing components after a token system rewrite. Layered tokens beat hard cutovers.

---

_(Add new entries above this line.)_
