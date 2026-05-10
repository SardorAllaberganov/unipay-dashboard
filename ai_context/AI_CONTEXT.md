# AI_CONTEXT.md — UNIPAY Merchant Dashboard

> Snapshot of project state. Future Claude Code sessions read this first to bootstrap context.
> Source-of-truth files (always trust over this snapshot): [`STYLE_DISCIPLINE.md`](../STYLE_DISCIPLINE.md), [`src/types/domain.ts`](../src/types/domain.ts), [`docs/product_states.md`](../docs/product_states.md).

## Last updated
2026-05-10 — Prompt 0 v2.0 (foundation rewrite)

## What this app is
**UNIPAY** — merchant dashboard for Uzbek educational institutions (universities, schools, kindergartens) to manage tuition payments. Locale: RU primary, UZ secondary (Latin). Currency: UZS (space separator). Timezone: Asia/Tashkent.

Audience: **Owner / Finance Manager / Operator / Viewer** (`Role` in [`src/types/domain.ts`](../src/types/domain.ts)).

Mobile-first with full feature parity at 320px+ — no read-only mobile, no use-desktop banner.

## Stack snapshot
React 18 · Vite 5 · TypeScript 5 (strict + `noUncheckedIndexedAccess`) · Tailwind v3 · shadcn/ui · React Router v6 (**HashRouter**) · TanStack Query v5 · React Hook Form + Zod · TanStack Table v8 · Recharts · react-i18next · date-fns 3 · MSW v2 · lucide-react · sonner · @fontsource/inter + @fontsource/jetbrains-mono · cmdk.

## Token system
- **HSL scales**: `brand-50…950` (anchor `#1558B0` ≈ brand-600), `slate-50…950`, plus 3-stop `success/warning/danger/info` ramps.
- shadcn semantic tokens (`--background`, `--foreground`, `--card`, `--muted`, `--border`, `--ring`) **map onto scales**, never raw HSL.
- Legacy semantic aliases (`--primary-light`, `--success-light`, `--surface-2`, `--refund`, etc.) kept as a backward-compat layer pointing into scale vars.
- Motion: `--duration-fast/base/slow` (120/180/240ms), `--ease-standard/emphasized`. `prefers-reduced-motion` global override.
- Density: `--row-h` driven by `html[data-density]` (40px compact / 44px comfortable).
- Tabular numerals: `html[data-tabular-nums="true"]`.

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
│   └── shared/                   # KpiCard, DataTable, badges (legacy home, still in use)
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
├── pages/                        # SignIn, Dashboard, Placeholder
├── providers/ThemeProvider.tsx
├── styles/globals.css
├── types/domain.ts               # Role finance_manager · Money bigint · Tone · Locale · StatusDomain
└── mocks/                        # MSW worker + handlers
```

## Module-level state stores (§0.12)
All three use `useSyncExternalStore` with module-level cache + listener set + `storage` event cross-tab sync:
- [`lib/preferences.ts`](../src/lib/preferences.ts) — theme/density/language/timezone/date_format/time_format/tabular_numerals. DOM side effects on `<html>`. Boot: `bootPreferences()` from `App.tsx`.
- [`lib/maintenanceState.ts`](../src/lib/maintenanceState.ts) — `{ active, startedAt, estimatedEndAt }`. URL boot via `bootMaintenanceFromUrl()` reads `?maintenance=on|off`, applies, strips param.
- [`lib/auth.ts`](../src/lib/auth.ts) — placeholder session backed by `sessionStorage`. `useIdleTimeout()` returns `'idle'` after 30 min of mousedown/keydown/scroll/touchstart silence. `useSession()`, `signIn`, `signInAsRole`, `signOut`.

## Routing
HashRouter so the app deploys to any static host without a 404.html shim.
- `MaintenanceGate` outermost — `?maintenance=on` flips it; `/system/preview/*` bypasses.
- `PathAwareAuthGuard` — unknown deep-link before sign-in → full-bleed 404; known → redirect to `/sign-in?next=…`.
- `AuthGuard` wraps everything in `<AppShell>`; idle → `signOut(reason: 'session_expired')`.
- `SystemErrorBoundary` wraps `<AppRoutes>`; thrown errors land on `<ServerErrorState>` with copy-on-click reference id.
- Preview routes for QA: `/system/preview/{404,500,403,offline,maintenance}`.

## Layout shell contract
- `flex h-dvh bg-background` root with `--sidebar-width` set as inline style on the shell wrapper.
- Skip-link first child; `<main id="main-content" tabIndex={-1}>` is its target.
- `<TooltipProvider>` outermost so portal tooltips from Sheet contents resolve.
- Right column has `min-w-0` so flex children can truncate.
- AppShell auto-collapses sidebar at `(max-width: 1023px)`.

## Sidebar
- 64↔240 width, `transition-[width] duration-base ease-standard`.
- Items `h-9 gap-2.5 px-3`, icons `size-4`. Active state: `bg-brand-50 text-brand-700` + `before:` 2px accent stripe (dark-mode mapping wired).
- Sections from spec §13: Main / Organization / Students / Payments / Finance / System.

## Power-user surfaces
- `⌘K` / `Ctrl+K` toggles Command Palette ([CommandPalette.tsx](../src/components/layout/CommandPalette.tsx)).
- `?` opens Help Overlay ([HelpOverlay.tsx](../src/components/layout/HelpOverlay.tsx)).
- `t` toggles theme; `/` focuses search; `Esc` closes overlays.
- `g {x}` chord patterns documented in `shortcuts.ts`. Currently visualized in HelpOverlay; chord listener implementation lands in a later pass.

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

## Open work / not yet done
- Real auth wiring (currently sessionStorage placeholder).
- Real i18n keys for every screen — only foundation keys seeded.
- Feature pages 1–12: dashboard widgets, students, transactions, payouts, reports, settings — placeholders only.
- Chord listener implementation (`g d` etc.) — registry exists, dispatcher doesn't.
- Theme toggle wired but dark-mode token coverage not yet QA'd in every component.
- Sidebar role-aware filtering (uses `roles?: Role[]`) — registry doesn't carry roles yet.

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
