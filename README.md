# EkoPicker Vendor — Mobile App

[![License](https://img.shields.io/badge/license-private-lightgrey)]() [![Expo](https://img.shields.io/badge/Expo-SDK%2051-000020)]() [![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)]() [![React Native](https://img.shields.io/badge/React%20Native-0.74-61dafb)]()

The vendor-side mobile application for the **EkoPicker** marketplace (Lagos, Nigeria). Vendors register their business, list products, accept and fulfil orders, chat with customers in real time, and track earnings — all from one Expo-managed app for iOS, Android, and (limited) web.

> **Status: pre-1.0.** The app is fully wired client-side but defaults to **mock data** because the backend has not been deployed yet. See [`PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) for the launch checklist.

---

## Quick start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 (LTS) |
| npm | ≥ 10 |
| Expo Go app on your phone, **or** Android Studio / Xcode for emulators |
| Git | any recent |

### Setup

```sh
# 1. Clone
git clone git@github.com:YOUR_ORG/ekopicker-vendor.git
cd ekopicker-vendor

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Copy env file (mock mode is on by default — no backend needed)
cp .env.example .env

# 4. Start the Expo dev server
npm run start
```

Open the QR code in Expo Go (iOS) or scan it from the camera (Android). For an emulator, press `a` (Android) or `i` (iOS) in the Expo terminal.

> The `--legacy-peer-deps` flag is needed because some transitive deps haven't caught up to RN 0.74's peer-dep declarations.

### Demo credentials (mock mode only)

```
Email:    vendor@ekopicker.com
Password: password123
```

These are **not** included in production builds — see `LoginScreen.tsx` (gated on `EXPO_PUBLIC_USE_MOCK`).

---

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run start` | Expo Metro bundler (interactive menu) |
| `npm run android` | Open on the connected Android device / emulator |
| `npm run ios` | Open on iOS simulator (macOS only) |
| `npm run web` | Run as a web app via `react-native-web` |
| `npm run lint` | ESLint across `src/` and `App.tsx` |
| `npm run lint:fix` | Auto-fix lint errors |
| `npm run format` | Prettier write-mode |
| `npm run type-check` | `tsc --noEmit` (strict) |
| `npm test` | Jest (jest-expo preset) |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:coverage` | Run tests + coverage report → `coverage/` |

---

## Environment variables

Public env vars are inlined at bundle time by Expo. **Do not** put secrets here — they ship to every install.

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api      # Backend REST API base
EXPO_PUBLIC_SOCKET_URL=http://localhost:5000       # Socket.io endpoint
EXPO_PUBLIC_USE_MOCK=true                          # true = no backend needed
EXPO_PUBLIC_APP_NAME=EkoPicker Vendor
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_SENTRY_DSN=                            # Optional — leave empty in dev
```

For per-environment values in EAS builds, see the `env` blocks in `eas.json`.

---

## Project structure

```
.
├── App.tsx                    # Root: Sentry init, providers, ErrorBoundary, RootNavigator
├── src/
│   ├── components/            # ui/ + layout/ primitives (Button, Input, Avatar, Skeleton, …)
│   ├── hooks/                 # TanStack Query hooks (useProducts, useOrders, useChat, useEarnings)
│   ├── navigation/            # RootNavigator (auth gate) + AppNavigator (tabs) + AuthNavigator (stack)
│   ├── screens/               # All screens grouped by feature (auth, products, orders, chat, earnings, …)
│   ├── services/              # api.ts (axios+JWT), socket.ts, sentry.ts, *.service.ts (one per domain)
│   ├── store/                 # Zustand stores (auth, socket, ui)
│   ├── types/                 # Shared TS interfaces & DTOs
│   └── utils/                 # constants, formatters, apiError parser, storageKeys
├── CLAUDE.md                  # Repo brief for AI contributors (read this if you're Claude)
├── TASKS.md                   # Backlog + model routing
├── PRODUCTION_READINESS.md    # Ship-readiness checklist
├── ARCHITECTURE.md            # System design & data flow
├── API_DOCS.md                # Endpoint contract
├── PROCESS_PLAN.md            # Phased remediation roadmap
└── SERVER_SETUP.md            # SonarCloud / Sentry / EAS / store-listing setup
```

See `ARCHITECTURE.md` for layered design and data flow.

---

## How the app works (5-line tour)

1. `App.tsx` initialises Sentry (no-op if no DSN), wraps the tree in `ErrorBoundary` + `QueryClientProvider` + `SafeAreaProvider`, and renders `RootNavigator`.
2. `RootNavigator` calls `auth.store.loadFromStorage()` → reads token from SecureStore → fetches `/vendor/auth/me`. If `vendor.status === 'approved'` it mounts the bottom-tabs `AppNavigator`; otherwise the `AuthNavigator` (Splash → Onboarding → AuthChoice → Login/Register → PendingApproval).
3. Each screen pulls server data via TanStack Query hooks (`useProducts`, `useOrders`, `useChat`, `useEarnings`, `useDashboardStats`) and reads/writes ephemeral UI state via Zustand.
4. `services/api.ts` attaches the JWT to every request, refreshes once on 401 (single in-flight promise), and force-logs-out on refresh failure.
5. Real-time events (`new_order`, `new_message`, `typing`, `order_status_updated`) come over Socket.io and are funneled into the React Query cache or `socket.store`.

---

## Contributing

### Workflow

1. Branch from `main` — `feat/<short-description>` or `fix/<short-description>`.
2. Husky `pre-commit` runs lint-staged + `tsc --noEmit`. If it fails, fix and re-stage.
3. `commit-msg` enforces [Conventional Commits](https://www.conventionalcommits.org/) — e.g. `feat: add forgot-password flow`.
4. Open a PR against `main`. CI runs lint + type-check + tests + Sonar + CodeQL.
5. Squash-merge once review passes.

### Picking work

- Open `TASKS.md` and pick an item by priority (P0 first).
- Each task has a **Best model** column; if you're using Claude Code, switch to that model before starting.
- Move the task's status from **Open** → **In Progress** → **Done** as you go.

### Code conventions

- TypeScript strict — no `any` in new code.
- Currency through `formatCurrency` / `formatCurrencyCompact`. Dates through the helpers in `src/utils/formatDate.ts`.
- Colours through `COLORS` in `src/utils/constants.ts` — no hex literals in screens.
- Screens are named exports (`export function FooScreen()`), not default exports.
- Each domain gets a service (`*.service.ts`) with both a mock and a real branch keyed off `EXPO_PUBLIC_USE_MOCK`. Mirror this when adding new endpoints.

---

## Releasing

The full release pipeline lives in `.github/workflows/main.yml` and is documented in `SERVER_SETUP.md`. Short version:

- **Internal preview build**: `eas build --platform all --profile preview` → an APK + an iOS internal-distribution link.
- **Production build**: `eas build --platform all --profile production` → store-ready binaries.
- **OTA update** (no store submission): `eas update --branch production --message "..."`.

---

## Troubleshooting

| Symptom | Try |
|---------|-----|
| Metro hangs forever after `npm run start` | `npm run start -- --clear` to nuke the cache. |
| `EXPO_PUBLIC_API_URL is not set` warning in Metro | Re-copy `.env.example` to `.env` and restart Metro (env vars are inlined at start). |
| `Cannot resolve module '@sentry/react-native'` | The runtime require is wrapped — safe to ignore until you `npx expo install @sentry/react-native`. |
| Husky hooks not running | `npm run prepare` once; ensure you're inside a git repo. |
| Android build fails with "duplicate resource" | Delete `android/` (regenerated by EAS) and rebuild. |

---

## License

Private / proprietary. Not for redistribution.

## Related apps

- **EkoPicker User App** — customer-facing mobile app.
- **EkoPicker Admin Panel** — web-based admin dashboard.
