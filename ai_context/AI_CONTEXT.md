# AI_CONTEXT.md — UNIPAY Merchant Dashboard

> Snapshot of project state. Future Claude Code sessions read this first to bootstrap context.
> Source-of-truth files (always trust over this snapshot): [`STYLE_DISCIPLINE.md`](../STYLE_DISCIPLINE.md), [`src/types/domain.ts`](../src/types/domain.ts), [`docs/product_states.md`](../docs/product_states.md).

## Last updated
2026-05-11 — Bank Edit Sheet polish: `BankImmutableSummary` restructured from a 2-column `dl grid` to stacked groups (label `text-xs uppercase tracking-wider` on top, value `text-sm font-medium` below; `break-all` on the 20-digit account number so it wraps inside narrow sheets) and each row is now a tap-to-copy `<button>` with `navigator.clipboard.writeText` (+ hidden-textarea `execCommand` fallback for non-secure contexts), feature-detected `navigator.vibrate(10)` haptic, `Copy → Check` icon swap for 1500ms, sonner toast, and an `sr-only role="status" aria-live="polite"` announcement. New i18n key `organization.bankAccounts.copyErrorToast` (RU + UZ). Earlier the same day: Prompt 4 (Organization module) — 4 sub-routes under `/organization/*` (Profile / Departments / Bank Accounts / Branding) via nested `<OrganizationLayout />` + horizontal-scroll `OrgTabsNav`; full MSW handler with 16 endpoints + 111-node tree fixture (3 faculties × 4 depts × 2 years × 3 groups) + 5s server-side bank-verification flip; **add flows are standalone pages** (`/organization/bank-accounts/new`, `/organization/departments/new[?parentId=X]`) with §0.5 Pattern A action bar — sibling of `OrganizationLayout` so the tabs strip doesn't render on them. `LogoUploader` / `ColorPicker` / `ReceiptPreview` promoted to `src/components/shared/` with parameterized `labels` prop. Onboarding still uses them. `Organization`, `Branding`, `LegalForm`, `OrgType` added to `src/types/domain.ts`. Departments tree uses `@dnd-kit/core` with delay-based touch activation (long-press starts drag), cycle-prevention via `descendantIds` banned-set, reparent-confirm with `requireReason` when affected students > 50, cascade-delete with reason ≥20 when children exist. **Mobile fixes:** action icons hidden on mobile (tap-row → bottom Sheet), `min-h-0` chain wired through `ResponsiveSheet` + `DepartmentDetailPanel` + `DepartmentTree` so `overflow-y-auto` actually scrolls; focus-ring clipping fixed via `-mx-1 px-1` outset on all internal scroll wrappers (overflow-y-auto implicitly forces overflow-x: auto per CSS spec, which clips the input's `ring-offset-2` halo). Earlier the same day: Dashboard polish (KPI hero responsive, ZhiPay DateRangePicker), Onboarding Skip Setup, Prompt 3 Dashboard Home.

## What this app is
**UNIPAY** — merchant dashboard for Uzbek educational institutions (universities, schools, kindergartens) to manage tuition payments. Locale: RU primary, UZ secondary (Latin). Currency: UZS (space separator). Timezone: Asia/Tashkent.

Audience: **Owner / Finance Manager / Operator / Viewer** (`Role` in [`src/types/domain.ts`](../src/types/domain.ts)).

Mobile-first with full feature parity at 320px+ — no read-only mobile, no use-desktop banner.

## Stack snapshot
React 18 · Vite 5 · TypeScript 5 (strict + `noUncheckedIndexedAccess`) · Tailwind v3 · shadcn/ui · React Router v6 (**HashRouter**) · TanStack Query v5 · React Hook Form + Zod · TanStack Table v8 · Recharts · react-i18next · date-fns 3 · MSW v2 · lucide-react · sonner · @fontsource/inter + @fontsource/jetbrains-mono · cmdk · canvas-confetti (dynamic import for the Step 5 finish flourish) · @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities (Organization departments tree drag/drop).

## Token system
- **HSL scales**: `brand-50…950` (anchor `#1558B0` ≈ brand-600), `slate-50…950`, plus 3-stop `success/warning/danger/info` ramps.
- shadcn semantic tokens (`--background`, `--foreground`, `--card`, `--muted`, `--border`, `--ring`) **map onto scales**, never raw HSL.
- Legacy semantic aliases (`--primary-light`, `--success-light`, `--surface-2`, `--refund`, etc.) kept as a backward-compat layer pointing into scale vars.
- Motion: `--duration-fast/base/slow` (120/180/240ms), `--ease-standard/emphasized`. `prefers-reduced-motion` global override.
- Density: `--row-h` driven by `html[data-density]` (40px compact / 44px comfortable).
- Tabular numerals: `html[data-tabular-nums="true"]`.
- Radius scale: `--radius: 0.5rem` (8px) drives `rounded-md` (6px) / `rounded-lg` (8px) / `rounded-sm` (4px). Card primitive uses Tailwind-default `rounded-xl` (12px, outside the cascade) for a slightly softer card edge; h-9 form controls (Button / Input / Select trigger / Textarea / Toggle / Topbar search) all use `rounded-lg` (8px). Hierarchy reads: Card 12px > controls 8px > internal items 4px.

## Folder map
```
src/
├── App.tsx                       # HashRouter + ThemeProvider + MSW + boot calls
├── main.tsx
├── router.tsx                    # MaintenanceGate + PathAwareAuthGuard + system preview routes
├── components/
│   ├── auth/    AuthLayout       # Full-bleed chrome, owns its own TooltipProvider
│   ├── layout/                   # AppShell, AppShellContext, Sidebar, Topbar, UserMenu,
│   │                             # CommandPalette, HelpOverlay, ThemeToggle, NotificationsBell,
│   │                             # UnipayLogo, shortcuts.ts
│   ├── system/                   # SystemStateLayout, SystemErrorBoundary, NotFound/ServerError/
│   │                             # Forbidden/Maintenance/Offline + OfflineBanner
│   ├── unipay/                   # Money, MaskedAccount, WriteButton, KeyboardHint
│   │                             # + index.ts re-exports of badges from shared/
│   ├── ui/                       # shadcn primitives + Kbd
│   └── shared/                   # DataTable, badges, BackLink, ConfirmDialog, ResponsiveSheet,
│                                 # DateRangePicker, EmptyState/ErrorState/OfflineState/PartialBanner,
│                                 # LogoUploader, ColorPicker, ReceiptPreview (promoted from onboarding)
├── hooks/                        # useNetworkState, useKeyboardShortcuts, useMediaQuery, …
├── lib/
│   ├── auth.ts                   # useSyncExternalStore + sessionStorage + idle timeout
│   ├── preferences.ts            # bootPreferences applies data-density + data-tabular-nums
│   ├── maintenanceState.ts       # bootMaintenanceFromUrl reads ?maintenance=on|off
│   ├── referenceId.ts            # 8a7c-2f1e shaped error ids
│   ├── systemEvents.ts           # logPageError → reference id
│   ├── tone.ts                   # tone-to-class map (single source of truth)
│   ├── format.ts                 # bigint-aware formatMoney, masking
│   └── i18n/locales/{ru,uz}.json
├── pages/                        # Placeholder (Dashboard now in features/dashboard/)
├── features/
│   ├── auth/                     # SignIn / ForgotPassword / ResetPassword
│   │   ├── pages/                # SignInPage, ForgotPasswordPage, ResetPasswordPage
│   │   ├── components/           # SignInForm, PasswordField, LockedAlert, DevRoleSwitcher
│   │   ├── hooks/                # useFailedAttempts, useForgotPassword, useResetPassword
│   │   ├── api.ts                # forgot + reset fetch wrappers (signIn lives in lib/auth.ts)
│   │   └── schemas.ts
│   ├── dashboard/                # Home page — KPIs + charts + recent activity panels
│   │   ├── pages/                # DashboardPage (URL date-range sync via ?from=&to=)
│   │   ├── components/           # KpiSparkline, KpiCard, KpiRow, RevenueChart,
│   │   │                         # PaymentStatusChart, RecentTransactions, UnpaidStudents,
│   │   │                         # GreetingTitle, PanelStates (6-state primitives)
│   │   ├── hooks/                # useDashboardSummary, useRevenueSeries,
│   │   │                         # usePaymentStatusBreakdown, useRecentTransactions,
│   │   │                         # useUnpaidStudents, useBulkRemindUnpaid
│   │   └── api.ts                # typed fetch wrappers + ResponseMeta shape
│   ├── organization/             # /organization/* — Profile / Departments / Bank Accounts / Branding
│   │   ├── pages/                # OrganizationLayout, ProfilePage, DepartmentsPage,
│   │   │                         # BankAccountsPage, BrandingPage,
│   │   │                         # AddBankAccountPage, AddDepartmentPage (full-page add flows)
│   │   ├── components/           # OrgTabsNav, DepartmentTree, DepartmentNode,
│   │   │                         # DepartmentDetailPanel, BankAccountCard,
│   │   │                         # BankAccountForm (edit Sheet), BankAccountFormParts (shared pickers)
│   │   ├── hooks/                # useOrganization, useUpdateOrganization,
│   │   │                         # useDepartments (flat-list + buildTree + descendantIds),
│   │   │                         # useDepartmentMutations (create/update/delete/move),
│   │   │                         # useBankAccounts, useBankAccountMutations,
│   │   │                         # useBranding, useUpdateBranding
│   │   ├── schemas.ts            # profileSchema · brandingSchema · bankAccountSchema · departmentSchema
│   │   └── api.ts                # typed fetch wrappers for all org endpoints
│   └── onboarding/               # 5-step wizard for new institution accounts
│       ├── pages/                # OnboardingPage (router + provider) + Step1..Step5
│       ├── components/           # OnboardingLayout, StepIndicator, StepActionBar,
│       │                         # PhoneInput, ColorPicker, LogoUploader, ReceiptPreview,
│       │                         # BankCombobox, BankAccountFields, DepartmentTreeEditor,
│       │                         # InviteStaffFields
│       ├── context/              # OnboardingContext (local feature state per §0.12)
│       ├── hooks/                # useOnboardingDraft (query + mutation),
│       │                         # useOnboardingComplete, useOnboardingGuard,
│       │                         # useOfflineDraftQueue (localStorage queue + flush)
│       ├── fixtures/             # uzBanks (20 banks + MFO), uzRegions (14)
│       ├── api.ts                # draft + complete + templates fetch wrappers
│       └── schemas.ts            # 5 t-aware Zod factories + DepartmentNode + OnboardingDraft
├── providers/ThemeProvider.tsx
├── styles/globals.css
├── types/domain.ts               # Role finance_manager · Money bigint · Tone · Locale · StatusDomain
└── mocks/                        # MSW worker + handlers
```

## Module-level state stores (§0.12)
All four use `useSyncExternalStore` with module-level cache + listener set + `storage` event cross-tab sync (where relevant):
- [`lib/preferences.ts`](../src/lib/preferences.ts) — theme/density/language/timezone/date_format/time_format/tabular_numerals. DOM side effects on `<html>`. Boot: `bootPreferences()` from `App.tsx`.
- [`lib/maintenanceState.ts`](../src/lib/maintenanceState.ts) — `{ active, startedAt, estimatedEndAt }`. URL boot via `bootMaintenanceFromUrl()` reads `?maintenance=on|off`, applies, strips param.
- [`lib/auth.ts`](../src/lib/auth.ts) — session backed by `sessionStorage` (`unipay-session`). `signIn(email, password)` is now **async**: hits `/api/auth/sign-in` via MSW, parses user + JWT-shaped token, sets session. `signInAsRole(role)` stays sync for the dev role switcher. `signOut({ reason })` writes a `unipay-signout-reason` flag that `SignInPage` reads + clears to surface the expired banner. `updateUser(patch)` patches `cached.profile` in-place — used by the onboarding finish flow to flip `onboardingComplete: true`. `useIdleTimeout()` returns `'idle'` after 30 min of mousedown/keydown/scroll/touchstart silence.
- [`features/auth/hooks/useFailedAttempts.ts`](../src/features/auth/hooks/useFailedAttempts.ts) — `{ count, firstFailureAt }` in `sessionStorage` (`unipay-auth-failed-attempts`). 5-attempt / 15-min sliding window. `recordFailure` / `recordSuccess` mutate; `isLockedOut(state)` and `getLockoutRemainingMs(state)` derive in consumers. `LockedAlert` ticks 1s while inside a window.

## Routing
HashRouter so the app deploys to any static host without a 404.html shim.
- `MaintenanceGate` outermost — `?maintenance=on` flips it; `/system/preview/*` bypasses.
- Auth pages live **outside** `<AppShell>` as siblings of the catch-all guard: `/sign-in`, `/forgot-password`, `/reset-password`. All wrap in `<AuthLayout>`.
- `PathAwareAuthGuard` — unknown deep-link before sign-in → full-bleed 404; known → redirect to `/sign-in?next=…`. `isKnownPath` whitelists `/`, `/sign-in`, `/forgot-password`, `/reset-password`, plus the in-shell route prefixes (now including `/onboarding`).
- `AuthGuard` wraps everything in `<AppShell>`; idle → `signOut({ reason: 'session_expired' })`. The reason is read by `SignInPage` (sessionStorage flag) to show the expired banner; `?expired=1` is also honored.
- `OnboardingGuardWrapper` wraps `<AppRoutes>` and runs `useOnboardingGuard`: when `session.profile.onboardingComplete === false` and current path is not `/onboarding/*`, redirects to `/onboarding/1`.
- `/onboarding/:step` is registered inside `AppRoutes` so it lives inside `<AppShell>`. The user identity / chrome persists; the wizard's own `OnboardingLayout` adds sticky step indicator + fixed action bar (Pattern A from §0.5).
- `/` mounts `<DashboardPage />` from `features/dashboard/` (canonical home — no parallel `/dashboard`, see DECISIONS 2026-05-11). Sign-in success and post-onboarding completion both land here.
- `SystemErrorBoundary` wraps `<AppRoutes>`; thrown errors land on `<ServerErrorState>` with copy-on-click reference id.
- Preview routes for QA: `/system/preview/{404,500,403,offline,maintenance}`.

## Layout shell contract
- `flex h-dvh bg-background` root with `--sidebar-width` set as inline style on the shell wrapper.
- Skip-link first child; `<main id="main-content" tabIndex={-1}>` is its target.
- `<TooltipProvider>` outermost so portal tooltips from Sheet contents resolve.
- Right column has `min-w-0` so flex children can truncate.
- AppShell auto-collapses sidebar at `(max-width: 1023px)`.
- `<main>` padding is **conditional on `onboardingActive`**: default `p-4 md:p-6`, but during onboarding switches to `px-4 pb-4 md:px-6 md:pb-6` (zero top padding) so the wizard's sticky step indicator butts directly against TopBar with no gap. `<main>` is the scroll container (`overflow-y-auto`), so sticky elements inside use `top-0` relative to it (NOT a viewport offset).

## Sidebar
- 64↔240 width, `transition-[width] duration-base ease-standard`.
- Items `h-9 gap-2.5 px-3`, icons `size-4`. Active state: `bg-brand-50 text-brand-700` + `before:` 2px accent stripe (dark-mode mapping wired).
- Sections from spec §13: Main / Organization / Students / Payments / Finance / System.

## Power-user surfaces
- `⌘K` / `Ctrl+K` toggles Command Palette ([CommandPalette.tsx](../src/components/layout/CommandPalette.tsx)).
- `?` opens Help Overlay ([HelpOverlay.tsx](../src/components/layout/HelpOverlay.tsx)).
- `t` toggles theme; `/` focuses search; `Esc` closes overlays.
- `g {x}` chord patterns documented in `shortcuts.ts`. Currently visualized in HelpOverlay; chord listener implementation lands in a later pass.

## Notifications bell
- [NotificationsBell.tsx](../src/components/layout/NotificationsBell.tsx) takes `unreadCount?: number` (default `0`). Red dot only renders when > 0; empty state otherwise.
- Localized via `notifications.title` / `notifications.empty` / `notifications.unreadCount` (RU + UZ). When unread, `aria-label` appends `unreadCount` so screen readers announce the badge.
- Trigger has no real notifications source yet — Topbar passes nothing → no dot visible.

## Branding & deploy
- Favicon: [public/favicon.svg](../public/favicon.svg) — UP mark on brand-600 rounded square; matches [UnipayLogo](../src/components/layout/UnipayLogo.tsx). Paired with `<meta name="theme-color" content="#1558B0">` in [index.html](../index.html).
- GitHub Pages CI: [.nojekyll](../.nojekyll) at repo root + [public/.nojekyll](../public/.nojekyll) (Vite copies into `dist/`) bypass the auto Jekyll build that choked on `{{ }}` JS literals in `STYLE_DISCIPLINE.md` code blocks. Repo-side: Settings → Pages → Source must be set to "GitHub Actions" so [deploy.yml](../.github/workflows/deploy.yml) is the canonical deploy path.

## System states catalog (§0.11)
- `SystemStateLayout` with `in-shell` / `full-bleed` variants.
- 5 states + OfflineBanner.
- ServerError carries copy-on-click reference id; `lib/systemEvents.logPageError()` generates and logs.
- AuthLayout owns its own `<TooltipProvider>` because it lives outside `<AppShell>`.

## Domain primitives
- `Money` is **bigint** (minor units — UZS in tiyins, USD in cents). `formatMoney()` divides by 100 at display time. Negatives render `text-danger-600` with `−` prefix.
- `MaskedAccount` shows `••••0123`; never reconstructs full PAN.
- `WriteButton` disables when `useNetworkState() === false` and shows a tooltip.
- `KeyboardHint` re-exports the canonical Kbd primitive.

## DateRangePicker (shared)
- [`src/components/shared/DateRangePicker.tsx`](../src/components/shared/DateRangePicker.tsx) + helpers [`src/components/shared/dateRange.ts`](../src/components/shared/dateRange.ts) — ZhiPay-format range picker: quick-select sidebar (Today / Yesterday / Last 7 days / Last 30 days / Custom) on the left, two-month calendar with custom prev/next chevron header on the right, footer with resolved `from – to` summary + Cancel / Apply. Selections are pending until Apply commits.
- **API.** `DateRangeValue = { range: 'today' | 'yesterday' | '7d' | '30d' | 'custom', customFrom?, customTo? }`. Helpers: `resolveDateRange(value)` → concrete `{ from, to }`; `useDateRangeLabel(value)` → localized trigger label.
- **Trigger.** Passed as `children` via `asChild` so consumers control the visual. Inline the `<Button>` directly — wrapping in a function component breaks Radix `Slot`'s ability to forward ref/onClick (caught in this session: the picker silently didn't open until the trigger was inlined).
- **Mobile.** `matchMedia('(max-width: 767px)')` collapses the calendar to a single month and stacks the sidebar above. Popover content is clamped to `w-[min(860px,calc(100vw-1rem))]` + `collisionPadding={8}` so Radix shifts off the viewport edge near the right border.
- **i18n.** `common.daterange.{title,quick-select,today,yesterday,7d,30d,custom,cancel,apply,prevMonth,nextMonth}` in `ru.json` + `uz.json`. The Calendar's built-in `nav` and `caption_label` are hidden via `classNames` overrides so the custom header is the only nav surface.
- **Helpers split.** `resolveDateRange` and `useDateRangeLabel` live in the sibling `dateRange.ts` (not the component file) so `react-refresh/only-export-components` doesn't flag the component file. Re-exporting helpers from the component file does NOT satisfy the rule.

## Dashboard feature module
- [`features/dashboard/`](../src/features/dashboard/) — home page at `/`. Greeting title (Tashkent-aware morning/day/evening via [`lib/greeting.ts`](../src/lib/greeting.ts)), institution subtitle (placeholder until `/api/organization` lands), `<DateRangePicker>` (ZhiPay format — see "DateRangePicker" section below) URL-synced via `?range=<key>` and `&from=&to=` (only when `range=custom`); default range is `30d`.
- **Layout.** 4 KPI cards: 1-per-row on `<sm` (full-width on phones), 2×2 on `sm:`, 4 across on `lg:`. Charts row (full stack → `lg:grid-cols-3`, RevenueChart `lg:col-span-2` + PaymentStatusChart 1/3); two list panels (full stack → `lg:grid-cols-2`).
- **KPI hero typography.** `text-2xl font-semibold font-mono tabular leading-tight md:text-3xl md:leading-none` — `truncate` removed so full UZS amounts (e.g. `298 436 322 UZS`) stay readable on every viewport, wrapping at the space separators when needed. Logged in DECISIONS 2026-05-11 ("KPI hero number is `text-2xl md:text-3xl`").
- **KPIs.** Total Received (UZS + delta + 7-day area sparkline), Pending (count + students-with-debt subtitle, clicks → `/payments/pending`), Overdue (count hero + UZS subtitle in `text-destructive`, clicks → `/payments/pending?tab=overdue`), Last Payout (amount + date + next-payout relative). KpiSparkline = Recharts `AreaChart` with `stroke="hsl(var(--brand-600))"`.
- **RevenueChart.** Recharts `BarChart` with daily/weekly/monthly `Tabs` + count↔amount `Switch`. `tick.fontSize: 13`, `tickLine={false}`, `axisLine={{ stroke: 'hsl(var(--border))' }}`, bars `fill="hsl(var(--brand-600))"`. Tooltip shows formatted UZS or count via `formatUZS`/`formatNumber`. `<YAxis width={72}>` so localized compact labels like `200 млн` clear the axis area (default 60 was too narrow; the value 48 from the initial pass clipped labels).
- **PaymentStatusChart.** Recharts donut (`<Pie innerRadius=64 outerRadius=92>`) over success-600 / warning-600 / destructive cells. Center label is an absolute-positioned overlay carrying `text-2xl tabular font-mono` total. Legend renders as a `<ul>` of color-chip + label + count below the chart.
- **Recent Transactions panel.** 10 rows: avatar initials (slate-100 circle, `text-xs` per §0.2 avatar fallback allow-list) + name + `<ChannelBadge>` + relative time + amount via `<Money>` + `<StatusBadge>`. Footer: "Все платежи" + lucide `ArrowRight` → `/payments/transactions`.
- **Unpaid Students panel.** 10 rows: name + dept + amount + days-overdue in `text-destructive` (ICU plural via `daysOverdue_one/few/many/other` in `ru.json`). Footer: "Все просроченные" link + `<WriteButton variant="destructive">Отправить массовое напоминание</WriteButton>` → `<ConfirmDialog>` (`destructive` + `requireReason` + `minReasonLength={20}`) → MSW `POST /api/students/bulk-remind` → sonner toast with sent count. Reason note re-uses the global `ConfirmDialog` default after its 10 → 20 bump.
- **6 states per panel.** `PanelStates.tsx` exports `KpiCardSkeleton`, `ChartSkeleton`, `ListRowSkeleton`, `PanelEmptyState`, `PanelErrorState` (with retry), `PanelOfflineState` (no-cache), `PanelOfflineNote` (banner above stale data), `PanelPartialNote` (shown/total banner). All 5 panels render every state.
- **MSW.** [`src/mocks/handlers/dashboard.ts`](../src/mocks/handlers/dashboard.ts) seeds 240 deterministic students (mulberry32 seeded on brand-600 hex). Six endpoints: summary, revenue, status-breakdown, recent transactions, unpaid-top, bulk-remind. `?_state=partial|empty|error` query override on every GET makes 6-state coverage QA-reproducible without flipping the network.
- **Response `_meta`.** Each GET response carries optional `_meta?: { partial?, shown?, total? }`. List endpoints return `{ items, _meta }` shape; summary/revenue/status-breakdown carry `_meta` flat on the data root.
- **GreetingTitle.** `setTimeout(msUntilNextHour)` self-re-arms at each top-of-hour so the greeting flips morning, day, evening live without a reload.

## Organization feature module
- [`features/organization/`](../src/features/organization/) — `/organization/*` with 4 sub-routes for **Profile · Departments · Bank Accounts · Branding**. Nested under `<OrganizationLayout>` which renders `<PageHeader>` + `<OrgTabsNav>` + `<Outlet />`. Tabs strip is normal-flow (not sticky) and bleeds to viewport edges on mobile via `-mx-4 md:mx-0 overflow-x-auto whitespace-nowrap` so it horizontally scrolls without truncation. Tab links use `<Link to="/organization/{slug}" aria-current={isActive ? 'page' : undefined}>`.
- **Add flows are full pages, not overlays.** Two routes register **outside** the OrganizationLayout (sibling routes, no tabs): `/organization/bank-accounts/new` → [`AddBankAccountPage`](../src/features/organization/pages/AddBankAccountPage.tsx) and `/organization/departments/new[?parentId=X]` → [`AddDepartmentPage`](../src/features/organization/pages/AddDepartmentPage.tsx). Both pages follow §0.5 detail-page convention: `<BackLink to="…" pluralName="…" />` row → `text-page-title` heading → form `max-w-2xl space-y-4` → fixed-bottom action bar (Pattern A) with `md:left-[var(--sidebar-width,4rem)]` offset. Cancel + Save buttons are equal-width on mobile (`flex-1`), content-sized right-aligned at `md+`. Logged in DECISIONS 2026-05-11 ("add flows are pages").
- **Profile** (`/organization/profile`): 2-col `md:grid-cols-2`. Left = RHF + Zod factory (`nameRu/Uz/En`, `type` read-only, `tin` read-only, `legalForm` Select, `region` Select from `UZ_REGIONS`, `address` Textarea, `website` URL, `foundedYear`). Right = branding preview card (logo 128×128, primary color swatch + HEX, "Edit on Branding tab" link with `ArrowRight`) + live `<ReceiptPreview>`. Bottom: `<WriteButton>Сохранить изменения</WriteButton>`. 6 states (loading skeleton matching layout / error w/ retry / offline / partial banner / empty (N/A) / data).
- **Departments** (`/organization/departments`): two-pane on `md+`, single-pane + bottom Sheet on mobile.
  - **Tree** (left, 2fr): `useDepartments` fetches a **flat** `Department[]` and `buildTree()` derives the nested form via `useMemo`. Search Input (200ms debounce, auto-expands ancestors of matches). `<DndContext>` from `@dnd-kit/core` with `PointerSensor` activated by **`delay: 250, tolerance: 8`** (so touch scroll wins by default; long-press starts a drag — fixes mobile touch-vs-scroll conflict). `closestCorners` collision; cycle-prevention via `descendantIds(items, draggedId)` banned-set passed to each `useDroppable` as `disabled`. A separate root drop zone (`__root__` id) appears only during drag to allow dropping a node back to root. On drop → `<ConfirmDialog>` "Переместить {dept} в {newParent}?"; if `dept.studentCount > 50`, dialog requires reason ≥20.
  - **Nodes** ([`DepartmentNode.tsx`](../src/features/organization/components/DepartmentNode.tsx)): recursive render with type-aware icons (faculty/department/class/group/other). Mobile uses `h-11` (44px tap target) + `12px` per-level indent + chevron `size-9`; desktop uses `h-10` + `16px` indent + `size-7` chevron. Action icons cluster (`Pencil / Plus / Trash2`) is `hidden md:flex md:opacity-0 md:group-hover/row:opacity-100 md:focus-within:opacity-100` — mobile users open the bottom-Sheet detail panel (which provides the same actions plus a "+ Add child" button) by tapping the row.
  - **Detail panel** ([`DepartmentDetailPanel.tsx`](../src/features/organization/components/DepartmentDetailPanel.tsx)): right pane on `md+`, bottom Sheet (`h-[90dvh]` flex-col with `shrink-0` header/button + `min-h-0 flex-1` body) on mobile. Form fields: `nameRu` / `nameUz` / `type` Select / `headStaffId` (text input placeholder for now — real staff Combobox lands when `/staff` page ships) / `paymentTypes` Checkbox group (tuition / dormitory / other) / `notes` Textarea + read-only `studentCount`. Footer: Delete (left, destructive WriteButton → cascade-aware ConfirmDialog) · Cancel · Save (right, WriteButton).
  - **Cascade delete**: clicking Delete on a node with children opens `<ConfirmDialog requireReason minReasonLength={20} destructive>` with body "Удалить «X» вместе с N дочерними и M студентами? Это действие нельзя отменить." Server cascades the subtree via `descendantsOf(...)` in the MSW handler.
- **Bank Accounts** (`/organization/bank-accounts`): card list, 1 per account. [`BankAccountCard.tsx`](../src/features/organization/components/BankAccountCard.tsx) is `Card overflow-hidden` so the inner footer-border-top clips cleanly. Card body: bank logo (lucide `Building2`) + bank name + `<MaskedAccount>` + label + currency + Default badge if `isDefault` + verification `<StatusBadge>` (`paid` = Verified / `pending` = Awaiting / `failed` = Failed). Footer actions: `[По умолчанию]` (only when not default + verified) + `[Редактировать]` + `[Удалить]` (WriteButton destructive → ConfirmDialog reason ≥20).
  - **Edit** stays in a `<ResponsiveSheet>` via [`BankAccountForm.tsx`](../src/features/organization/components/BankAccountForm.tsx) (edit-only after the add-page extraction). Shows a `<BankImmutableSummary>` card listing the immutable bank/MFO/account/holder values + editable label / isDefault / currency. The summary stacks each detail in its own row (label `text-xs uppercase tracking-wider` definition-label allow-listed by §0.2 + value `text-sm font-medium`, with `tabular break-all` on MFO + account number) and each row is a tap-to-copy `<button>` — `navigator.clipboard.writeText` with a hidden-textarea + `execCommand` fallback for non-secure contexts, `navigator.vibrate?.(10)` feature-detected haptic, trailing icon swaps `Copy → Check (success-700)` for 1500ms, sonner toast + `sr-only role="status" aria-live="polite"` announcement.
  - **Add** is the standalone page at `/organization/bank-accounts/new` ([`AddBankAccountPage.tsx`](../src/features/organization/pages/AddBankAccountPage.tsx)). Uses `<BankPickerFields>` + `<CurrencyPicker>` from [`BankAccountFormParts.tsx`](../src/features/organization/components/BankAccountFormParts.tsx) (shared between page and Sheet). On submit → MSW `POST /api/organization/bank-accounts` returns `verification: 'pending'` + sets a server-side `setTimeout(5000)` that flips it to `'verified'`; client-side `useBankAccountMutations.create.onSuccess` does an optimistic cache patch + schedules `queryClient.invalidateQueries` at 5500ms to pick up the verified flip.
  - **Default-account exclusivity**: `setDefaultBankAccount` MSW endpoint sets `isDefault: true` on the target and `false` on all others. Client cache mutation does the same. `useBankAccountMutations.create.onSuccess` also unsets others if the new account is marked default.
- **Branding** (`/organization/branding`): 2-col. Left = `<LogoUploader>` (2MB max, min 256×256, PNG/SVG/JPG via `accept` prop; `<WriteButton variant="destructive">` for delete-logo → ConfirmDialog reason ≥20) + `<ColorPicker>` (default `#1558B0`, **does NOT mutate `:root`** — saved color is org-data applied to receipts/exports only) + `<Textarea>` receipt footer (max 200, char counter). Right = live `<ReceiptPreview>` driven by RHF `watch()` with `style={{ color: primaryColor }}` on the receipt header only.
- **MSW** ([`src/mocks/handlers/organization.ts`](../src/mocks/handlers/organization.ts)): 16 endpoints — `GET/PATCH /api/organization`, `GET/POST/PATCH/DELETE /api/organization/departments[/:id]`, `POST /api/organization/departments/:id/move`, `GET/POST/PATCH/DELETE /api/organization/bank-accounts[/:id]`, `POST /api/organization/bank-accounts/:id/set-default`, `GET/PATCH /api/organization/branding`. `?_state=partial|empty|error` QA override on every GET. Fixtures: 1 TATU organization, **111-node tree** (3 faculties × 4 departments × 2 years × 3 groups = 72 leaves + 39 inner nodes), 2 bank accounts (both UZS verified, one default), default branding (brand-600 + "Спасибо за оплату!" footer).
- **Shared promotions**: [`LogoUploader`](../src/components/shared/LogoUploader.tsx) / [`ColorPicker`](../src/components/shared/ColorPicker.tsx) / [`ReceiptPreview`](../src/components/shared/ReceiptPreview.tsx) moved from `features/onboarding/components/` to `src/components/shared/`. `LogoUploader` is now parameterized via a `labels: { dropHint, choose, remove, errorType, errorSize, errorDimensions? }` prop (consumers pass `t(...)` results) + `maxSizeBytes` (default 1MB) + `minDimensions?` (org branding passes `{ width: 256, height: 256 }`) + `accept` (default PNG/SVG/JPG). `ReceiptPreview` reads from a new `common.receipt.*` i18n namespace (was `onboarding.receipt.*`). Onboarding Step 2 + Organization Profile/Branding all consume from `shared/`.
- **Cross-feature imports flagged for follow-up**: Organization imports `<PanelStates>` primitives from `features/dashboard/components/PanelStates.tsx` and `<BankCombobox>` from `features/onboarding/components/BankCombobox.tsx`. Both candidate for promotion to `shared/` to keep `design-system-layers.md` import direction strict (Components → Tokens/Primitives only, no cross-feature). Logged in DECISIONS 2026-05-11.
- **Scroll/overflow plumbing** ([`ResponsiveSheet`](../src/components/shared/ResponsiveSheet.tsx) + every internal scroll wrapper): both mobile (`flex max-h-[90dvh] flex-col`) and desktop (`flex max-h-[85vh] flex-col`) branches now use `shrink-0` for header/footer and `min-h-0 flex-1 overflow-y-auto` for the middle slot. The wrapper carries `-mx-1 px-1` (outset by 4px) so the input focus ring (`ring-2 ring-offset-2`) clears the scroll container's clip line — without this, `overflow-y-auto` implicitly forces `overflow-x: auto` per CSS spec and clips the horizontal ring. Same outset pattern applied to `DepartmentDetailPanel`'s form-fields scroll wrapper and `DepartmentTree`'s tree list. `DepartmentDetailPanel`'s `<form className="flex h-full min-h-0 flex-col">` carries the `min-h-0` chain so its `flex-1 overflow-y-auto` body actually engages.

## Onboarding feature module
- [`features/onboarding/`](../src/features/onboarding/) — 5-step linear wizard for new institution accounts. Triggered when `user.onboardingComplete === false`.
- **State**: `OnboardingProvider` (React Context — local feature state, not module store per the spec note in §0.12). Carries `draft` (current values + `completedSteps[]`) and mutators. Hydrated from `GET /api/onboarding/draft` on mount.
- **Persistence**: every Continue / Save & exit calls `PATCH /api/onboarding/draft`. If `useNetworkState()` is `false`, [`useOfflineDraftQueue`](../src/features/onboarding/hooks/useOfflineDraftQueue.ts) writes to `localStorage: unipay-onboarding-draft-queue` and an effect on `online` flushes via PATCH.
- **Step guard**: `OnboardingPage` reads `:step` param and renders the matching component. If user requests a step beyond `max(completedSteps) + 1`, redirects to the highest allowed step. Step 1 is always allowed.
- **Pages**: Step 1 org info (RU/UZ name, type, legal form, TIN regex `\d{9}`, founded year, region, address, website). Step 2 contact + branding (email pre-filled from `useSession`, masked `+998 (XX) XXX-XX-XX` phone, drag-drop logo with 1MB / PNG·JPG·SVG cap, native color picker + HEX text, receipt preview live via `watch()`; mobile receipt preview opens in a bottom Sheet). Step 3 bank accounts via `useFieldArray` with searchable `BankCombobox` (cmdk + Popover) auto-filling MFO; USD radio disabled with "Скоро" tooltip; `isDefault` exclusive across array. Step 4 departments — radio for template/skip; if template, fetch from `GET /api/onboarding/templates/:type` with all 6 states (loading skeleton, empty, error+retry, offline-no-cache, offline-cached, data); editable `DepartmentTreeEditor` (rename / add child / remove). Step 5 invite staff (optional `useFieldArray`); finish path uses `<WriteButton>` + `POST /api/onboarding/complete` + `updateUser({ onboardingComplete: true })` + dynamic-imported `canvas-confetti` + sonner success toast + redirect to `/`.
- **Sidebar lock**: `OnboardingPage` calls `setOnboardingActive(true)` on mount, `false` on unmount. Sidebar reads `useAppShell().onboardingActive` and renders nav items as disabled `<span>` with `Tooltip` "Завершите настройку, чтобы продолжить" instead of `<NavLink>`.
- **Skip Setup**: a ghost "Пропустить" button lives in the `OnboardingLayout` sticky bar (right-aligned next to `StepIndicator`) on every step. Click → `ConfirmDialog` (no reason note required — not destructive in the audit sense) → same finish-path as Step 5 (`useOnboardingComplete` + `updateUser({ onboardingComplete: true })` + toast + `navigate('/')`). Lives in [`SkipSetupButton.tsx`](../src/features/onboarding/components/SkipSetupButton.tsx). Persists whatever draft the user has already saved.

## Auth feature module
- [`features/auth/`](../src/features/auth/) — sign-in, forgot-password, reset-password.
- `signIn` flow: form (RHF + Zod factory schema, `t`-aware) → `signIn(email, password)` async → MSW `POST /api/auth/sign-in` → role picked by email-prefix dev fixture or domain hint (`@admin.` / `@finance.` / `@operator.` / `@viewer.`, default `finance_manager`) → session in `sessionStorage` → redirect to `?next=` (must start with `/`) or `/`.
- Failed-attempts lockout: 5 fails / 15-min window via [`useFailedAttempts.ts`](../src/features/auth/hooks/useFailedAttempts.ts). `LockedAlert` shows live `M:SS` countdown.
- `PasswordField` is `Input` + `Eye`/`EyeOff` toggle (36×36, deviation in DECISIONS); `autoComplete` forwards from caller (`current-password` on sign-in, `new-password` on reset).
- `DevRoleSwitcher` (DEV-only): 4 buttons, `signInAsRole(role)` bypasses MSW for fast role swapping.
- `forgot-password`: always-200 MSW (no enumeration leak); success view replaces form with `<Alert variant="success">` confirming the email.
- `reset-password`: token from `?token=`. Missing → toast + redirect. Submit → MSW (must start `valid-`). On success → success toast + redirect. On reject → error toast + redirect.
- AuthLayout has lg+ brand panel split (left: `bg-brand-600` + radial gradient + logo + tagline; right: form column with logo hidden, ThemeToggle visible).

## Open work / not yet done
- Real backend auth (currently sessionStorage placeholder + MSW). The `lib/auth.ts` `signIn` is now async-shaped, swapping to a real backend is a fetch URL change.
- Real i18n keys for feature screens 5-12 (auth + onboarding + dashboard + organization keys done).
- Feature pages 5–12: students, transactions, pending, refunds, reports, payouts, settings — placeholders only.
- Dashboard's institution subtitle (name · type) still uses a placeholder constant `УНИПЭЙ · Университет` in [`DashboardPage.tsx`](../src/features/dashboard/pages/DashboardPage.tsx) — wire to the now-available `GET /api/organization` endpoint when polishing the dashboard greeting.
- Promote `PanelStates` from `features/dashboard/components/` to `src/components/shared/` (and update 5 dashboard imports + 1 org-module import). Same for `BankCombobox` from `features/onboarding/components/`. Both currently cross-feature-imported.
- Department `headStaffId` field on the Detail panel is a plain text Input today (placeholder until `/staff` page exists and exposes a staff Combobox). Swap to a real searchable Combobox when that lands.
- MSW dashboard date-range filter — handlers still accept `?range=&from=&to=` but the seed isn't date-windowed. Same for new org endpoints (`_state` overrides only). Wire when backend lands or when fixtures need it for demo polish.
- Dashboard `?range=&from=&to=` filter currently ignored by MSW (handlers accept the params but the seed isn't date-windowed); wire real date filtering when the backend lands or when fixtures need it for demo polish.
- Dashboard panel deep-links target placeholder routes (`/payments/transactions`, `/payments/pending`, `/payments/pending?tab=overdue`); these resolve to `<Placeholder />` today. Land when those feature pages ship.
- Chord listener implementation (`g d` etc.) — registry exists, dispatcher doesn't.
- Theme toggle wired but dark-mode token coverage not yet QA'd in every component.
- Sidebar role-aware filtering (uses `roles?: Role[]`) — registry doesn't carry roles yet.
- "Remember me" checkbox is wired visually only — no longer-lived persistence layer behind it yet.
- Onboarding: organisation `primaryColor` is captured but does NOT mutate `:root` tokens (per spec note — that lands in a later prompt). Test transfer flow note shown to user is informational only — no actual transfer fires.

## Verification status
- `npm run typecheck` — clean
- `npm run lint --max-warnings 0` — clean
- `npm run build` — clean (only chunk-size advisory)
- §0.9 audit greps — clean (every `text-xs` hit maps to allow-list)

## Discipline pointers
- All design constraints: [`STYLE_DISCIPLINE.md`](../STYLE_DISCIPLINE.md) v2.0 (§0.1 colors, §0.2 typography, §0.3 layout, §0.4 sidebar, §0.5 detail page, §0.6 tables, §0.7 mobile, §0.8 state coverage, §0.9 forbidden patterns, §0.10 acceptance, §0.11 system states, §0.12 module-level state stores).
- Deviations log: [`docs/DECISIONS.md`](../docs/DECISIONS.md).
- Surface status table: [`docs/product_states.md`](../docs/product_states.md).
- This snapshot can decay — check git history before trusting it on tech-stack questions.
