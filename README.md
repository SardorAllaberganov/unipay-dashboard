# UNIPAY — Merchant Dashboard

A merchant dashboard for Uzbek educational institutions (universities, schools, kindergartens) to manage tuition payments. Mobile-first, RU/UZ localized, fintech-grade discipline.

**Live:** https://sardorallaberganov.github.io/unipay-dashboard/

---

## Audience

Owner · Finance Manager · Operator · Viewer (see [`Role`](src/types/domain.ts) for the canonical list).

## Stack

- **React 18** + **Vite 5** + **TypeScript** (strict, `noUncheckedIndexedAccess`)
- **Tailwind v3** + **shadcn/ui** (vendored under [`src/components/ui/`](src/components/ui/))
- **React Router v6** (HashRouter — static-host friendly, no 404.html shim required)
- **TanStack Query v5** (server state) · **TanStack Table v8** (data tables)
- **React Hook Form + Zod** (forms) · **Recharts** (charts)
- **react-i18next** (RU primary + UZ secondary, Latin)
- **date-fns 3** · **MSW v2** (mock API) · **lucide-react** (icons) · **sonner** (toasts)
- **cmdk** (command palette) · **@fontsource/inter** + **@fontsource/jetbrains-mono**

State management:
- **`useSyncExternalStore`** module-level stores for app-wide state with DOM hooks ([`lib/preferences.ts`](src/lib/preferences.ts), [`lib/maintenanceState.ts`](src/lib/maintenanceState.ts), [`lib/auth.ts`](src/lib/auth.ts)).
- Storage events for cross-tab sync.

## Getting started

```bash
git clone https://github.com/SardorAllaberganov/unipay-dashboard.git
cd unipay-dashboard
npm install
npm run dev
```

Open http://localhost:5173 — you'll land on `/#/sign-in`. In dev, the form has role-shortcut buttons (Owner / Finance Manager / Operator / Viewer) backed by the `sessionStorage` placeholder auth.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server (with MSW worker) |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint with `--max-warnings 0` |
| `npm run format` | Prettier write across `src/` |
| `npm run audit:discipline` | Run §0.9 forbidden-pattern grep sweep |

## Project structure

```
src/
├── App.tsx                     # HashRouter + ThemeProvider + MSW + boot
├── router.tsx                  # MaintenanceGate + auth guards + system preview routes
├── components/
│   ├── auth/                   # AuthLayout (full-bleed chrome, owns own TooltipProvider)
│   ├── layout/                 # AppShell, Sidebar, TopBar, CommandPalette, HelpOverlay,
│   │                           # UserMenu, ThemeToggle, NotificationsBell, UnipayLogo
│   ├── system/                 # 404 / 500 / 403 / Maintenance / Offline + SystemErrorBoundary
│   ├── unipay/                 # Money, MaskedAccount, WriteButton, KeyboardHint
│   ├── shared/                 # KpiCard, DataTable, badges, state primitives
│   └── ui/                     # shadcn primitives + Kbd
├── hooks/                      # useNetworkState, useKeyboardShortcuts, breakpoints
├── lib/
│   ├── auth.ts                 # session placeholder + idle timeout
│   ├── preferences.ts          # bootPreferences applies data-density + data-tabular-nums
│   ├── maintenanceState.ts     # ?maintenance=on|off URL boot
│   ├── tone.ts                 # tone-to-class single source of truth
│   ├── format.ts               # bigint-aware formatMoney, masking
│   └── i18n/                   # react-i18next + ru.json + uz.json
├── pages/                      # SignIn, Dashboard, Placeholder
├── providers/ThemeProvider.tsx
├── styles/globals.css
├── types/domain.ts             # Role, Money bigint, statuses, channels
└── mocks/                      # MSW worker + handlers
```

## Design discipline

**Read [`STYLE_DISCIPLINE.md`](STYLE_DISCIPLINE.md) before opening any PR.** It is the codebase's single source of truth for design constraints.

Section index:

- §0.1 Color tokens (HSL scales: `brand-50…950`, `slate-50…950`, semantic ramps)
- §0.2 Typography lock (13px floor; `text-xs` reserved for chips/kbd/tooltip/avatar/uppercase labels)
- §0.3 Layout primitives (`<main>` full-bleed, sidebar width as CSS var)
- §0.4 Sidebar contract
- §0.5 Detail-page convention (back link + identity + fixed-bottom action bar)
- §0.6 Data table rules (Title Case headers, no sticky `<thead>`, mobile card stack)
- §0.7 Mobile patterns
- §0.8 Mandatory state coverage (loading / empty / error / offline / partial / data)
- §0.9 Forbidden patterns + audit greps
- §0.10 Per-task acceptance template
- §0.11 System states catalog
- §0.12 Module-level state stores

Violations of §0.9 block merge. Run `npm run audit:discipline` before pushing.

## Power-user surfaces

- `⌘K` / `Ctrl+K` — command palette
- `?` — keyboard shortcut overlay
- `t` — toggle theme
- `/` — focus search
- `Esc` — close any overlay

## QA / preview routes

System states have dedicated preview routes for visual QA:

- `/#/system/preview/404`
- `/#/system/preview/500` (with copy-on-click reference id)
- `/#/system/preview/403`
- `/#/system/preview/offline`
- `/#/system/preview/maintenance`

Maintenance gate URL trigger: append `?maintenance=on` or `?maintenance=off` to any URL. The flag persists via `localStorage` and the query param is stripped via `history.replaceState`.

## Internationalization

- **RU primary, UZ secondary (Latin).** Both are first-class.
- Locale files: [`src/lib/i18n/locales/`](src/lib/i18n/locales/).
- Currency: UZS with space separator (`4 200 000 UZS`). USD uses comma decimal.
- Dates: `DD.MM.YYYY`. Timezone: `Asia/Tashkent` (UTC+5).
- No RTL.

## Deployment — GitHub Pages

The repo ships with a [GitHub Actions workflow](.github/workflows/deploy.yml) that builds and deploys to GitHub Pages on every push to `main`.

**One-time setup:**

1. Open the repo on GitHub → **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, choose **GitHub Actions**.
3. Push to `main`. The workflow runs typecheck + lint + build, uploads `dist/`, and deploys.

The site goes live at `https://sardorallaberganov.github.io/unipay-dashboard/`.

The Vite `base` is set to `/unipay-dashboard/` only in production mode (see [`vite.config.ts`](vite.config.ts)) — local dev still serves at `/`. The router uses `HashRouter`, so client-side routes work without GitHub's 404.html shim, but the workflow copies `index.html` to `404.html` as belt-and-suspenders.

## License

Private. Internal project.
