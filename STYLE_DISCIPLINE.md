# STYLE_DISCIPLINE.md — UNIPAY Merchant Dashboard (v2.0)

**This file is the codebase's single source of truth for design constraints.**

Every Claude Code session must read this file before writing or modifying any UI code. `CLAUDE.md` and per-module prompts cite specific § numbers from here. Violations of §0.9 (forbidden patterns) are enforced via the `/audit_discipline` grep sweep.

If a rule here conflicts with a fact in `docs/UNIPAY_Dashboard_UISpec.md` or `src/types/domain.ts`, **the docs win** — fix the doc first, then update this file.

**v2.0 changes:** scale-based color tokens (brand/slate/success/warning/danger 50→950), shell contract (`h-dvh`, `--sidebar-width` as inline style, `min-w-0` chain, `AppShellContext`), dual detail-page patterns (action bar vs. kebab-in-header), reason-note threshold raised to ≥20 chars, density + tabular as DOM data attributes, system-states catalog (§0.11), module-level state stores (§0.12).

---

## Project context

**Mobile-first override.** The original product spec said "mobile = read-only + use-desktop banner." That decision was reversed. **Every screen must work fully on mobile (320px+).** Tables become card lists, modals become bottom sheets, multi-column forms stack 1-col, sidebar becomes hamburger Sheet + bottom tab bar. **Do not** ship a "use desktop" banner.

**Locale defaults.** RU primary, UZ secondary (Latin). UZS amounts use space separator (`4 200 000 UZS`). Dates `DD.MM.YYYY`. Tashkent timezone (UTC+5).

**Stack.** React 18 + Vite + TypeScript (strict) · shadcn/ui + Tailwind v3 · React Router v6 (HashRouter for static hosting) · TanStack Query v5 · Zustand v4 · React Hook Form + Zod · TanStack Table v8 · Recharts · react-i18next · date-fns · MSW v2 · lucide-react · sonner · @fontsource/inter + @fontsource/jetbrains-mono.

---

## §0.1 Color tokens — scale + semantic, layered

Colors are stored as **HSL scales** (`brand-50` … `brand-950`, `slate-50` … `slate-950`, plus `success`/`warning`/`danger`/`info` scales). shadcn's semantic tokens (`--primary`, `--foreground`, etc.) **reference the scales**, never hex.

This lets components do `bg-brand-50 dark:bg-brand-950/40` for subtle accents while still respecting theme tokens via `bg-primary`.

```css
/* globals.css — :root scale tokens (light theme) */
:root {
  /* Brand blue scale (anchor: #1558B0 ≈ brand-600 — UNIPAY fintech blue) */
  --brand-50: 215 100% 96%;
  --brand-100: 215 95% 90%;
  --brand-200: 215 90% 80%;
  --brand-300: 215 85% 68%;
  --brand-400: 215 80% 55%;
  --brand-500: 215 78% 47%;
  --brand-600: 215 78% 39%;   /* #1558B0 */
  --brand-700: 215 80% 32%;
  --brand-800: 215 82% 24%;
  --brand-900: 215 84% 16%;
  --brand-950: 215 90% 10%;

  /* Slate scale */
  --slate-50:  210 40% 98%;
  --slate-100: 210 40% 96%;
  --slate-200: 214 32% 91%;
  --slate-300: 213 27% 84%;
  --slate-400: 215 20% 65%;
  --slate-500: 215 16% 47%;
  --slate-600: 215 19% 35%;
  --slate-700: 215 25% 27%;
  --slate-800: 217 33% 17%;
  --slate-900: 222 47% 11%;
  --slate-950: 229 84% 5%;

  /* Semantic scales */
  --success-50: 138 76% 97%;
  --success-600: 142 71% 45%;
  --success-700: 142 76% 36%;
  --warning-50: 48 100% 96%;
  --warning-600: 32 95% 44%;
  --warning-700: 26 90% 37%;
  --danger-50: 0 86% 97%;
  --danger-600: 0 72% 51%;
  --danger-700: 0 74% 42%;
  --info-50: 214 95% 93%;     /* Processing/Pending status bg */
  --info-600: 214 90% 50%;

  /* shadcn semantic tokens map ONTO scales */
  --background: var(--slate-50);
  --foreground: var(--slate-900);
  --card: 0 0% 100%;
  --card-foreground: var(--slate-900);
  --primary: var(--brand-600);
  --primary-foreground: 0 0% 100%;
  --muted: var(--slate-100);
  --muted-foreground: var(--slate-500);
  --border: var(--slate-200);
  --input: var(--slate-200);
  --ring: var(--brand-600);
  --destructive: var(--danger-600);
  --destructive-foreground: 0 0% 100%;

  /* Layout — used by fixed-bottom action bar to offset against sidebar.
     Set per-shell as inline style; this :root value is only the boot fallback. */
  --sidebar-width: 240px;
  --radius: 0.5rem;
}

.dark {
  --background: var(--slate-950);
  --foreground: var(--slate-100);
  --card: var(--slate-900);
  --card-foreground: var(--slate-100);
  --primary: var(--brand-500);     /* one step lighter in dark */
  --muted: var(--slate-800);
  --muted-foreground: var(--slate-400);
  --border: var(--slate-800);
  --input: var(--slate-800);
  --ring: var(--brand-400);
}
```

**Rules:**
- Components reference Tailwind classes that consume these tokens: `bg-primary`, `text-foreground`, `bg-brand-50`, `dark:bg-brand-950/40`, etc.
- **Never** hardcode hex/rgb in components. The only hex hardcodes allowed are: token comments (`/* #1558B0 */`), and 3rd-party brand colors that have to match (`bg-[#229ED9]` for Telegram, `bg-[#25D366]` for WhatsApp) — flag these in a code comment.
- **v1 ships light-only.** Dark tokens land in CSS, but the `<ThemeProvider>` toggle defaults to `light` and stays hidden in TopBar until `VITE_FEATURE_DARK_MODE=true`. v2 flips it.

---

## §0.2 Typography lock

Scale (Tailwind extended; see Prompt 0 for the config snippet):

| Token | px | Default usage |
|---|---|---|
| `text-xs` | 13 | **RESERVED** — see allow-list |
| `text-sm` | 14 | **Default for flowing text** — buttons, table cells, meta lines, breadcrumbs, form values |
| `text-base` | 15 | Prose body |
| `text-lg` | 16 | Emphasized body |
| `text-xl` | 18 | Section title (H2) — `font-semibold` |
| `text-2xl` | 22 | Large heading |
| `text-page-title` | 24 / 700 | Page title (H1) — custom utility |
| `text-3xl` | 28 | KPI hero numbers |
| `text-4xl` | 36 | Display |

**`text-xs` (13px) is allowed only in:**
- Chip / badge bodies (`StatusBadge`, `RoleBadge`, `ChannelBadge`, `TierBadge`, etc.)
- `<kbd>` keyboard hints (`KeyboardHint` primitive, `<CommandShortcut>` in command palette)
- **Uppercase + `tracking-wider` category labels** (sidebar section headers, KPI category labels, definition labels in detail-page cards, recharts axis ticks)
- Avatar fallback initials
- Tooltip body
- Mono IDs displayed inline (transaction IDs, payout IDs, API key fingerprints)
- Recharts `tick.fontSize` / `contentStyle.fontSize` — minimum 13

**`text-xs` is FORBIDDEN in:**
- Buttons (any size, including `size="sm"`) — minimum `text-sm`
- Flowing meta text — timestamps, relative-time labels (`47m ago`), card subtitles, table-row sublines, breadcrumbs, KPI delta percentages, legend items, form sub-labels
- Disabled-action reason text

**Never** `text-[10px]`, `text-[11px]`, `text-[12px]`, or any arbitrary `<13px`. The original spec's "Small 12px" is dropped.

**Tabular numerals** on every monetary value, count, ID, timestamp, percent, KPI number. Use the `tabular` utility — `font-variant-numeric: tabular-nums` on the element.

**Font feature settings.** Apply Inter's `cv11`, `ss01`, `ss03` variants on `body`:

```css
body { font-feature-settings: 'cv11', 'ss01', 'ss03'; }
```

Mono is JetBrains Mono.

---

## §0.3 Layout primitives

### Shell root

- `<main>` is **full-bleed.** Never `max-width` cap on `<main>`. Volume reviewers process data on ultrawide displays. Container is the page (which may have a max-width inside it for a specific surface like a settings form), but `<main>` itself flexes to viewport.
- Shell root is `flex h-dvh bg-background` — **`h-dvh`, not `h-screen`** (dynamic viewport height handles mobile browser chrome correctly).
- Page padding: `p-4` mobile, `p-6` `md+`.

### Sidebar width as a CSS var

The sidebar has two states (collapsed 64px / expanded 240px). The width lives as `--sidebar-width` set as an **inline style on the shell root** — not a `:root` declaration:

```tsx
const sidebarWidthPx = collapsed ? 64 : 240;

<div
  className="flex h-dvh bg-background"
  style={{ '--sidebar-width': `${sidebarWidthPx}px` } as React.CSSProperties}
>
```

This propagates instantly to anything reading `var(--sidebar-width)` — most importantly the fixed-bottom action bar's `md:left-[var(--sidebar-width)]` offset (§0.5). `:root --sidebar-width: 240px` exists only as a boot fallback.

### `min-w-0` chain (critical)

Every flex child that may contain overflow content must include `min-w-0`, otherwise tables and long IDs blow out the layout. Required on:
- The shell's right column: `<div className="flex flex-1 flex-col min-w-0">`
- Any `flex-1` row containing a table, long identifier, or `truncate` span

Scan for `flex-1` without `min-w-0` adjacent and fix it on sight.

### `<AppShellContext>` for deep imperative access

Some deep descendants (e.g. the in-shell 404's "Open command palette" CTA, future page-level CTAs) need to trigger shell overlays without prop-drilling. The shell exposes:

```ts
interface AppShellActions {
  openCommandPalette: () => void;
  openHelp: () => void;
}
const AppShellContext = createContext<AppShellActions>(NOOP);
export function useAppShell(): AppShellActions { return useContext(AppShellContext); }
```

Wrap children in `<AppShellContext.Provider value={shellActions}>` inside `<AppShell>`. Do not use this for non-overlay state (that belongs in Zustand or feature-local state).

---

## §0.4 Sidebar contract

- **Two widths:** `w-[64px]` collapsed / `w-[240px]` expanded. Persist to `localStorage` via `ui-store` (Zustand).
- **Auto-collapse on tablet:** `window.matchMedia('(max-width: 1023px)')` listener flips `collapsed=true` automatically. Above `1024px`, restore the user's persisted preference.
- **Mobile (`<md`):** sidebar is hidden (`hidden md:flex`). A `<Sheet side="left">` drawer renders the same `<Sidebar>` content when the hamburger is tapped.
- **Sections + items.** Sidebar takes a `SECTIONS: NavSection[]` array — each section has `titleKey` + `items: { to, labelKey, icon }[]`. Section titles render `text-xs font-medium uppercase tracking-wider text-muted-foreground` when expanded; hidden when collapsed.
- **Active nav-link styling — left accent stripe:**
  ```tsx
  isActive
    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[2px] before:rounded-r before:bg-brand-600'
    : 'text-foreground/80'
  ```
  The `before:` pseudo creates a 2px brand stripe on the left edge for active items. Don't use a left-border (it shifts content).
- **Scroll the nav, fix the chrome.** Logo at top (`h-14 border-b`), `<ScrollArea>` wraps the nav body, collapse toggle button at bottom (`border-t p-2`).
- When collapsed, items render `<Icon />` only with `aria-label={t(item.labelKey)}` and `title={t(item.labelKey)}` for tooltip-on-hover.

---

## §0.5 Detail-page convention

Every detail page (Student profile, Transaction detail full page, Payout detail full page, etc.) follows this layout. **Two valid action patterns** depending on action density.

### Row 1 — back link, alone

```tsx
<button onClick={…} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
  <ArrowLeft className="size-4" />
  Назад к {plural-list-name}
</button>
```

Always lucide `ArrowLeft` (not `ChevronLeft`, not Unicode). Always `Назад к <plural>` (`Назад к студентам`, `Назад к транзакциям`).

### Row 2 — identity

Avatar/icon + primary identifier (entity ID or name) + status chip + secondary metadata. `flex flex-wrap items-center gap-3`. Right side may carry quick actions or a kebab on `md+`; on mobile they wrap below.

### Row 3 (optional) — chips

Created-at / last-updated / pager position. `flex flex-wrap gap-2`.

**Header flows inline.** No `position: sticky` on header. No `bg-card` band. No `border-b` strip. The page rhythm carries it.

### Action pattern A — fixed-bottom action bar

**Use when:** the page has 1–2 primary actions (Confirm / Cancel / Save / Reverse / Pay out, etc.).

```tsx
<div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-4 py-3 md:left-[var(--sidebar-width,4rem)] md:px-6">
  {/* buttons — full-width flex on mobile, content-sized right-aligned on md+ */}
</div>
```

- Page wrapper has `pb-28` (112px) so the last card clears the bar at full scroll.
- On mobile, this bar **replaces** the bottom tab nav (see §0.7).
- On `md+`, it offsets by `var(--sidebar-width, 4rem)` so it doesn't overlap the sidebar.
- Buttons inside: `flex w-full gap-2` with each `flex-1` on mobile (equal width); content-sized right-aligned on `md+`.

### Action pattern B — kebab-in-header

**Use when:** the page has 6+ admin actions (Block, Soft-delete, Re-verify, Reset devices, Generate report, etc.) where a single action bar would be cluttered or ambiguous.

In Row 2 (identity), right-aligned: a `<DropdownMenu>` triggered by a `MoreVertical` button. Items grouped with `<DropdownMenuSeparator>` between groups (status changes / KYC / devices / reports). Destructive items use `text-danger-700 focus:text-danger-700`.

**No fixed-bottom bar in Pattern B** — the kebab is the action surface. The page wrapper does NOT need `pb-28`.

### Choosing between A and B

| Condition | Pattern |
|---|---|
| 1–2 primary actions, often destructive (reverse, pay out, approve) | A — fixed bar |
| Form-like editing surfaces (settings tabs, profile edit, new-X) | A — fixed bar (Save / Cancel) |
| Admin reference surfaces with many disparate actions | B — kebab |
| Mixed: a form that ALSO needs admin actions | A for Save/Cancel + B kebab inline in identity row |

When in doubt, prefer A — it's more discoverable.

---

## §0.6 Data table rules

- **Wrapper:** `<div className="rounded-lg border border-border overflow-hidden">`.
- **Column header text:** `text-sm font-medium text-muted-foreground`. **Title Case as authored.** Never `uppercase tracking-wider`. Never `text-xs`.
- **Sortable headers:** sort state communicated through arrow icon only (`ArrowUpDown` idle / `ArrowUp` asc / `ArrowDown` desc). No active-state color differential.
- **Never** `position: sticky` on `<thead>`. The filter bar above the table can be sticky (page-level utility chrome). Bulk-action bar on multi-select can be sticky. Column headers — never.
- **Row height via `--row-h` CSS var.** `<TableRow>` reads `style={{ height: 'var(--row-h)' }}` so density toggles (§0.7b) cascade live across every table.
- **Hover:** `hover:bg-muted/40` on rows. Don't rely on hover alone for selectability — pair with checkbox column or a persistent indicator.
- **Numbers in cells:** always `tabular`.
- **Pagination:** below the table, "Showing 1–50 of 234" + prev/next. Simple.
- **Mobile (`<md`):** card stack via `mobileCardRender`. **Never** horizontal scroll a desktop table on mobile.

---

## §0.7 Mobile patterns

- **Sidebar →** `<Sheet side="left">` drawer triggered by hamburger in topbar.
- **Bottom tab nav** (mobile only): Home / Students / Payments / Reports / More. **Hidden on detail routes** so the fixed action bar can take its place. Detection: route matches `/students/:id`, `/payouts/:id`, etc. The shell knows which routes are detail-routes via the `isDetailRoute(pathname)` helper in `src/lib/is-detail-route.ts`. Sheet-based detail views (e.g. transaction detail Sheet on mobile) do **not** count as detail routes; the underlying list route stays active.
- **Tables →** card stack at `<md`. Each row becomes a card: leading visual + primary identifier on top row, secondary metadata in stacked `<dt>`/`<dd>` pairs, status chip + actions on bottom row.
- **Filter bars →** collapse to a single `[Фильтры]` button that opens a Sheet from the bottom on mobile; full row of chips on `md+`.
- **Modals →** bottom Sheets on `<md`, centered Dialogs on `md+`. The `ResponsiveSheet` primitive wraps both.
- **Buttons in fixed-bottom action bars →** full-width equal share on mobile; content-sized right-aligned on `md+`.
- **Segmented controls in mobile bottom bars →** `fullWidth` mode (`flex w-full` + each segment `flex-1`).
- **Page headers →** stack vertically on `<md`, side-by-side from `md+`.
- **Tap targets ≥ 44×44pt on mobile.** Mouse-precision actions on desktop can be 24×24px but keep clickable area ≥ 32×32.
- **Reflow at 200% browser zoom** without horizontal scroll or clipped text.

### §0.7b Density + tabular as DOM data attributes

Density and global tabular-numerals are persisted user preferences (Settings → Preferences). They apply to the DOM via `data-*` attributes on `<html>`, read by globals.css:

```css
html[data-density='compact']      { --row-h: 40px; }
html[data-density='comfortable']  { --row-h: 44px; }
html[data-tabular-nums='true'] body {
  font-variant-numeric: tabular-nums;
}
```

`bootPreferences()` runs at module load (in `App.tsx`) so first paint reflects the user's stored choice. The `lib/preferences.ts` store applies the attributes whenever preferences change.

---

## §0.8 Mandatory state coverage

Every list surface and every detail surface implements all six states. **No exceptions.**

| State | Component | When |
|---|---|---|
| **Loading** | Skeleton matching the layout (`LoadingTable`, `LoadingChart`, `LoadingCard`) — never spinner-only | Query is `pending` and no cached data |
| **Empty** | `EmptyState` — lucide icon (size-12, muted) + title + body + primary CTA | Query resolved with zero results |
| **Error** | `ErrorState` — `AlertCircle` icon + title + body sourced from error code + retry CTA | Query is `error` |
| **Offline** | `OfflineState` (full-page) or `OfflineBanner` (in-shell) — `WifiOff` + "Вы оффлайн" + cached-data note | `navigator.onLine === false` |
| **Partial** | Inline banner above data: "Некоторые элементы не загрузились — показано N из M" | Query resolved with `_meta.partial === true` |
| **Data** | The actual surface | Happy path |

Loading buttons: spinner inside, disabled, **same size** (use `aria-busy="true"`). Never let layout reflow when transitioning loading → data.

---

## §0.9 Forbidden patterns (non-negotiable)

| Don't | Do |
|---|---|
| `text-xs` in buttons / flowing meta | `text-sm` minimum |
| Any `text-[<13px]` arbitrary value | Fix the layout |
| `position: sticky` on `<thead>` | Filter bar can be sticky, headers can't |
| `position: sticky` on detail-page header | Flow inline |
| `position: sticky` on detail-page action bar | `position: fixed` overlay (§0.5) |
| `max-width` cap on `<main>` | Full-bleed |
| `h-screen` on the shell root | `h-dvh` (mobile chrome handling) |
| `flex-1` without `min-w-0` on shell columns / table containers | Always pair `flex-1` with `min-w-0` on overflow-prone children |
| Hardcoded `#1558B0` / `#1A1A2E` / etc. in components | `bg-primary` or `bg-brand-600` etc. via tokens |
| Inline `<svg>` icons | `lucide-react` imports |
| Unicode arrows `←` / `→` in copy | `ArrowLeft` / `ArrowRight` lucide icons |
| Color-only signals | Icon + label + position triple |
| `uppercase tracking-wider` on table column headers | Title Case + `text-muted-foreground` |
| Active-state color differential on sortable headers | Arrow icon only |
| Half-override Card padding (`pb-0` / `p-0` mid-component) | Replace inner with plain `<div className="border-t">` and add `overflow-hidden` to Card |
| Cramped 11/10/12px text "to fit" | Fix the layout |
| Spinner-only loading | Skeleton mirroring layout |
| Toast for destructive confirmation | Modal + reason note (**≥20 chars**) |
| Reason note threshold below 20 chars | ≥20 chars for destructive admin actions; ≥10 chars only for low-stakes notes (audit context, optional reviewer comment) |
| Hidden disabled buttons (no tooltip) | Tooltip explaining why (use `WriteButton` for offline-gated actions) |
| Direct `<button onClick>` for write actions while online-aware | `<WriteButton>` (auto-disabled offline + tooltip) |
| Horizontal-scroll desktop table on mobile | Card stack via `mobileCardRender` |
| Banner saying "Use desktop for full features" | Build it for mobile |
| Bottom tab nav visible on detail page | Hide it; action bar replaces it |
| `BrowserRouter` for static-hosted demo build | `HashRouter` (no 404.html shim required) |
| Direct `localStorage` reads in components | Module-level store with `useSyncExternalStore` (§0.12) |

### Audit greps

Run before every PR:

```bash
git grep -nE 'text-xs' src/                       # audit each hit against §0.2 allow-list
git grep -nE 'text-\[1[012]px\]' src/             # ZERO results
git grep -nE '#[0-9a-fA-F]{3,6}' src/             # only token comments + 3rd-party brand colors expected
git grep -nE '[←→↑↓»]' src/                       # ZERO — must be lucide ArrowLeft / ArrowRight
git grep -nE '<svg' src/                          # ZERO — lucide-react only
git grep -nE 'sticky.*thead' src/                 # ZERO — never sticky table headers
git grep -nE 'max-w-.*main|main.*max-w' src/      # ZERO for <main>
git grep -nE 'h-screen' src/                      # ZERO — should be h-dvh
git grep -nE '<ChevronLeft.*Назад' src/           # ZERO — must be ArrowLeft
git grep -nE 'uppercase tracking-wider' src/components/shared/DataTable*  # ZERO
git grep -nE 'flex-1' src/components/layout/      # every hit should have min-w-0 sibling
```

---

## §0.10 Per-task acceptance template

Every task ends with a checklist that combines task-specific items + this fixed tail:

- [ ] All 6 states implemented for every data surface in scope (loading / empty / error / offline / partial / data)
- [ ] No `text-xs` outside §0.2 allow-list
- [ ] All numbers use `tabular` utility
- [ ] All colors via CSS vars / scale tokens (no hardcoded hex)
- [ ] All icons via lucide-react (no inline SVG, no Unicode arrows)
- [ ] All forms validate via Zod, errors inline (not toasts)
- [ ] Tap targets ≥ 44×44pt on mobile
- [ ] Page reflows at 200% zoom without horizontal scroll
- [ ] Detail surfaces follow §0.5 (back-link row + identity row + action pattern A or B)
- [ ] Tables follow §0.6 (Title Case headers, no sticky `<thead>`, mobile card stack)
- [ ] Write actions use `<WriteButton>` (offline-gated)
- [ ] Reason notes ≥ 20 chars for destructive actions
- [ ] §0.9 audit greps run — clean
- [ ] If a new feature module landed, `/system/preview/*` routes still render (§0.11)

---

## §0.11 System states catalog

Five system surfaces share a `<SystemStateLayout>` primitive. **Every shipped build must support both `in-shell` and `full-bleed` variants** — full-bleed for deep-link 404 before sign-in and the maintenance state; in-shell for everything else.

| Surface | Component | Trigger |
|---|---|---|
| 404 — Not found | `NotFoundState` | Route catch-all `<Route path="*">`; full-bleed when path-aware guard catches signed-out + unknown path |
| 500 — Server / page error | `ServerErrorState` | `SystemErrorBoundary` (class component) catches render-time crashes |
| 403 — Forbidden | `ForbiddenState` | Future RBAC fallback; v1 is owner-only so this should never render in production |
| Offline (banner) | `OfflineBanner` | `navigator.onLine === false` — sits between TopBar and `<main>`; keeps stale data visible below |
| Offline (full page) | `OfflineState` | When the offline check happens before any cached data exists |
| Maintenance | `MaintenanceState` | `useMaintenanceState().active === true` — renders full-bleed via `<MaintenanceGate>` at router root |

### `SystemStateLayout` contract

```ts
interface SystemStateLayoutProps {
  variant?: 'in-shell' | 'full-bleed';
  icon: LucideIcon;
  iconTone: 'slate' | 'danger' | 'warning';
  title: string;
  body: string;
  primary?: { label: string; to?: string; onClick?: () => void };
  secondary?: { label: string; to?: string; onClick?: () => void };
  footer?: ReactNode;  /* reference id, requested-path readout, etc. */
}
```

- In-shell: centered card inside `<AppShell>`'s `<main>`, max-w-md, shadow-sm.
- Full-bleed: wraps card with `<AuthLayout>` chrome (logo, gradient bg, ThemeToggle top-right). Owns its own `<TooltipProvider>` because it sits outside `<AppShell>`.

### `SystemErrorBoundary`

Class component. `getDerivedStateFromError` flips `hasError`. `componentDidCatch` logs to `mockSystemEvents` and captures the generated reference id (`generateReferenceId()` → `8a7c-2f1e` shape). Try-again CTA calls `reset()` to re-mount children.

### Reference id (500 footer)

Format `[a-f0-9]{4}-[a-f0-9]{4}` — 32 bits of entropy, copy-on-click. Real backend would mint longer trace ids; UI shortens for display.

### Preview routes for QA

```
/system/preview/404
/system/preview/500
/system/preview/403
/system/preview/offline
/system/preview/maintenance
```

These render the components in isolation **without firing real telemetry / audit logs** (`preview` prop short-circuits the side effects). Useful for stylesheet QA without forcing the real conditions.

### URL trigger for maintenance

`?maintenance=on` and `?maintenance=off` flip the `useMaintenanceState()` flag at app boot via `bootMaintenanceFromUrl()`. The query param is stripped after application; persistence is via localStorage. Useful for QA without touching admin UI.

---

## §0.12 Module-level state stores

State that needs to survive remounts, sync across tabs, or apply DOM side effects (theme, density, tabular-numerals, network online/offline, auth session, maintenance flag) lives in **module-level stores backed by `useSyncExternalStore`** — not React component state, not Zustand.

### Pattern

```ts
// lib/preferences.ts (excerpt)
type Listener = () => void;
const listeners = new Set<Listener>();
let currentPreferences: Preferences = DEFAULT;

function notify() { for (const l of listeners) l(); }

function setState(next: Preferences): void {
  currentPreferences = next;
  persist(next);          // localStorage
  applyDom(next);         // <html data-density data-tabular-nums>
  notify();
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      currentPreferences = parseStored(e.newValue) ?? DEFAULT;
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot(): Preferences { return currentPreferences; }
function getServerSnapshot(): Preferences { return DEFAULT; }

export function usePreferences(): Preferences {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

**Rules:**
- `getSnapshot()` MUST return a reference-stable value between mutations. Don't slice arrays inside `getSnapshot`; return a version counter and re-derive in the consuming component if needed.
- Cross-tab sync via `window.addEventListener('storage')` in `subscribe`.
- DOM side effects (`applyDom`) inside `setState`, not consumers — keeps things idempotent.
- Boot from storage at module load (`initFromStorage()` runs synchronously when the module is imported).

### Stores in this codebase

| Store | Storage | DOM side effect |
|---|---|---|
| `lib/theme.ts` (via `<ThemeProvider>`) | `localStorage: unipay-theme` | `<html class="dark">` toggle |
| `lib/preferences.ts` | `localStorage: unipay-preferences` | `<html data-density>` `<html data-tabular-nums>` |
| `lib/auth.ts` | `sessionStorage: unipay-session` | none |
| `lib/maintenanceState.ts` | `localStorage: unipay-maintenance` | none (drives `<MaintenanceGate>`) |
| `hooks/useNetworkState.ts` | none (reads `navigator.onLine`) | none |

---

## Deviations

Any deviation from this file must be logged to [`docs/DECISIONS.md`](./docs/DECISIONS.md) with:

1. The specific § rule being deviated from
2. The reason (technical constraint, product requirement, accessibility trade-off)
3. The scope (which file/feature/route)
4. A review date (when to revisit and either ratify or revert)

Deviations not logged are bugs.

---

*UNIPAY Merchant Dashboard · STYLE_DISCIPLINE.md v2.0 — incorporates ZhiPay-proven patterns (scale tokens, shell contract, dual detail-page patterns, system states catalog, module stores).*
