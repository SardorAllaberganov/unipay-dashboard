# HISTORY.md — UNIPAY Merchant Dashboard

Append-only log of major changes. Most recent on top.

---

## 2026-05-12 — Reports module polish round (ExportForm spacing + data-type radio width + Department donut sizing/legend)

**Summary.** Five small visual fixes on the Reports module surfaces that landed the previous day, all driven by user feedback. None touch logic / data flow — pure layout and typography corrections.

**Files modified.**
- [`src/features/reports/components/ExportForm.tsx`](../src/features/reports/components/ExportForm.tsx) — three `space-y-2` → `flex flex-col gap-2` swaps on the label-over-control blocks (dateRange / format / grouping). Root cause: shadcn's `<Label>` renders `<label>` which defaults to `display: inline`; Tailwind's `space-y-*` puts `margin-top` on siblings, and vertical margin is ignored on inline elements, so the gap visually collapsed to zero. `flex flex-col gap-2` works regardless of child display. The data-type `<fieldset>` keeps `space-y-2` (legend is block by default).
- [`src/features/reports/components/ExportForm.tsx`](../src/features/reports/components/ExportForm.tsx) — data-type `<RadioGroup>` className bumped from `grid-cols-1 sm:grid-cols-2` to `grid-cols-1 sm:grid-cols-2 md:grid-cols-4` so Transactions / Students / Overdue / Payouts sit in one row on `md+`.
- [`src/features/reports/components/DepartmentBreakdownChart.tsx`](../src/features/reports/components/DepartmentBreakdownChart.tsx) — center label was overflowing the donut hole. `formatUZS(298_436_322)` at `text-2xl font-mono` is wider than the 128px inner-circle diameter. Fix: switched to `formatCompact` ("298,4 млн"); moved the currency code "UZS" to the smaller label line below ("Всего получено · UZS"); container gets `px-4 text-center`; big number gets `max-w-[7.5rem] truncate` clamp. Imported `formatCompact` from [`lib/format`](../src/lib/format.ts).
- [`src/features/reports/components/DepartmentBreakdownChart.tsx`](../src/features/reports/components/DepartmentBreakdownChart.tsx) — donut size bumped: container `h-56` → `h-72` (224 → 288px) across all 5 state placeholders (data / loading / error / offline / empty) so reflow stays consistent; `innerRadius` 64 → 80 / `outerRadius` 92 → 120; max-width clamp loosened from `max-w-[7.5rem]` to `max-w-[9.5rem]` now that the inner hole grew to 160px; big number bumped to `text-2xl md:text-3xl`.
- [`src/features/reports/components/DepartmentBreakdownChart.tsx`](../src/features/reports/components/DepartmentBreakdownChart.tsx) — legend list restructured from a centered wrapping chip row (`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm`) to a vertical list. Each row is `flex items-center gap-3` with color dot + dept name on the left (`min-w-0 flex-1 truncate`) and amount right-aligned (`whitespace-nowrap tabular`). Long department names truncate; amount column always sits at a stable right edge.

**Files updated for doc sync.**
- [`docs/product_states.md`](../docs/product_states.md) — `/reports` flipped from `❌ Placeholder` to `✅` with full scope description for `/reports/summary` and `/reports/export`. Added Foundation rows for the Reports module, the new `reports.ts` MSW handler, the shared KpiCard/KpiSparkline promotion, `<ExpiryCountdown>`, and the `useReportRangeParam` hook. "Outstanding follow-ups" updated: Reports MSW handler does `bucketsInRange` windowing — port to dashboard handler when convenient; recent-exports download links point at placeholder `/mock-downloads/{fileName}`.
- [`ai_context/AI_CONTEXT.md`](AI_CONTEXT.md) — new "Last updated" entry summarizing the polish round; the Reports feature-module section updated in place to reflect the new donut sizing, center-label clamp behavior, legend layout, and ExportForm spacing rules.

**Verifications.** `npx tsc -b` clean. `npm run lint --max-warnings 0` clean (one earlier `react-hooks/exhaustive-deps` warning on `ByDayTable.items` was fixed by wrapping the initialization in `useMemo`). No build run — no source-of-truth code changed, only visual tweaks.

---

## 2026-05-11 — Prompt 8 (Reports module) shipped end-to-end

**Summary.** Built the Reports / Analytics feature module per spec §10 — two sub-routes under `/reports/*` (Summary and Export), a nested `<ReportsLayout>` with tabs that preserve `?range=&from=&to=` across switches, three Recharts visualizations using scale tokens only (no hex), a sortable paginated by-day DataTable that follows the column-meta header/cell mirroring lesson, an export-job lifecycle with inline polling status (never spinner-only), and a 6-state recent-exports list with `<ExpiryCountdown>`.

**Files added.**
- `src/features/reports/pages/`: `ReportsLayout.tsx`, `SummaryPage.tsx`, `ExportPage.tsx`.
- `src/features/reports/components/`: `ReportsTabsNav.tsx`, `SummaryKpiRow.tsx`, `RevenueOverTimeChart.tsx`, `ChannelBreakdownChart.tsx`, `DepartmentBreakdownChart.tsx`, `ByDayTable.tsx`, `ExportForm.tsx`, `RecentExportsList.tsx`, `ExpiryCountdown.tsx`.
- `src/features/reports/hooks/`: `useSummary.ts`, `useByDay.ts`, `useGenerateExport.ts`, `useExportsList.ts` (+ `useDeleteExport`), `useExportPolling.ts`, `useReportRangeParam.ts`.
- `src/features/reports/`: `api.ts`, `schemas.ts`.
- `src/mocks/handlers/reports.ts` — 6 endpoints, 90-day deterministic per-day bucket fixture, in-memory exports `Map` with `setTimeout`-free wall-clock auto-flip from `processing → ready` after 3s.

**Files moved (KpiCard promotion).**
- New: `src/components/shared/KpiCard.tsx`, `src/components/shared/KpiSparkline.tsx`.
- Deleted: `src/features/dashboard/components/KpiCard.tsx`, `src/features/dashboard/components/KpiSparkline.tsx`.
- Repointed: [`features/dashboard/components/KpiRow.tsx`](../src/features/dashboard/components/KpiRow.tsx) import.
- Logged in [`docs/DECISIONS.md`](../docs/DECISIONS.md) 2026-05-11.

**Files modified.**
- [`src/router.tsx`](../src/router.tsx) — replaced the `/reports` Placeholder with a nested `<ReportsLayout>` carrying `index → Navigate to "summary"` + `summary → <SummaryPage>` + `export → <ExportPage>`.
- [`src/mocks/handlers/index.ts`](../src/mocks/handlers/index.ts) — spreads `reportsHandlers`.
- [`src/lib/i18n/locales/ru.json`](../src/lib/i18n/locales/ru.json) + [`uz.json`](../src/lib/i18n/locales/uz.json) — new `reports.*` namespace, ~110 keys including ICU-plural sets (`kpis.payoutCountUnit`, `recent.rowsLabel`, `expiry.days`, `expiry.hours`).
- [`docs/DECISIONS.md`](../docs/DECISIONS.md) — two new entries (KpiCard promotion + shared URL range across tabs).

**Lesson-aware details.**
- ByDayTable columns follow the column-meta rule from `LESSONS.md` (2026-05-11 entry): date + payout columns get `w-[1%] whitespace-nowrap` on BOTH header AND cell; amount + transactions columns mirror `text-right whitespace-nowrap` on both sides. No headers wrap to two lines; no cells break at digit-group spaces.
- All Money arithmetic in components reads `Number(money.amount) / 100` (per the BigInt-on-the-wire-is-actually-a-number lesson). `formatMoney` not used directly because Reports works in UZS major units via `formatUZS(tiyinsToUzs(n))` for consistency with Dashboard.
- No `position: sticky` on any chrome — DateRangePicker triggers, ReportsTabsNav, the ExportForm submit button all flow inline.
- `<WriteButton>` on every write action (Сгенерировать, Удалить in recent exports). Offline tooltip auto-handled.
- All chart fills via `hsl(var(--brand-600))` / `hsl(var(--success-600))` / etc. — zero hex in new code.
- Recharts `tick.fontSize: 13` everywhere; tooltip `contentStyle.fontSize: 13`.
- Every chart, KPI row, by-day table, recent-exports list implements all 6 states (loading / empty / error+retry / offline / partial / data) via `<PanelStates>` primitives.
- `?range=&from=&to=` URL state is the single source of truth shared across tabs — switching from Summary to Export keeps the active range. ExportForm initializes its `dateRange` field from URL state and remains form-local after first edit. Logged in DECISIONS.

**Verifications.** `npx tsc -b` clean. `npm run lint --max-warnings 0` clean. `npm run build` clean (only chunk-size advisory unchanged). §0.9 audit greps clean across the new code (all `text-xs` hits map to allow-list: payout pill chip body, KpiCard uppercase tracking-wider category label). Repo-wide regression greps (`text-[1[012]px]`, `h-screen`, `sticky.*thead`, `<svg`) zero. Dev server boots without compile errors.

**Open follow-ups.**
- Recent-exports download links target `/mock-downloads/{fileName}` — no actual file generation; wire client-side CSV/NDJSON or backend stream when exporting becomes real.
- Dashboard MSW handler still ignores `from/to`; Reports handler shows the windowed-bucket pattern that could be ported when convenient.

---

## 2026-05-11 — Build fix: `<StudentsTable>` `pagination` prop type missing `onPageSizeChange` / `pageSizeOptions`

**Summary.** `npm run build` failed with `TS2322: Object literal may only specify known properties, but 'onPageSizeChange' does not exist...` at [`StudentsListPage.tsx:225`](../src/features/students/pages/StudentsListPage.tsx#L225). `<StudentsListPage>` was already wired with the URL-synced per-page selector (the Payments-module polish round propagated this to Students / Transactions / Staff / Pending), but `<StudentsTable>`'s local `pagination` prop interface at [`StudentsTable.tsx:22-27`](../src/features/students/components/list/StudentsTable.tsx#L22-L27) was a stale subset carrying only `page / pageSize / total / onPageChange`. The underlying `<DataTable>` `PaginationProps` already accepts the two optional fields, and `<StudentsTable>` just forwards `pagination={pagination}` verbatim — so the fix is a pure type-level extension on the wrapper. No runtime change.

**Files written.**
- Modified: [`StudentsTable.tsx`](../src/features/students/components/list/StudentsTable.tsx) — added `onPageSizeChange?: (pageSize: number) => void` + `pageSizeOptions?: number[]` to the `pagination` prop interface so it mirrors `DataTable.PaginationProps`.

**Verifications.** `npm run build` (tsc -b && vite build) clean. `npm run lint` clean.

**Lessons.** Not added to LESSONS.md — this is a one-shot wrapper-drift defect. Generalization for future passes: when extending `DataTable.PaginationProps` (or any shared primitive's prop interface) with new optional fields, audit per-feature wrapper types that duplicate a subset of the shape — `<StaffTable>`, `<TransactionsTable>`, `<PendingTable>`, `<RefundsTable>`, `<StudentsTable>` all define local `pagination` props. Either re-export `PaginationProps` from `DataTable` and consume by name, or duplicate the full interface; never define a subset.

---

## 2026-05-11 — Payments module polish round 2 + pagination/banner refinements (cross-cutting)

**Summary.** Second wave of user-driven polish on the Payments module, plus several cross-cutting fixes to the shared `<DataTable>` pagination block that now propagate to Students / Staff / Pending list pages too.

**Pending table fixes** ([`PendingTable.tsx`](../src/features/payments/components/PendingTable.tsx)):
- `remaining` column: added `headerClassName: 'text-right'` (was only on the cell) + `whitespace-nowrap` on the cell.
- `dueDate` column: added `whitespace-nowrap` to BOTH header and cell — the "Дата и время" header was wrapping to two lines because the column collapses via `w-[1%]`.
- `daysOverdue` column (overdue tab): both sides get `text-right whitespace-nowrap`.

**Pending stats banner rewritten** ([`PendingOverdueStatsBanner.tsx`](../src/features/payments/components/PendingOverdueStatsBanner.tsx)) — was a bare sentence in a Card (wasted horizontal space, no visual hierarchy). Replaced with a KPI-style stat grid matching the dashboard's `<KpiCard>` rhythm: 2 columns on Pending tab (Students with debt / Total amount), 3 columns on Overdue tab (+ Просрочка >30 дней with destructive tint when > 0). Each column = lucide icon + uppercase tracking-wider label + `text-2xl md:text-3xl font-semibold tabular` value. Horizontal dividers on mobile (`divide-y md:divide-x md:divide-y-0`) so cleanly stacks vertically on narrow viewports.

**Per-page selector wired across all list pages**:
- [`PendingOverduePage.tsx`](../src/features/payments/pages/PendingOverduePage.tsx) — `PAGE_SIZE_OPTIONS = [25, 50, 100]` + `setPageSize` URL-synced. Also dropped the outer `<Card>` wrapping `<PendingTable>` (DataTable's own non-bare shell owns the chrome now).
- [`StaffListPage.tsx`](../src/features/staff/pages/StaffListPage.tsx) — same wiring; `updateParams` extended to handle `pageSize` resets. Pagination threshold lowered to `total > min(PAGE_SIZE_OPTIONS)` so the selector is reachable on smaller datasets.
- [`StaffTable.tsx`](../src/features/staff/components/list/StaffTable.tsx) — `pagination` prop interface extended with `onPageSizeChange` + `pageSizeOptions` pass-through.
- Students / Transactions already had this (last polish round).

**Mobile card-in-card eliminated**:
- [`PendingTable.tsx`](../src/features/payments/components/PendingTable.tsx) `mobileCardRender` was returning `<Card className="p-4">` while DataTable's mobile path ALREADY wraps each row in a `<Card>`. Switched root to plain `<div>` (canonical pattern matching `<StudentMobileCard>` / `<StaffMobileCard>`).
- [`RefundsTable.tsx`](../src/features/payments/components/RefundsTable.tsx) — same fix.
- [`RefundsPage.tsx`](../src/features/payments/pages/RefundsPage.tsx) — additionally dropped the section-level `<Card>` wrappers (had title + description) around each refund-table section. Replaced with plain `<section>` blocks (heading + description above the table). On mobile, this removed the remaining section-level card-in-card around the row cards.

**Mobile pagination layout** ([`DataTable.tsx`](../src/components/shared/DataTable.tsx) `<DataTablePagination>`):
- Row 1 on mobile: showing-text + per-page selector with `justify-content: space-between` (`flex items-center justify-between gap-3`).
- Row 2 on mobile: pagination buttons `justify-content: center` (`mx-0 w-auto justify-center sm:justify-end`).
- Both pieces in row 1 get `whitespace-nowrap` so labels don't wrap to multiple lines on narrow viewports.
- Desktop layout unchanged: row 1 grouped left with `gap-x-4`, row 2 right-aligned.

**Receipt modal sizes to content**:
- [`ReceiptPreviewIframe.tsx`](../src/features/payments/components/ReceiptPreviewIframe.tsx) — added `useRef` + `onLoad` handler that reads `Math.max(documentElement.scrollHeight, body.scrollHeight)` and sets the iframe's `style.height` accordingly. Initial 560px placeholder, then snaps to actual receipt content height once loaded. Modal now fits the receipt without trailing whitespace.
- [`ReceiptPreviewDialog.tsx`](../src/features/payments/components/ReceiptPreviewDialog.tsx) — dropped fixed `h-[92dvh] flex flex-col` layout; just `max-h-[92dvh] overflow-y-auto sm:max-w-3xl` so the dialog naturally sizes to content with viewport-overflow as a safety. Download button switched to default brand-primary variant (no `variant="outline"`).

**Transaction list polish (smaller fixes)**:
- ID column: `whitespace-nowrap` on cell (was wrapping `TXN-…FCD2` to two lines).
- Amount / Commission / Net columns: `headerClassName: 'text-right'` added (only cells had it before); both sides also get `whitespace-nowrap` so values like `"116 562 100 UZS"` never break at digit-group spaces.
- Removed the 3-dot kebab column — row click handles View; refund moved to detail page; copy-id available via mono `<TransactionIdCopy>` button.
- Row click navigates DIRECTLY to detail page (intermediate Sheet flow + `TransactionDetailSheet` component dropped per user feedback).
- Export button → brand-primary `<DropdownMenu>` with CSV / Excel / PDF (each with lucide file-type icon).
- Receipt section in detail content: replaced inline iframe with a "Просмотр чека" button that opens `<ReceiptPreviewDialog>`. Inline timeline made horizontal edge-to-edge (`h-[3px]` connector + `size-3.5` circles, past = `success-600`, failed = `destructive`).

**Two critical bug fixes** (separate from polish, both logged as lessons):
1. `RefundDialog` + `RefundsTable` threw `Cannot mix BigInt and other types` on `Number(amount.amount / 100n)` — MSW collapses bigint → number on the wire (BigInt.toJSON patch). Fix: `Number(amount.amount) / 100`.
2. Transactions page document over-scroll — `html.scrollHeight` was 4262px on this route only (vs 800 on every other page). Architectural fix: `html, body { height: 100%; overflow: hidden; }` in [`globals.css`](../src/styles/globals.css). Standard SPA app-shell pattern.

**Students table fix**:
- [`StudentsTable.tsx`](../src/features/students/components/list/StudentsTable.tsx) — `amount` column got `headerClassName: 'text-right'` + `whitespace-nowrap` on cell; `lastPayment` column got `whitespace-nowrap` (header + cell) so "Последний платёж" / "Нет платежей" stay on one line.

**Refunds table fix** (applying the same column-meta lesson):
- [`RefundsTable.tsx`](../src/features/payments/components/RefundsTable.tsx) — `originalTx` / `refundTx` / `bankRef` columns (all narrow `w-[1%]`) had no `whitespace-nowrap` on the header; headers like "Исходная транзакция" / "Транзакция возврата" / "Банковский номер" wrapped to two lines. Added `whitespace-nowrap` to header + cell. Also: `amount` column was missing `headerClassName: 'text-right'` (only the cell had `text-right`); added it plus `whitespace-nowrap` so values like "117 982 900 UZS" don't break at digit-group spaces.

**i18n keys added** ([`ru.json`](../src/lib/i18n/locales/ru.json) + [`uz.json`](../src/lib/i18n/locales/uz.json)):
- `common.pagination.{showing,pageOf,prev,next,rowsPerPage,goToPage}` (was hardcoded Russian)
- `common.actions.selectAll`
- `payments.list.exportCsv / exportXlsx / exportPdf`
- `payments.detail.previewReceipt`
- `payments.detail.receipt.*` (21 keys for the redesigned receipt iframe)
- `payments.pending.stats.{studentsLabel,amountLabel,overdueLabel}` (for the rewritten banner)

**Lessons added** to [`LESSONS.md`](LESSONS.md):
- DataTable column `meta` rule: `cellClassName: 'text-right'` doesn't propagate; the header needs `headerClassName: 'text-right'` too. Narrow `w-[1%]` columns need `whitespace-nowrap` on the header. Values with digit-group spaces (UZS amounts, datetimes, mono ids with `…`) need `whitespace-nowrap` on cells.

**Verifications.** Every iteration: `npm run lint` · `tsc --noEmit` clean. Headless-Chrome smoke checks at desktop (1280–1400 viewports) and mobile (390×844) viewports.

---

## 2026-05-11 — Prompt 7 (Payments module) shipped end-to-end + long polish round

**Summary.** Built the entire Payments module per spec §9 (4 routes, ~30 new files), then iterated through ~15 rounds of user-driven UX/visual polish. Net result: a working transactions list with filters / export-format dropdown / row-click-to-detail / per-page selector / right-aligned amounts; a Pattern A transaction detail page with a horizontal step timeline + modal-only receipt preview; a Pending+Overdue page with bulk actions; a Refunds page with 2-step approve/reject dialogs.

**Routes wired** in [`src/router.tsx`](../src/router.tsx) (replaced 4 Placeholder rows):
- `/payments/transactions` — list with `<TransactionFilters>` (status + channel chips, DateRangePicker, search), brand-primary "Экспорт" `<DropdownMenu>` (CSV / Excel / PDF), 9-column DataTable, `<SummaryFooter>` (∑ charged / ∑ commission / ∑ net). Row click → detail page directly (no intermediate Sheet — Sheet pattern dropped per user feedback). Per-page selector (25/50/100) in pagination block.
- `/payments/transactions/:id` — full-page Pattern A detail. `<TransactionDetailHeader>` (back-link + identity row + chips) → `<TransactionDetailContent>` sections (Student / Расчёт суммы / Канал и реквизиты / **horizontal `<TransactionTimeline>`** edge-to-edge / Чек button → `<ReceiptPreviewDialog>` modal) → `<TransactionDetailActionBar>` (Скачать чек + Возврат gated by `getRefundEligibility`).
- `/payments/pending` — Ожидающие / Просроченные tabs + `<PendingOverdueStatsBanner>` + paginated `<PendingTable>` with select checkboxes + shared `<BulkActionBar>` (Remind / Export / Manual-entry). `<ManualPaymentEntryDialog>` in a ResponsiveSheet with student→schedule cascade via `<StudentSearchPicker>`.
- `/payments/refunds` — two stacked Card sections (Pending / History) with `<RefundsTable>` × 2; Approve/Reject `<ConfirmDialog>` flows. Initiate refund from any tx detail page via `<RefundDialog>` (single Dialog with internal `step: 'review' | 'confirm'`; Step 2 requires typing `REFUND` + reason ≥20). MSW auto-approves pending refunds after 3s.

**Domain extensions** ([`src/types/domain.ts`](../src/types/domain.ts)):
- `FAILURE_CODES` × 4 (`INSUFFICIENT_FUNDS` / `CARD_DECLINED` / `TIMEOUT` / `INVALID_AMOUNT`)
- `TransactionEvent` + `TransactionEventType` (`created` / `processed` / `settled` / `failed` / `refunded`)
- `MANUAL_PAYMENT_METHODS` × 3 (`cash` / `bank_transfer` / `other`)
- `REFUND_REASONS` × 4, `RefundStatus` × 4, `Refund` interface
- `Transaction` extended with optional `failureCode`, `events`, `paymentMethod`, `receiptNumber`, `scheduleId`, `note`

**Shared primitive promotions** (now used by ≥ 2 modules):
- `<BulkActionBar>` extracted from Students module → [`src/components/shared/BulkActionBar.tsx`](../src/components/shared/BulkActionBar.tsx). Children-slot API. Existing Students consumer composes its specific actions inside.
- `<FilterStack>` + `<ChipGroup>` extracted from `StudentsFilters` → [`src/components/shared/FilterStack.tsx`](../src/components/shared/FilterStack.tsx).
- [`src/lib/errorCodes.ts`](../src/lib/errorCodes.ts) — UI-side mirror of the backend `error_codes` table (4 codes × category × retryable × i18n keys).
- [`src/lib/refundEligibility.ts`](../src/lib/refundEligibility.ts) — pure helper, returns `{ eligible, reason: 'not_paid' | 'too_old' | 'already_refunded' | null, reasonKey }`.

**MSW handler** ([`src/mocks/handlers/payments.ts`](../src/mocks/handlers/payments.ts)) — 9 endpoints, deterministic 820-transaction fixture (seeded LCG, channel mix per spec, 3 forced "stuck" pending >12min, failure-code variety, paginated). 14 history + 4 pending refund seeds. `setTimeout`-based auto-approve for new refund requests after 3 s.

**DataTable upgrades** ([`src/components/shared/DataTable.tsx`](../src/components/shared/DataTable.tsx)):
- New `bare?: boolean` prop strips the inner `rounded-lg border bg-card` shell so parent pages can own the chrome (avoids double-borders when wrapped in a Card).
- Pagination MOVED INSIDE the table's bordered shell — last table row's `border-b` is stripped by `TableBody`'s `[&_tr:last-child]:border-0`, and a `border-t` wrapper around `<DataTablePagination>` provides the divider. Pagination now also renders on mobile inside its own standalone card below the mobile card stack.
- `<DataTablePagination>` rewritten using shadcn `<Pagination>` primitives: shadcn-style clickable page numbers (`< Назад · 1 · 2 · … · 12 · Далее >`) with active page highlighted, `buildPageList()` helper for the 1…N±1…last ellipsis pattern.
- Optional `onPageSizeChange` + `pageSizeOptions` → renders a "Строк на стр. [50 ▼]" `<Select>` when provided. Wired in TransactionsPage and StudentsListPage (URL-synced `?pageSize=`).
- All hardcoded "Показано / Назад / Далее" strings replaced with `common.pagination.*` i18n keys in RU + UZ.
- Modified shadcn primitive [`src/components/ui/pagination.tsx`](../src/components/ui/pagination.tsx) — `PaginationPrevious` / `PaginationNext` no longer hardcode Russian labels; accept `children` for i18n.

**Receipt preview**:
- [`src/features/payments/components/ReceiptPreviewIframe.tsx`](../src/features/payments/components/ReceiptPreviewIframe.tsx) — HTML `srcDoc` styled as a tuition receipt: header (title + org name + receipt number + datetime), payer/recipient grid with `useOrganization` data, line-items table (`Оплата обучения` + commission row hidden when 0), totals (subtotal + к зачислению), meta grid (channel / status badge / mono TX id), footer (thanks + disclaimer). Auto-sizes via `useRef` + `onLoad` reading body `scrollHeight`.
- [`<ReceiptPreviewDialog>`](../src/features/payments/components/ReceiptPreviewDialog.tsx) — modal wraps the iframe, primary-variant "Скачать чек" triggers `window.print()`. Sizes to content (`max-h-[92dvh]` cap).
- Receipt rendered ONLY on press of "Просмотр чека" button in detail content section (was inline; user requested modal-only).

**Transaction timeline**:
- [`<TransactionTimeline>`](../src/features/payments/components/TransactionTimeline.tsx) — horizontal step diagram. Each step: half-line + size-3.5 circle + half-line + label/time below. First step's left half + last step's right half follow their own status, so the colored bar spans **edge-to-edge** (no inset gaps). `h-[3px]` thicker line for clarity. Past = success-600, failed = destructive, upcoming = muted-foreground/20.

**i18n** ([`ru.json`](../src/lib/i18n/locales/ru.json) + [`uz.json`](../src/lib/i18n/locales/uz.json)):
- New top-level `payments` block (~120 keys × 2 locales)
- New `errors.codes.*` block × 4 codes
- New `common.pagination.*` block (showing / pageOf / prev / next / rowsPerPage / goToPage)
- Added `common.actions.selectAll`, `payments.list.exportCsv|exportXlsx|exportPdf`, `payments.detail.previewReceipt`, `payments.detail.receipt.*` (21 keys)

**Critical bug fixes during polish**:
- **`BigInt.prototype.toJSON` collision in RefundDialog + RefundsTable** — code did `Number(transaction.amount.amount / 100n)` but MSW collapses bigint → number on the wire via the global `BigInt.prototype.toJSON` patch, so dividing a number by a bigint literal threw `TypeError: Cannot mix BigInt and other types`. The page rendered the ErrorState instead of the detail view. Fixed: `Number(transaction.amount.amount) / 100` works for both runtime forms. Same fix applied in two sites.
- **Document over-scroll on Transactions page** — the user reported scrolling past the bottom of the table revealed a blank screen. Diagnosis: `html.scrollHeight = 4262` on transactions only (other pages were 800 = viewport). Root cause unclear at the layout level, but the simpler architectural fix was to lock html/body to viewport: added `html, body { height: 100%; overflow: hidden; }` in [`globals.css`](../src/styles/globals.css). Standard SPA app-shell pattern — main owns all vertical scroll; document scroll is physically impossible. Also reverted an earlier `-mb-4 md:-mb-6` negative-margin hack on the page wrapper which was contributing to the leak.
- **Mobile transactions: card-in-card** — `<TransactionMobileCard>` was returning its own `<Card>`, while DataTable's mobile path already wraps each row in a `<Card>`. Two cards per row. Fixed by switching the mobile-card root to a plain `<div className="flex flex-col gap-2">` (matches canonical `StudentMobileCard` pattern). Dropped now-unused `onOpen` prop (parent Card handles click via `rowHref`).
- **Mobile pagination missing** — pagination was only rendered in DataTable's desktop branch. Now rendered in both branches; on mobile, wrapped in its own standalone bordered card.
- **Outer shell card-in-card on mobile** — TransactionsPage's `<div className="overflow-hidden rounded-lg border ...">` wrapping the mobile cards (already individually bordered) created a nested-card effect. Fixed: TransactionsPage now uses `useIsMobile()` to conditionally drop the outer shell on mobile; DataTable's `bare` prop only applied on desktop.

**Other polish** (chronological, user-driven):
- ID transaction TD `whitespace-nowrap` (was wrapping to two lines on narrow viewports). Same fix on Students table `lastPayment` column.
- Amount column headers in both Transactions table and Students table got `headerClassName: 'text-right'` (only the cell had it before; header stayed `text-left`). Combined with `whitespace-nowrap` on cells so values like "116 562 100 UZS" don't wrap at the digit-group spaces.
- Removed the 3-dot kebab column from transactions table (row click handles View; refund moved to detail page; copy-id available via the row's mono TXN button).
- Receipt iframe: 21 new i18n keys for proper receipt labels (`Чек № / Плательщик / Получатель / Наименование / Способ оплаты / Спасибо за оплату / disclaimer`), pulling `useOrganization` for org name + TIN. Was previously a generic 2-column dl that mislabelled fields.
- Receipt download button now uses default brand-primary variant (no `variant="outline"`) — matches "active button" feel.
- Export button restructured into a `<DropdownMenu>` with three format options (CSV / Excel / PDF), each with a lucide file-type icon. Trigger is brand-primary `<WriteButton>` with chevron-down.

**Files written**.
- **New**: ~32 files in [`src/features/payments/`](../src/features/payments/) (api / schemas / 4 hooks / 16 components / 4 pages); [`src/components/shared/BulkActionBar.tsx`](../src/components/shared/BulkActionBar.tsx); [`src/components/shared/FilterStack.tsx`](../src/components/shared/FilterStack.tsx); [`src/lib/errorCodes.ts`](../src/lib/errorCodes.ts); [`src/lib/refundEligibility.ts`](../src/lib/refundEligibility.ts); [`src/mocks/handlers/payments.ts`](../src/mocks/handlers/payments.ts).
- **Modified**: [`src/types/domain.ts`](../src/types/domain.ts), [`src/router.tsx`](../src/router.tsx), [`src/components/shared/DataTable.tsx`](../src/components/shared/DataTable.tsx), [`src/components/ui/pagination.tsx`](../src/components/ui/pagination.tsx), [`src/styles/globals.css`](../src/styles/globals.css), [`src/mocks/handlers/index.ts`](../src/mocks/handlers/index.ts), [`src/mocks/handlers/students.ts`](../src/mocks/handlers/students.ts) (added `getSeededStudents` + `getSeededScheduleRows` read-only exports for cross-handler seeding), [`src/features/students/components/list/{BulkActionBar,StudentsFilters,StudentsTable}.tsx`](../src/features/students/components/list/), [`src/features/students/pages/StudentsListPage.tsx`](../src/features/students/pages/StudentsListPage.tsx), i18n locales.

**Verifications**. `npm run lint` · `tsc --noEmit` · `npm run build` — all clean throughout. Headless-Chrome smoke checks at each polish round (row click navigation, pagination clicks, page-size change, refund dialog, receipt modal, mobile viewport).

**Lessons logged**:
- New entry in [`LESSONS.md`](LESSONS.md) (to be added in a separate doc-sync): `BigInt.prototype.toJSON` patch makes `Money.amount` a `number` at runtime — code that divides by `100n` will throw. Always `Number(x.amount) / 100`.
- New entry: html/body need `overflow: hidden; height: 100%` for SPA app-shell layouts where `main` owns all vertical scroll, otherwise certain pages can leak overflow up to the document and create a broken over-scroll.

---

## 2026-05-11 — CI lint fix: dropped stale `eslint-disable-next-line react-hooks/exhaustive-deps` in `Step3Review`

**Summary.** CI lint job failed with `Unused eslint-disable directive (no problems were reported from 'react-hooks/exhaustive-deps')` at [`Step3Review.tsx:99`](../src/features/students/components/import/Step3Review.tsx#L99). The deps array `[t, onPatch]` is already complete (no hook lint warning would fire), so the suppression was dead code surviving an earlier cleanup pass. Removed the comment line. The `lint` npm script runs eslint with `--report-unused-disable-directives --max-warnings 0`, so any stale suppression is a CI failure — not a warning.

**Files written.**
- Modified: [`src/features/students/components/import/Step3Review.tsx`](../src/features/students/components/import/Step3Review.tsx) — removed one `eslint-disable-next-line` comment.

**Verifications.** `npm run lint` — clean.

**Lessons.** Added to [`LESSONS.md`](LESSONS.md): after tightening a hook's dependency array (or any change that quiets a previously-noisy lint rule), grep the same file for the matching `eslint-disable-next-line` comment and remove it in the same change.

---

## 2026-05-11 — DataTable per-row cell merging (`meta.cellColSpan`) + staff pending-row badge/kebab merge

**Summary.** Reported alignment issue: in the staff list, the "Ожидает" badge in pending rows sat further from the kebab than the wider "Активен"/"Неактивен" badges did in non-pending rows. After several iterations (right-align, layout-only spacer column), settled on a structural fix: merge the last two `<td>`s for pending rows. Added a new `meta.cellColSpan: (row) => number` field to the shared `DataTable`'s `ColumnMeta` augmentation. The body row renderer walks cells with a `skip` counter — when a cell sets `cellColSpan > 1` for that row, the next N-1 cells are skipped and the rendered `<TableCell>` gets a `colSpan` attribute. Staff table's status column now uses `cellColSpan: (row) => row.status === 'pending' ? 2 : 1`; the pending-row status cell renders a `flex items-center justify-between` container with the badge on the left and the kebab on the right, sharing the right-edge of the row. Non-pending rows keep the standard 6-column layout (badge in status td, kebab in actions td). The intermediate `inviteResend` spacer column was removed entirely.

**Files written.**
- Modified: [`src/components/shared/DataTable.tsx`](../src/components/shared/DataTable.tsx) — `ColumnMeta.cellColSpan` declaration; body row mapping replaced with an imperative `for` loop that respects `skip` counter and emits `colSpan` on the rendered TableCell.
- Modified: [`src/features/staff/components/list/StaffTable.tsx`](../src/features/staff/components/list/StaffTable.tsx) — status column meta `{ cellColSpan, cellClassName: 'pr-3' }`; cell renderer branches on `row.status === 'pending'` (merged badge+kebab vs plain badge).
- i18n: `staff.row.resendAria` key added in RU + UZ (leftover from a discarded resend-button iteration; harmless, no consumer).

**Verifications.** typecheck · `eslint --max-warnings 0` — clean.

**Lessons.**
- TanStack React Table doesn't expose per-row colSpan directly, but `ColumnMeta` can carry a `(row) => number` callback that the DataTable body renderer evaluates per row. A `skip` counter on the cell loop is enough to honor it without touching column definitions globally.
- "Merge cells to align tail content" is sometimes the cleanest fix when adjacent columns have varying widths and want to share a right edge — beats fiddling with text-align / spacer columns / cell padding.

---

## 2026-05-11 — Students module: second polish round (Edit-as-page, action-bar grouping, mobile overflow fix, native date input, Transactions mobile card)

**Summary.** Another full sweep of the Students module driven by a surface-by-surface review by the user. Highlights:

1. **Edit Student converted from Sheet → standalone page** at `/students/:id/edit`. The earlier `<EditStudentSheet>` was deleted; `<StudentDetailActionBar>` no longer takes `onOpenEdit` — the Edit button navigates directly to the new route. New page uses Pattern A (back-link → page title → two `<Card>` sections for Personal + Academic → fixed-bottom Cancel/Save action bar). Lesson note: the original "edit stays in Sheets" rule from 2026-05-11 doesn't hold when the edit form has the same scope as the corresponding Add form — user wanted page consistency between Add and Edit.

2. **Action bar restructured by intent on both Add and Detail.** AddStudentPage: Cancel ghost LEFT, [Save & add another, Save & close] cluster RIGHT, separated by `md:justify-between`. StudentDetailActionBar: [Edit, Send SMS] (maintenance) LEFT, [Deactivate, Delete] (destructive) RIGHT, same `md:justify-between`. Mobile: each intent group on its own row with `flex-1` 50/50 buttons. Both action bars: dropped `mx-auto` + `max-w-{2xl,5xl}` inner constraints — bars span the full content width within the sidebar offset.

3. **Form sections wrapped in `<Card>`.** PersonalInfoSection / AcademicInfoSection / PaymentSetupSection on Add Student each render as a `<Card>` with `<CardHeader>` + `<CardContent>` so the three groups read as visually distinct boxed sections. Page-level `max-w-2xl space-y-8` kept; only the action bar shed its width cap.

4. **Student Profile horizontal overflow on mobile fixed.** Root cause: grid items (`<aside>`, `<section>`) inside the 2-col layout had no `min-w-0`, so the wide DataTable inside the Tabs section forced the grid track past the viewport. Added `min-w-0` on the outer wrapper + both grid items. Defensive `break-words` / `break-all` on the StudentDetailHeader text (`<h1>` long names + mono studentIds + dept path). ProfileLeftColumn's `<Row>` switched to **stack-on-mobile / horizontal-on-`md+`**: label is a small uppercase tracking-wider definition label (§0.2 allow-listed) above the value on mobile; row-based on desktop.

5. **TransactionsTab gets a mobile card render.** `<TransactionMobileCard>` — date + amount on top row (amount `text-base font-semibold` = loudest), channel + status badges on second row, receipt link `ml-auto` if present. Card click still opens `<TransactionDetailSheet>` via the existing `onRowClick` wiring. Schedule / Activity tabs still horizontal-scroll on mobile — flagged for a follow-up.

6. **Native date / time input fixes.** Added `justify-content: space-between` rule for `input[type='date' \| 'datetime-local' \| 'month' \| 'time' \| 'week']` in [`globals.css`](../src/styles/globals.css) — shadcn's base Input class applies `display: flex` (so the file: pseudo works), which packed the native shadow children together without a gap. The new rule pushes the date editor flush-left and the calendar picker indicator flush-right. Indicator gets `margin-left: auto` + visible muted-foreground tone + dark-mode `filter: invert(0.75)`.

7. **DateRangePicker triggers: icon moved to right.** Three call sites: Dashboard, Student Activity tab, Staff Activity tab — all swapped from icon-left to `<span>{label}</span><Icon />` with `justify-between`. Student Activity tab gained `useDateRangeLabel(range)` so the trigger reflects the current selection (`Последние 30 дней`) instead of the static "Date range" placeholder.

8. **Students filter bar landed on `<FilterStack>` after two earlier iterations** (inline labels, bordered containers). Each filter group renders a small uppercase tracking-wider §0.2-allow-listed label above its chips/picker. Chips upgraded to visible button styling: `border-border bg-card text-foreground` inactive, `border-brand-600 bg-brand-50 text-brand-700` active. Year chips (1–6) now unambiguous under the "КУРС" label.

9. **Student mobile card glanceability rewrite.** Killed the 4-row `<dl>` grid. New shape: identity row → status LEFT + balance RIGHT (`text-base font-semibold` for amount) → dept · year subtitle → "Последний платёж: {date}" as inline prose.

10. **`<DialogFooter>` + `<DialogHeader>` primitive fixes.** Footer: replaced `sm:space-x-2` with `gap-2` (works in both `flex-col-reverse` mobile and `sm:flex-row` desktop — there was no gap on mobile previously). Header: changed `text-center sm:text-left` to `text-left` always — the ConfirmDialog's flex-wrapped title was left-aligning by flex while the description inherited mobile text-center, producing a mismatched header.

11. **Onboarding skip labels** tried verbose ("Продолжить настройку" / "Пропустить настройку") at one point but reverted to the original simple verbs ("Отмена" / "Пропустить") per user preference.

12. **Top action buttons (Import + Add) split 50/50 on mobile** in `<StudentsListPage>` via a `flex w-full gap-2 md:w-auto` wrapper passed into PageHeader.

13. **ScheduleTab add-row 400 bug.** `addEmptyRow` was POSTing `period: ''` which the MSW handler validated as `invalid_input`. Now sends a localized `t('students.schedule.newRowPeriod')` placeholder ("Новый период" / "Yangi davr") the user can immediately inline-edit.

**Files written.**
- New: [`src/features/students/pages/EditStudentPage.tsx`](../src/features/students/pages/EditStudentPage.tsx) — standalone Edit Student page (Pattern A).
- Modified: [`src/router.tsx`](../src/router.tsx) (registered `/students/:id/edit`), [`src/features/students/pages/AddStudentPage.tsx`](../src/features/students/pages/AddStudentPage.tsx) (action bar groups + dropped mx-auto/max-w-2xl), [`src/features/students/pages/StudentProfilePage.tsx`](../src/features/students/pages/StudentProfilePage.tsx) (min-w-0 grid items + removed editOpen state and EditStudentSheet usage), [`src/features/students/pages/StudentsListPage.tsx`](../src/features/students/pages/StudentsListPage.tsx) (top button 50/50 wrapper), [`src/features/students/components/profile/StudentDetailActionBar.tsx`](../src/features/students/components/profile/StudentDetailActionBar.tsx) (intent-grouped layout + navigate to edit page), [`src/features/students/components/profile/StudentDetailHeader.tsx`](../src/features/students/components/profile/StudentDetailHeader.tsx) (break-words / break-all), [`src/features/students/components/profile/ProfileLeftColumn.tsx`](../src/features/students/components/profile/ProfileLeftColumn.tsx) (stack-on-mobile dl row), [`src/features/students/components/profile/TransactionsTab.tsx`](../src/features/students/components/profile/TransactionsTab.tsx) (TransactionMobileCard), [`src/features/students/components/profile/ScheduleTab.tsx`](../src/features/students/components/profile/ScheduleTab.tsx) (addEmptyRow period fix), [`src/features/students/components/profile/ActivityLogTab.tsx`](../src/features/students/components/profile/ActivityLogTab.tsx) (useDateRangeLabel + icon-right), [`src/features/students/components/list/StudentsFilters.tsx`](../src/features/students/components/list/StudentsFilters.tsx) (FilterStack + upgraded chips), [`src/features/students/components/list/StudentMobileCard.tsx`](../src/features/students/components/list/StudentMobileCard.tsx) (glanceability rewrite), [`src/features/students/components/add/{PersonalInfoSection,AcademicInfoSection,PaymentSetupSection}.tsx`](../src/features/students/components/add/) (Card wrappers).
- Primitives: [`src/components/ui/dialog.tsx`](../src/components/ui/dialog.tsx) (DialogFooter gap-2 + DialogHeader text-left), [`src/styles/globals.css`](../src/styles/globals.css) (date-input justify-content + picker indicator), [`src/features/dashboard/pages/DashboardPage.tsx`](../src/features/dashboard/pages/DashboardPage.tsx) + [`src/features/staff/components/detail/ActivityLogTab.tsx`](../src/features/staff/components/detail/ActivityLogTab.tsx) (DateRangePicker icon-right). i18n: added `students.schedule.newRowPeriod` + `students.edit.title` keys (RU + UZ); skipSetup labels reverted to simple verbs.
- Deleted: `src/features/students/components/profile/EditStudentSheet.tsx`.

**Verifications.** typecheck · `eslint --max-warnings 0` · `vite build` — all clean after every change.

---

## 2026-05-11 — Students module polish: BigInt serialization fix · stale i18n keys · filter UX iteration · mobile card rewrite · 50/50 top buttons

**Summary.** Round of post-build fixes and UX iteration on top of the Prompt 6 Students module:

1. **MSW bigint serialization (real bug).** Every Students endpoint embeds `Money` objects with `bigint` amounts (`{ amount: 500000000n, currency: 'UZS' }`). `HttpResponse.json` calls `JSON.stringify`, which throws on raw bigint — the entire list query was failing silently. Patched `BigInt.prototype.toJSON` once globally in [`src/main.tsx`](../src/main.tsx) to return `Number(this)`, which is safe because UZS tiyins (1e12 max for a 10-billion UZS payment) fit comfortably under `Number.MAX_SAFE_INTEGER` (9e15). `formatMoney` already accepts both bigint and number, so no consumer code had to change.

2. **Stale i18n keys in shared `<ErrorState>` + `<OfflineState>`.** They referenced `states.errorTitle` / `states.errorDescription` / `states.offlineTitle` / `states.offlineDescription` / `common.retry` — none of those keys exist (the canonical paths are `common.states.errorTitle` / `common.states.errorBody` / `system.offline.title` / `system.offline.body` / `common.actions.retry`). i18next falls back to rendering the key path verbatim when a key is missing, which is the literal text the user saw on screen. The visible bug **masked** the underlying bigint bug above — fixing the keys exposed the real error message and led directly to the BigInt patch. New lesson logged in [`LESSONS.md`](LESSONS.md): "literal key text on screen" means the key is wrong AND there's a real error bringing that state into view.

3. **Students filter UX iterated 3 times.** Bare-number year chips (`[1] [2] [3] [4] [5] [6]`) were unreadable when laid out inline next to status / edu chips — they looked like random integers. Attempt 1 added leading inline labels (`Курс: [1] [2] …`) — still cluttered. Attempt 2 wrapped each group in a bordered `h-9 rounded-md border bg-card` container — still felt boxy and uncertain. Attempt 3 (landed) restructured to a vertical `<FilterStack>` (small `text-xs font-medium uppercase tracking-wider` label on top, chips/picker below) matching the existing mobile bottom-Sheet structure. Chips also got upgraded visuals: inactive `border-border bg-card text-foreground` (read as pressable buttons, not loose muted text), active `border-brand-600 bg-brand-50 text-brand-700` (confident pressed state). Department Popover trigger simplified back to a plain `<Button variant="outline">` showing "Все" or "{count} active" — the `<FilterStack>` carries the "ОТДЕЛЕНИЕ" label, so the button doesn't need to repeat it.

4. **`<StudentMobileCard>` restructured for glanceability.** Killed the `<dl>` grid (4 sparse label/value rows). New shape: identity row (checkbox + sm avatar + name + studentId mono + kebab pinned right) → status LEFT + balance RIGHT (`text-base font-semibold` so the amount is the largest content on the card) → dept · year subtitle (single muted line, truncates instead of wrapping) → "Последний платёж: {date}" as inline prose. Kebab uses `-mr-1` to sit flush against the wrapping Card's right padding.

5. **Top action buttons split 50/50 on mobile.** `<StudentsListPage>` passes a `flex w-full gap-2 md:w-auto` wrapper to `<PageHeader>`'s `actions` slot, with each button `flex-1 md:flex-none`. Mobile = full row, two equal-width buttons. Desktop = content-sized, right-aligned by PageHeader's existing `md:justify-between`.

**Files written.**
- Modified: [`src/main.tsx`](../src/main.tsx) (`BigInt.prototype.toJSON` patch), [`src/components/shared/ErrorState.tsx`](../src/components/shared/ErrorState.tsx) (3 keys), [`src/components/shared/OfflineState.tsx`](../src/components/shared/OfflineState.tsx) (2 keys), [`src/features/students/components/list/StudentsFilters.tsx`](../src/features/students/components/list/StudentsFilters.tsx) (new `<FilterStack>` + chip visuals + dept trigger simplification), [`src/features/students/components/list/StudentMobileCard.tsx`](../src/features/students/components/list/StudentMobileCard.tsx) (rewritten), [`src/features/students/pages/StudentsListPage.tsx`](../src/features/students/pages/StudentsListPage.tsx) (PageHeader actions wrapper).
- LESSONS.md: new entry on `BigInt.prototype.toJSON` + stale i18n keys.

**Verifications.** typecheck · `eslint --max-warnings 0` · `vite build` — all clean.

**Lessons (appended).**
- MSW handlers that respond with `Money`-bearing objects need `BigInt.prototype.toJSON` patched globally; the default JS engine doesn't know how to serialize bigint and `HttpResponse.json` will throw.
- "Literal i18n key text on screen" is a double-bug signal: the key is wrong AND there's a real error bringing that state into view. Don't dismiss the i18n bug without finding why the state is being reached.
- Filter-bar bare-number chips (years 1–6) need their group label rendered ABOVE them, not inline next to them, to read unambiguously. Vertical `<FilterStack>` mirrors the mobile bottom-Sheet structure on desktop too.
- Chip-style multi-select toggles need visible borders + bg in their resting state to read as pressable. Pure `text-muted-foreground` chips look like static text.
- Mobile card layouts should prioritize 2 glanceable data points (status + amount) on the most prominent row. Label/value `<dl>` grids are sparse and bury the action-driving info.

---

## 2026-05-11 — Prompt 6 (Students module) + staff kebab alignment fix + shared TreePicker + PanelStates promotion

**Summary.** Shipped the Students module end-to-end — 5 routes (`/students`, `/students/new`, `/students/import`, `/students/schedules`, `/students/:id`), all backed by a 24-endpoint MSW handler with deterministic 200+ student seed across the existing 111-node department tree. Pre-batch: fixed the staff list kebab alignment (the "actions" column was getting residual width from `table-layout: auto` and the dots drifted visually); extended `<DataTable>` with per-column `meta.headerClassName` / `meta.cellClassName` so any future "actions" column collapses to content via `w-[1%]`. Foundation pass also promoted `PanelStates` from `features/dashboard/components/` to `src/components/shared/` (resolves a flagged carry-over; 9 importers repointed), built a generic `<TreePicker>` in `src/components/shared/` (used 4 places: list filter, Add Student, Apply Template, Change Department bulk action), wired `<WriteButton>` offline tooltip to `t('common.offline.tooltip')` (fixed hardcoded-RU tech-debt), and added `xlsx@0.18.5` as a dynamic-import-only dep (ships as its own 142 KB gzip chunk for template + error-report download in the Import wizard). Domain.ts grew `StudentPaymentStatus` (separate from transaction `PaymentStatus` because the student-level aggregate carries `'partial'`), `PaymentType`, `ScheduleRow` + `ScheduleRowStatus`, `ScheduleTemplate`, `StudentNote`, 15-action `StudentActivityAction` + `StudentActivityEntry`, and the import-flow trio `ImportRow` / `ImportRowError` / `ImportSession`. Added `'partial'` variant to `<StatusBadge>` (CircleDot icon + info tone). The list page has URL-synced filters (search · dept TreePicker multi · year chips · payment status chips · edu-type chips), 50-per-page pagination, bulk select with a Pattern A fixed-bottom `<BulkActionBar>` that surfaces only when rows are selected (remind / export / change-dept / deactivate-with-reason ≥20). The detail page is Pattern A (back link + identity row + chips + `pb-28` wrapper + fixed-bottom `<StudentDetailActionBar>` with Owner-only Delete behind a tooltip-gated disabled button), 2-column layout with Personal/Academic cards on the left and 4 underline-style tabs on the right: Schedule (inline-editable cells via new `<InlineEditCell>` primitive, `text-sm` minimum even in compact density; Apply Template flow with reason ≥20), Transactions (DataTable + `<TransactionDetailSheet>` right-Sheet ≥md / bottom <md), Notes (append-only timeline + Add note), Activity (filters card + DateRangePicker + paginated DataTable). The import wizard renders 4 internal steps (Download / Upload / Review / Confirm) with an inline step indicator; Step 3 is a full inline-edit review table with per-cell error highlighting that updates via PATCH on blur/Enter; Step 4 requires reason ≥20 when imported count > 100. Add Student is a standalone page (Pattern A) with async studentId uniqueness check (debounced 350ms via `useCheckStudentId` mutation) and Save-and-add-another preserving the academic dropdowns. Schedule templates page is a card-list of 3 pre-seeded templates with an Edit/Duplicate/Apply/Delete row; Apply opens a confirm with reason ≥20 + live preview count. All 6 states covered on every data surface. typecheck / lint / build all clean.

**Pre-batch fix.** [`StaffTable.tsx`](../src/features/staff/components/list/StaffTable.tsx) actions column drifted visually because `table-layout: auto` distributed residual width to the column with `sr-only` header. Fixed by extending [`DataTable.tsx`](../src/components/shared/DataTable.tsx) with `ColumnMeta.headerClassName` / `cellClassName` (via TanStack module augmentation) and applying `meta: { headerClassName: 'w-[1%]', cellClassName: 'pr-3' }` to the actions column. Same pattern reused in Students list, Schedule tab, Transactions tab, Activity tab, and import Review.

**Files written.**
- New module: [`src/features/students/`](../src/features/students/) — 5 pages (`StudentsListPage`, `AddStudentPage`, `StudentProfilePage`, `SchedulesPage`, `ImportStudentsPage`), 22 components (`list/` × 6: StudentsFilters / StudentsTable / StudentMobileCard / StudentRowKebab / BulkActionBar / ChangeDepartmentDialog; `add/` × 3: PersonalInfoSection / AcademicInfoSection / PaymentSetupSection; `profile/` × 9: StudentDetailHeader / StudentDetailActionBar / ProfileLeftColumn / ScheduleTab / TransactionsTab / TransactionDetailSheet / NotesTab / ActivityLogTab / InlineEditCell / EditStudentSheet; `schedules/` × 3: TemplateCard / TemplateForm / ApplyTemplateDialog; `shared/` × 1: StudentAvatar), 9 hooks (`useStudents` / `useStudent` / `useStudentMutations` / `useStudentSchedule` / `useStudentTransactions` / `useStudentNotes` / `useStudentActivity` / `useImportSession` / `useScheduleTemplates`), `api.ts` (typed fetch wrappers for 23 endpoints), `schemas.ts` (Zod factories for personal / academic / paymentSetup / addStudent / editProfile / inlineScheduleRow / addNote / reason / bulkChangeDept / scheduleTemplate / applyTemplate / importRowPatch).
- New MSW: [`src/mocks/handlers/students.ts`](../src/mocks/handlers/students.ts) — 24 endpoints, deterministic 200+ student seed (~5 students per group across 72 group-leaves), schedule rows (2–3 per student), transactions (0–5 per student tied to paid/partial rows), notes (0–2 per student), activity (3–6 per student), 3 pre-seeded templates, import-session Map with row-level validation. `?_state=partial|empty|error` honored on every GET.
- New shared: [`src/components/shared/TreePicker.tsx`](../src/components/shared/TreePicker.tsx) (generic `TreeItem<TMeta>[]` shape, `mode: 'single' | 'multi'`, `subtreeToggle`, `leafOnly`, search with ancestor auto-expand, optional `renderMeta`).
- Promoted: [`src/components/shared/PanelStates.tsx`](../src/components/shared/PanelStates.tsx) (from `features/dashboard/components/`). 9 importers repointed (5 dashboard + 4 organization). Default empty-state copy switched to `common.states.noData` (generic) — dashboard `RecentTransactions` + `UnpaidStudents` updated to pass explicit `body={t('dashboard.empty.noData')}` so their period-specific copy is preserved.
- Modified: [`src/types/domain.ts`](../src/types/domain.ts) (added `StudentPaymentStatus`, `PaymentType`, `ScheduleRow` + `ScheduleRowStatus`, `ScheduleTemplate`, `StudentNote`, `StudentActivityAction` (15 values), `StudentActivityEntry`, `ImportRow` + `ImportRowError` + `ImportSession`; re-typed `Student.paymentStatus` to `StudentPaymentStatus`). [`src/components/shared/DataTable.tsx`](../src/components/shared/DataTable.tsx) — `ColumnMeta` declaration merge with `headerClassName` / `cellClassName`; head / body cells now consume them. [`src/components/shared/StatusBadge.tsx`](../src/components/shared/StatusBadge.tsx) — added `'partial'` variant (`CircleDot` icon, `info` tone). [`src/components/unipay/WriteButton.tsx`](../src/components/unipay/WriteButton.tsx) — tooltip reads from `t('common.offline.tooltip')` instead of hardcoded RU. [`src/features/staff/components/list/StaffTable.tsx`](../src/features/staff/components/list/StaffTable.tsx) — applied `w-[1%]` + `pr-3` to actions column. [`src/router.tsx`](../src/router.tsx) — registered 5 students routes. [`src/mocks/handlers/index.ts`](../src/mocks/handlers/index.ts) — registered `studentsHandlers`. [`src/lib/i18n/locales/{ru,uz}.json`](../src/lib/i18n/locales/) — full `students.*` namespace (list / filters / bulk / add / detail / schedule / transactions / notes / activity / import × 4 steps / schedules) + `common.offline.tooltip` + `common.educationType.*` + `status.partial`.
- Deleted: `src/features/dashboard/components/PanelStates.tsx` (promoted).

**Install.** `xlsx@0.18.5` (dynamic-imported in [Step1Download](../src/features/students/components/import/Step1Download.tsx) + [ImportStudentsPage](../src/features/students/pages/ImportStudentsPage.tsx) error-report generator; ~142 KB gzipped own chunk).

**Verifications.** typecheck · `eslint --max-warnings 0` · `vite build` — all clean. §0.9 audit greps: the only "failing" check is "Unicode arrows in copy" with byte-collision false positives on Cyrillic strings + idiomatic Russian em-dashes in MSW fixtures (`'Обучение — 2026'` etc.) — pre-existing audit limitation logged in [`LESSONS.md`](LESSONS.md) and AI_CONTEXT; my new code has zero literal `←→↑↓»` characters.

**Lessons.**
- NBSP in JS regex character classes will fire `no-irregular-whitespace` ESLint. When parsing UZS amounts ("5 000 000") into bigint, use `[\\s\\u00a0]` (escape sequence) rather than a literal NBSP inside `[\\s ]`.
- Generic `TreePicker` over a flat `TreeItem<TMeta>[]` (with `parentId: string | null`) supports four call sites in one module: filter (multi w/ subtree-toggle), Add Student (single leafOnly), Apply Template (multi w/ subtree-toggle), Change Department bulk action (single any-node). One API, one component, no per-use forks.
- Bulk action bar reuses §0.5 Pattern A class string verbatim (`fixed inset-x-0 bottom-0 z-30 ... md:left-[var(--sidebar-width,4rem)]`). Page wrapper conditionally adds `pb-28` only when `selectedIds.size > 0` — no permanent space cost when no rows are selected.
- TanStack React Table's `ColumnMeta` interface is module-augmentable. Add `headerClassName` / `cellClassName` once in `DataTable.tsx` and every consumer can collapse an actions column to content via `meta: { headerClassName: 'w-[1%]' }` without DataTable per-column className props.

---

## 2026-05-11 — Horizontal-padding alignment: Dashboard / Org / Staff use main's padding only

**Summary.** Reported visual inconsistency: staff pages had more horizontal padding than Dashboard and Organization at every viewport. Root cause: Dashboard's `<DashboardPage>` and `<OrganizationLayout>` wrap their content in `<div className="space-y-6">` (no horizontal padding), letting `<main>` `p-4 md:p-6` provide the only horizontal rhythm. Staff pages added `px-4 md:px-6` on TOP of main's padding — doubling it. Fixed by removing the wrapper `px-*` from both [`StaffListPage`](../src/features/staff/pages/StaffListPage.tsx) (now just `pb-8`) and the 4 wrapper variants of [`StaffDetailPage`](../src/features/staff/pages/StaffDetailPage.tsx) (loading / not-found / error / data — now just `pb-12`). All three modules now render at 16px each side on mobile and 24px each side on desktop. Established convention: page wrappers contribute no horizontal padding; they only manage vertical/bottom space (e.g. `pb-12` for Pattern B's no-action-bar clearance).

**Files written.**
- Modified: [`src/features/staff/pages/StaffListPage.tsx`](../src/features/staff/pages/StaffListPage.tsx) — wrapper `px-4 pb-8 md:px-6` → `pb-8`.
- Modified: [`src/features/staff/pages/StaffDetailPage.tsx`](../src/features/staff/pages/StaffDetailPage.tsx) — all 4 wrapper variants `px-4 pb-12 md:px-6` → `pb-12`.

**Verifications.** typecheck · lint --max-warnings 0 — both clean.

**Lessons.**
- Page-level wrappers should NOT add horizontal padding when `<main>` already provides it. The double-padding pattern is easy to introduce when copy-pasting from older code; the fix is to lean on the shell for horizontal rhythm and only override per-page when there's a specific reason (max-width container, edge-to-edge tables, etc.).

---

## 2026-05-11 — Prompt 5 (Staff Members module) + drag-drop UX overhaul + DataTable extension + shared primitives

**Summary.** Shipped the Staff Members module end-to-end in two passes. The first build did the spec literally (list + detail page + a quick-view Sheet from list rows). The user then asked for a rebuild: drop the Sheet, list rows navigate to the full detail page, identity card merged into Profile tab, 4 tabs (Profile / Role & Permissions / Activity / Sessions), proper 2-step destructive flows (DeleteAccount with type-email-to-confirm, TransferOwnership with type-`TRANSFER`-to-confirm), live permission diff in EditRoleDialog, cross-tab sessions sync. Along the way: `<DataTable>` was extended with `rowHref` (cmd/middle/keyboard-click semantics) so staff list rows are real links; `<DetailPageSkeleton>` shared primitive added; `<ConfirmDialog>` had a long-standing default-label bug fixed (`common.cancel` / `common.confirm` returned the literal key strings — the actual keys live at `common.actions.cancel` / `common.actions.confirm`); Departments drag-drop UX overhauled (split sensors so desktop drag is instant, `<DragOverlay>` portaled, root drop banner absolute-positioned to eliminate layout shift). Sticky-on-scroll lesson added — the staff filter bar had `sticky top-0 backdrop-blur` which was wrong; new rule: only the onboarding step indicator is allowed to be sticky.

**Files written.**
- New module: [`src/features/staff/`](../src/features/staff/) — 2 pages, 7 detail components (`StaffDetailHeader`, `StaffDetailKebab`, `ProfileTab`, `RoleAndPermissionsTab`, `ActivityLogTab`, `SessionsTab`, plus an internal IdentityCard that was later merged into ProfileTab and deleted), 5 list components (`StaffFilters`, `StaffTable`, `StaffMobileCard`, `StaffRowKebab`, `InviteStaffDialog`), 9 dialogs (`EditRoleDialog` rewritten as single-screen RadioGroup, `EditAccessDialog` with mode toggle, `DeactivateStaffDialog`, `DeleteInviteDialog`, `DeleteAccountDialog` 2-step, `TransferOwnershipDialog` 2-step, `RevokeSessionDialog`, `RevokeAllOthersDialog`), 3 shared sub-components (`StaffAvatar`, `DepartmentTreePicker`, `DepartmentsAccessChips`), 9 hooks (`useStaff` paginated list, `useStaffById`, `useStaffActivity` w/ filter params, `useStaffSessions` w/ cross-tab sync, `useStaffMutations` exporting all mutation hooks), `schemas.ts` (Zod factories for invite/role/access/profile/delete/transfer/revoke), `api.ts` (typed fetch wrappers for 15 endpoints).
- New MSW: [`src/mocks/handlers/staff.ts`](../src/mocks/handlers/staff.ts) — 15 endpoints, ~180 activity entries with `ip` + `device`, 10 sessions, fixtures of 1 owner + 2 finance + 3 operators + 1 viewer + 2 pending invites. Registered in [`mocks/handlers/index.ts`](../src/mocks/handlers/index.ts).
- New shared: [`src/components/shared/DetailPageSkeleton.tsx`](../src/components/shared/DetailPageSkeleton.tsx) — configurable §0.5-shaped skeleton.
- Modified: [`src/types/domain.ts`](../src/types/domain.ts) (extended `StaffMember`; added `StaffStatus`, `StaffActivityAction`, `StaffActivityEntry`, `StaffSession`, `StaffResource`, `StaffPermission`, `StaffPermissionMatrix`, `STAFF_INVITABLE_ROLES`, `ROLE_PERMISSIONS`), [`src/components/shared/DataTable.tsx`](../src/components/shared/DataTable.tsx) (new `rowHref` + `getRowNavigateState` + `onRowClick` + `rowClassName` props; uses `useNavigate`; modifier-key + middle-click + keyboard handling), [`src/components/shared/ConfirmDialog.tsx`](../src/components/shared/ConfirmDialog.tsx) (fixed default labels), [`src/router.tsx`](../src/router.tsx) (registered `/staff` + `/staff/:id` inside `AuthGuard`), [`src/lib/i18n/locales/{ru,uz}.json`](../src/lib/i18n/locales/) (full `staff.*` namespace — list/filters/columns/kebab/invite/detail/tabs/profileTab/role/access/sessions/activity/editRole/editAccess/delete/transfer/identityCard/extendedActivity/chips/row), [`src/features/organization/components/{DepartmentNode,DepartmentTree}.tsx`](../src/features/organization/components/) (drag-drop UX rebuild — see below).
- Deleted: `StaffDetailSheet.tsx`, `StaffDetailTabs.tsx`, `StaffProfileTab.tsx`, `StaffAccessTab.tsx`, `StaffActivityTab.tsx`, `StaffIdentityCard.tsx`, `EditContactDialog.tsx` (all obsoleted during the rebuild — single canonical detail page + ProfileTab absorbs identity + email/phone edited inline, not via a separate kebab dialog).

**Layout details on `/staff/:id`.**
- §0.5 Pattern B. Custom `<StaffDetailHeader>` (bypasses generic `<DetailHeader>` because staff carries too much chrome): avatar | (title col w/ kebab pinned top-right; badges wrap inside title col); chips row below. BackLink reads `location.state.from` to return to the same filtered list URL.
- Tabs styled to match `<OrgTabsNav>` (underline + brand-600 underline on active + brand-700 text on active, NOT segment pills). Class strings centralized in `TAB_LIST_CLASS` / `TAB_TRIGGER_CLASS` constants.
- Profile tab is a single Card with three sections separated by `border-b`: identity header (large avatar + name + email) → editable form (RHF + Zod: fullName / email / phone / locale / timezone, toggle between read/edit) → system metadata (memberId with copy-button, createdAt, lastLoginAt, createdBy which is now a `<Link>` to the inviter's profile, rendered as "Name [ID]" via `useStaffById(invitedBy)`).
- Role & Permissions tab = 3 cards: role badge + description + EditRole button; 6×3 permissions matrix table; access summary chips + EditAccess button.
- Activity tab = filters card (action Select + DateRangePicker) + DataTable. Filters compose. Reset-filters CTA in filtered-empty.
- Sessions tab (own profile or Owner only) = header card with title + Revoke-all-others button + DataTable with per-row Revoke. Cross-tab sync via storage event.

**Departments drag-drop overhaul** ([`DepartmentTree.tsx`](../src/features/organization/components/DepartmentTree.tsx), [`DepartmentNode.tsx`](../src/features/organization/components/DepartmentNode.tsx)). User reported "the item is gone from the UI" + "ui's position changing" + "doesn't move to the root". Three issues, three fixes:
- **Source row disappeared on drag.** Was using `CSS.Translate.toString(transform)` to translate the row itself + `opacity: 0.4`, so it both faded AND moved away from its tree slot. Replaced with `<DragOverlay>` (portaled to `document.body`, `zIndex={40}`); source row keeps its slot at `opacity: 0.4`, the overlay floats with the cursor with a 180ms snap-back drop animation.
- **Position not updating with cursor.** Two sub-causes: `PointerSensor { delay: 250 }` was eating quick desktop drags, AND the overlay was inline-rendered so any ancestor stacking context could clip it. Fixed by splitting sensors (`MouseSensor { distance: 4 }` instant on desktop + `TouchSensor { delay: 250, tolerance: 8 }` per LESSONS.md touch-scroll-vs-drag rule) and portaling the overlay via `createPortal(..., document.body)`.
- **Root drop banner caused layout shift + drop didn't register.** Banner was conditionally rendered → its DOM element didn't exist at drag start → @dnd-kit couldn't measure its rect → drop on root silently failed. Compounded by `closestCorners` fighting between the banner and the first tree row. Fixed by always rendering the banner inside a `relative` wrapper as `absolute inset-x-1 top-0`, fading in via `opacity-0 → opacity-100` only when dragging (zero layout shift); switched collision detection to `closestCenter` + `measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}` so the rect is tracked even as it fades in. Lowered overlay `zIndex={40}` (below Radix Dialog z-50) so the post-drop ConfirmDialog renders on top.

**EditRoleDialog rebuild.** Was a 2-step preview-then-confirm flow with a `<Select>` for the role and per-resource permission blocks. User said "not accessible and comfortable". Rebuilt as single-screen:
- Current role banner anchored at top.
- `<RadioGroup>` of 4 large tap-target cards (role badge + inline description per option). Selected card highlighted in brand-50 + brand-600 border.
- Live permission diff: flat (resource, capability) pairs in two compact sections (`success-700` added with `Check` icon + count; `danger-700` removed with `Minus` + count).
- Reason textarea always visible with char counter that turns `success-700` at ≥20. Disabled when role is unchanged.
- Cancel / Confirm at footer. Confirm enabled only when role differs AND reason valid.

**EditAccessDialog improvement.** Added explicit "Full access vs Specific departments" mode toggle at the top — two large card buttons. Specific mode renders the `<DepartmentTreePicker>` below with a live selected-count and Clear button. "Empty = full access" rule is now visible up-front instead of buried in a hint.

**Sticky-on-scroll removal.** `<StaffFilters>` had `sticky top-0 z-10 bg-background/95 backdrop-blur` — wrong per new rule. Removed. New lesson logged: filter bars / page chrome / anything-that-pins-to-viewport-top flows with content. Only sanctioned exception is `<OnboardingLayout>`'s step indicator.

**Verifications.** typecheck · `eslint --max-warnings 0` · `vite build` — all clean across every checkpoint. §0.9 audit on the staff module: every `text-xs` hit maps to allow-list (chip body / avatar fallback / definition label / mono staff ID). No Unicode arrows. No `<svg>`. No sticky thead. No `h-screen`. No `max-w` on `<main>`.

**Lessons (appended to [LESSONS.md](../ai_context/LESSONS.md)).**
- Don't `position: sticky` on filter bars / page-level toolbars / scroll-headers. Only the onboarding step indicator is sanctioned. Audit grep: `git grep -nE 'sticky\s+top-' src/features/`.
- `<DragOverlay>` needs to be portaled to `document.body` for cursor tracking to feel right across the scroll `<main>`. Source row should NOT translate (dim only — overlay does the floating).
- Split `MouseSensor` + `TouchSensor` instead of a unified `PointerSensor` when desktop wants instant drag (distance) but touch needs delay (scroll vs drag).
- Conditionally-rendered droppables miss @dnd-kit's initial rect measurement at drag start. Always render the droppable; control visibility via opacity. Pair with `MeasuringStrategy.Always` if its size changes during the drag.
- `closestCenter` beats `closestCorners` when multiple droppables overlap (e.g. a banner over the first row).
- `<DragOverlay>`'s `zIndex` defaults to 999 (very high). Set lower than Radix Dialog's z-50 if a confirm dialog opens immediately after drop.
- 2-step destructive flows benefit from a typed-confirmation step (email for delete-account, literal `TRANSFER` phrase for ownership transfer) — protects against muscle-memory mistakes.
- `<DataTable>` extension pattern for clickable rows: `rowHref` + handler that checks `e.metaKey || e.ctrlKey || e.shiftKey` for new-tab, `onAuxClick` for middle-click, `onKeyDown` for Enter/Space, `role="link"` + `tabIndex={0}` for a11y.
- The single-step Edit dialog with live preview (role change) is more accessible than the two-step preview-then-confirm pattern. Show the consequences inline, not behind a Next click.

---

## 2026-05-11 — Deployed Pages demo gets a working sign-in (MSW in prod + form pre-fill always-on)

**Summary.** Reported bug: sign-in didn't work on the deployed GitHub Pages build. Two root causes: (1) MSW was gated to `import.meta.env.DEV` in [`src/main.tsx`](../src/main.tsx) so the prod build had no mock backend, and `POST /api/auth/sign-in` hit nothing. (2) Even after enabling MSW in prod, the worker registers at `/mockServiceWorker.js` by default — which 404s on Pages because the app is served under `/unipay-dashboard/`. Fixed by dropping the DEV gate and passing `serviceWorker: { url: \`${import.meta.env.BASE_URL}mockServiceWorker.js\` }` to `worker.start()` so the URL resolves to `/mockServiceWorker.js` in dev and `/unipay-dashboard/mockServiceWorker.js` on Pages. Vite already copies `public/mockServiceWorker.js` to `dist/` so no extra build step. Followed up by collapsing the `defaultValues: import.meta.env.DEV ? prefilled : empty` ternary in [`SignInForm.tsx`](../src/features/auth/components/SignInForm.tsx) to the prefilled branch unconditionally — the demo deploy needs the form pre-populated with `owner@unipay.dev` / `demo1234` so a visitor can click "Войти" once and be inside.

**Files written.**
- Modified: [`src/main.tsx`](../src/main.tsx) — `enableMocks()` no longer short-circuits in prod; `worker.start()` now takes `serviceWorker.url` resolved against `BASE_URL`.
- Modified: [`src/features/auth/components/SignInForm.tsx`](../src/features/auth/components/SignInForm.tsx) — `defaultValues` is the same object in every environment (prefilled).

**Cost.** MSW (`browser-*.js`) now ships in production — ~97 KB gzipped. Acceptable for a demo / preview deploy with no real backend yet; gate behind a `VITE_USE_MOCKS` env flag once the Express+Mongo backend is ready to take over. Tracked in DECISIONS 2026-05-11.

**Verifications.** typecheck · `eslint --max-warnings 0` · `vite build` — all clean. `dist/mockServiceWorker.js` present at the expected path; build output's `assets/index-*.js` and the MSW chunk co-exist.

**Lessons.**
- MSW's `worker.start()` registers the service worker at `/mockServiceWorker.js` by default. When the app's deployed under a sub-path (Vite `base !== '/'`), pass `serviceWorker.url` resolved against `import.meta.env.BASE_URL` or the worker registration will 404 and MSW will silently no-op. Same applies to any app deployed under a project sub-path on Pages / Vercel-aliases / sub-directory CDNs.
- For demo / preview deploys with no real backend, shipping MSW in production is the path of least resistance. The bundle cost (~97 KB gzipped) is fine for a marketing / portfolio demo. When the real backend lands, the gate should be `import.meta.env.VITE_USE_MOCKS === 'true'` (default true in dev / preview, false in real prod) — not the DEV-vs-prod short-circuit, which doesn't survive a preview deploy.

---

## 2026-05-11 — Bank Edit Sheet — tap-to-copy rows for immutable details

**Summary.** Restructured `BankImmutableSummary` (the read-only summary card at the top of the Bank Account Edit Sheet) from a horizontal 2-column `dl grid` (label-left / value-right) to stacked groups — each row now has its label on top (`text-xs uppercase tracking-wider` definition-label, §0.2 allow-listed) and value below (`text-sm font-medium`, with `tabular break-all` on numeric fields so a 20-digit account number wraps cleanly inside narrow sheets). Each row is now a `<button>` that copies the value on tap: `navigator.clipboard.writeText` with a hidden-textarea + `execCommand('copy')` fallback for non-secure contexts; `navigator.vibrate?.(10)` haptic on mobile (feature-detected, gracefully skipped on desktop); trailing icon swaps `Copy → Check (success-700)` for 1500ms; sonner toast using existing `common.actions.copied` key; `sr-only role="status" aria-live="polite"` span for screen readers. `aria-label` combines `Скопировать: {label}, {value}` so screen readers announce context + value on focus.

**Files written.**
- Modified: [`src/features/organization/components/BankAccountFormParts.tsx`](../src/features/organization/components/BankAccountFormParts.tsx) — `BankImmutableSummary` rebuilt with stacked rows + local `CopyableRow` button component (handles clipboard + haptic + 1500ms icon-swap timer + cleanup on unmount). Header band kept (lock icon + immutable note, `border-b bg-muted/40`).
- Modified: [`src/lib/i18n/locales/{ru,uz}.json`](../src/lib/i18n/locales/) — new `organization.bankAccounts.copyErrorToast` key for the rare clipboard-write failure path.

**Semantics note.** A `<button>` can't be a direct child of `<dl>`, so the markup switched from `<dl>` → `<dt>` → `<dd>` to `<ul>` → `<li>` → `<button>` with internal label/value `<span>`s. The "term + description" semantic is now carried by the button's `aria-label` rather than DOM-native dl/dt/dd.

**Verifications.** typecheck · `eslint --max-warnings 0` — clean.

**Lessons (appended to LESSONS.md).**
- Tap-to-copy rows need: feature-detected `navigator.vibrate?.(10)` haptic, `Copy → Check` icon swap on a 1500ms timer cleared on unmount, sonner toast, `sr-only role="status" aria-live="polite"` announcement, and a hidden-textarea + `execCommand('copy')` fallback for non-HTTPS contexts. `aria-label` should combine action verb + label + value so screen readers announce both context and what's being copied.

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
