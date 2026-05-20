# CLAUDE.md

Guidance for Claude Code (and future contributors) when working in this repository.

---

## 1. Project Overview

**EkoPicker Vendor** is a React Native (Expo SDK 55) mobile application for vendors operating on the EkoPicker marketplace. It is the seller-side counterpart to the EkoPicker User App and EkoPicker Admin Panel.

A vendor uses this app to:

- Onboard their business (5 business types: restaurant / retail / pharmacy / wholesale / others) and wait for admin approval.
- Manage a product catalogue (CRUD, image picker, in-line stock toggle, business-type-aware categories).
- Receive orders in real time (Socket.io) and walk them through a status pipeline: `pending → confirmed → preparing → ready_for_pickup → delivered` (with `cancelled` as an exit at any stage).
- Chat with customers in real time, with typing indicators and read receipts.
- Track earnings (today / week / month / all-time) with a weekly bar chart, transaction history, and Paystack payout requests.
- Manage profile, password, store hours, and notification preferences.

The app runs on iOS, Android, and Web (Metro bundler with `react-native-web`) via Expo. Currency is Nigerian Naira (₦), tone and copy are localised to a Nigerian market.

The app currently runs against **mock data by default** (`EXPO_PUBLIC_USE_MOCK=true` in `.env`). Each service file ships with mock implementations side-by-side with real REST calls. Backend integration is partial — REST stubs exist; backend itself is described in `API_SPECIFICATION.md` but is not yet running.

---

## 2. Commands

```bash
npm install              # install dependencies (use --legacy-peer-deps)
npx expo start           # start Metro + dev menu
npm run android          # alias: expo start --android
npm run ios              # alias: expo start --ios
npm run web              # alias: expo start --web
npm run lint             # ESLint on src/**/*.{ts,tsx} + App.tsx
npm run lint:fix         # ESLint with --fix
npm run format           # Prettier write
npm run type-check       # tsc --noEmit
npm test                 # jest
npm run test:coverage    # jest --coverage
```

Demo login (mock mode):

```
Email:    vendor@ekopicker.com
Password: password123
```

> ⚠️ Clear these defaultValues in `LoginScreen` before any real launch (TASKS P0-07).

---

## 3. Folder Structure

```
.
├── App.tsx                  # Root: providers (QueryClient, SafeArea, GestureHandler) + RootNavigator
├── app.json                 # Expo config (bundle IDs, plugins, splash, icons)
├── assets/                  # icon.png, splash.png, adaptive-icon.png, favicon.png
├── babel.config.js          # babel-preset-expo + nativewind + reanimated/plugin
├── metro.config.js          # withNativeWind wrapper around getDefaultConfig
├── tailwind.config.js       # NativeWind preset + brand colour extension
├── global.css               # @tailwind base/components/utilities
├── tsconfig.json            # Strict, baseUrl=., paths "@/*" → "src/*" (alias defined but unused)
├── eas.json                 # EAS build profiles: development / preview / staging / production
├── .eslintrc.cjs            # ESLint v8: expo + @typescript-eslint + react-hooks + prettier
├── .prettierrc              # semi, singleQuote, trailingComma: all, printWidth: 100
├── jest.config.js           # jest-expo preset, moduleNameMapper for @/* alias
├── jest.setup.js            # @testing-library/jest-native setup
├── API_SPECIFICATION.md     # REST + Socket.io contract (source of truth for backend)
├── DEVLOG.md                # Running session log — decisions, setup steps, outstanding TODOs
├── BACKEND_IMPLEMENTATION_PLAN.txt  # NOTE: describes a different "TrustBase" project — see warning below
├── BACKEND_COST_SCOPE.txt   # Same TrustBase doc — out of scope for this app
└── src/
    ├── components/
    │   ├── layout/          # SafeScreen, ScreenHeader
    │   └── ui/              # Button, Input, Badge (+ orderStatusVariant), Avatar, Skeleton/SkeletonCard, EmptyState
    ├── hooks/               # useProducts, useOrders, useChat, useEarnings  (TanStack Query wrappers)
    ├── navigation/          # RootNavigator (auth gate), AuthNavigator (stack), AppNavigator (tabs + 5 stacks)
    ├── screens/
    │   ├── auth/            # AuthChoice, Login, RegisterStep1 (business type), RegisterStep2 (details), PendingApproval
    │   ├── chat/            # ChatList, ChatConversation
    │   ├── dashboard/       # DashboardScreen (revenue card, quick actions, recent orders, real-time banner)
    │   ├── earnings/        # EarningsScreen (period tabs, weekly chart, tx history), PayoutsScreen (Paystack)
    │   ├── more/            # MoreScreen (menu hub)
    │   ├── notifications/   # NotificationsScreen (mock data only)
    │   ├── onboarding/      # SplashScreen (2.2s timer), OnboardingScreen (4 slides)
    │   ├── orders/          # OrderList (status tabs), OrderDetails (status pipeline)
    │   ├── products/        # ProductList (grid), ProductDetails, AddProduct, EditProduct
    │   ├── profile/         # Profile, EditProfile, ChangePassword
    │   └── settings/        # StoreSettings (hours, days, min order, notif), Settings (general)
    ├── services/
    │   ├── api.ts           # Axios client + JWT interceptors + 401 refresh logic
    │   ├── socket.ts        # Socket.io client + auth re-handshake on token refresh
    │   ├── queryClient.ts   # TanStack Query config + AppState/NetInfo online-awareness
    │   ├── queryPersister.ts # 24h persistent cache via AsyncStorage
    │   ├── sentry.ts        # Sentry init, PII redaction, per-env sample rates
    │   ├── uploads.service.ts # Signed-URL image upload flow
    │   └── *.service.ts     # auth / products / orders / chat / earnings (mock + real paths)
    ├── store/               # Zustand: auth.store, socket.store, ui.store
    ├── types/               # auth.types, product.types, order.types, chat.types, earnings.types
    └── utils/               # constants (COLORS, SCREENS, TABS, BUSINESS_TYPE_*), formatCurrency, formatDate
```

> ⚠️ `BACKEND_IMPLEMENTATION_PLAN.txt` and `BACKEND_COST_SCOPE.txt` describe a different project ("TrustBase" — Twilio OTP, Paystack, scam reports). They are **not** the spec for this vendor app. The actual contract is in `API_SPECIFICATION.md`.

---

## 4. Architecture

| Layer            | Technology                                                |
|------------------|-----------------------------------------------------------|
| Framework        | React Native 0.83.6, Expo SDK 55                          |
| Language         | TypeScript 5.9 (strict)                                   |
| Navigation       | React Navigation v6 — Native Stack + Bottom Tabs (custom) |
| Client state     | Zustand (auth, socket, ui)                                |
| Server state     | TanStack Query v5 + AsyncStorage 24h persister            |
| HTTP             | Axios 1.7 with request/response interceptors              |
| Real-time        | socket.io-client v4.7 (websocket-only, manual reconnect)  |
| Forms            | React Hook Form 7 + Zod 3 (resolvers)                     |
| Styling          | NativeWind v4 + Tailwind 3.4 — but **inline StyleSheet is the actual pattern across screens** |
| Storage          | expo-secure-store (`accessToken`, `refreshToken`, `vendorId`) |
| Images           | expo-image-picker (multi-select up to 5, 0.8 quality) + signed-URL upload |
| Date/i18n        | date-fns 3.6                                              |
| Icons            | @expo/vector-icons (Ionicons)                             |
| Error tracking   | Sentry (wired, needs DSN — see TASKS P0-08)               |

**Auth flow.** `RootNavigator` calls `auth.store.loadFromStorage()` on mount → reads access token from SecureStore → fetches `/vendor/auth/me` → if `vendor.status === 'approved'`, mounts `AppNavigator` (tabs), otherwise `AuthNavigator`. Login persists tokens, connects socket, joins `vendor_room`. `apiClient` has a 401 interceptor that refreshes once; on refresh failure it deletes tokens but **does not** notify the auth store to log the user out (known issue).

**Mock mode.** Every service checks `process.env.EXPO_PUBLIC_USE_MOCK === 'true'` at module top and short-circuits to in-memory data with simulated latency. This means production bundles still ship the mock data — see "Known Gaps".

**Real-time channels.** `socket.ts` exposes a single module-scoped socket, plus typed emitters: `joinVendorRoom`, `joinChat`/`leaveChat`, `sendSocketMessage`, `emitTyping`, `emitOrderStatusUpdate`. Server events `new_order`, `new_message`, `typing`, `order_status_updated` are subscribed to inline in screens/hooks (DashboardScreen handles `new_order`, `useChat` handles `new_message`/`typing`).

**Tab structure.**
```
AppNavigator (BottomTabs, custom tab bar with unread chat badge from socket store)
├── Dashboard (Stack: DashboardScreen → NotificationsScreen)
├── Products  (Stack: ProductList → Details → Add → Edit)
├── Orders    (Stack: OrderList → OrderDetails)
├── Chat      (Stack: ChatList → ChatConversation)
└── More      (Stack: MoreScreen → Earnings/Payouts/Profile/EditProfile/ChangePassword/StoreSettings/Settings)
```

---

## 5. API Endpoints (mirror of `API_SPECIFICATION.md`)

Base URL: `process.env.EXPO_PUBLIC_API_URL` (defaults to `http://localhost:5000/api`). All protected routes use `Authorization: Bearer <accessToken>`.

**Auth** — `POST /vendor/auth/register`, `POST /vendor/auth/login`, `POST /vendor/auth/refresh`, `POST /vendor/auth/logout`, `GET /vendor/auth/me`, `PATCH /vendor/auth/me`, `PUT /vendor/auth/change-password`.

**Products** — `GET /vendor/products`, `GET /vendor/products/:id`, `POST /vendor/products`, `PATCH /vendor/products/:id`, `DELETE /vendor/products/:id`, `PATCH /vendor/products/:id/toggle-status`.

**Orders** — `GET /vendor/orders?status=...`, `GET /vendor/orders/:id`, `PATCH /vendor/orders/:id/status`, `GET /vendor/orders/dashboard-stats`.

**Chat** — `GET /vendor/chats`, `GET /vendor/chats/:chatId/messages`, `POST /vendor/chats/:chatId/messages`, `PATCH /vendor/chats/:chatId/read`.

**Earnings** — `GET /vendor/earnings/summary`, `GET /vendor/earnings/transactions`, `GET /vendor/earnings/chart/weekly`.

**Socket events**
- Client → Server: `join_vendor_room`, `join_chat`, `leave_chat`, `send_message`, `typing`, `update_order_status`.
- Server → Client: `new_order`, `new_message`, `typing`, `order_status_updated`.

---

## 6. Code Conventions Observed

- **Named function exports** for screens and components (`export function LoginScreen()` rather than default exports).
- **Per-screen `StyleSheet.create`** at the bottom of each file. The `nativewind` setup exists but is **not** used in practice — Tailwind classes do not appear in any screen. Treat StyleSheet as the convention until/unless this changes.
- **Brand colour palette** in `src/utils/constants.ts` (`COLORS.primary` = slate-950 `#0F172A`, `COLORS.accent` = yellow-400 `#FACC15`). Use these constants — do not hardcode hex.
- **Screen names** as constants in `SCREENS` (also in `constants.ts`). Always navigate with `navigation.navigate(SCREENS.X)` — no string literals.
- **Forms** use `react-hook-form` `<Controller>` blocks with a Zod schema declared above the component.
- **Server data** lives in TanStack Query; **app state** lives in Zustand. Don't mix.
- **Mutation pattern.** Hooks invalidate the relevant query keys on success (`PRODUCTS_KEY`, `ORDERS_KEY`, `DASHBOARD_STATS_KEY`, `CHATS_KEY`, `MESSAGES_KEY(chatId)`). When mutating an item, invalidate both the list key and `[...key, id]`.
- **Currency** always formatted via `formatCurrency` / `formatCurrencyCompact` (Naira, en-NG locale).
- **Dates** always formatted via the `formatDate.ts` helpers — don't call `date-fns` directly in screens.
- **Mock and real path live side by side** in every service. Preserve this pattern when adding endpoints.

---

## 7. Environment Variables

```
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_SOCKET_URL=http://localhost:5000
EXPO_PUBLIC_USE_MOCK=true
EXPO_PUBLIC_APP_NAME=EkoPicker Vendor
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_SENTRY_DSN=          # add when Sentry project is created (TASKS P0-08)
```

`EXPO_PUBLIC_*` vars are inlined at build time by Expo. Do not put secrets in them.

`.env` **is** in `.gitignore` (good). `.env.example` is committed (good).

---

## 8. Known Gaps & Tech Debt

These are documented so contributors don't waste time rediscovering them:

### Critical
- **Token-refresh failure is silent.** `services/api.ts` deletes tokens on refresh failure but does not call `useAuthStore.logout()` — the user remains on the app screen with no token until the next 401, and there is no concurrent-refresh guard (each in-flight 401 will fire its own refresh request).
- **API errors are not normalised.** Screens display `err.message` directly via `Alert.alert`, which on axios errors is "Request failed with status code 400" — never the server's actual `{ message, errors[] }` payload from the spec.

### High
- **Hardcoded fallback URL** `http://localhost:5000` in `api.ts` and `socket.ts` will silently target localhost in a production bundle if `EXPO_PUBLIC_API_URL` is not set at build time.
- **Mock data ships in production.** Mock arrays/seeds in every `*.service.ts` are evaluated at module load and shipped in the bundle. This adds size and exposes test fixtures.
- **Duplicate state for chat messages.** `useChat` writes new socket messages to both `qc.setQueryData(MESSAGES_KEY)` *and* `socket.store.liveMessages` — only one is needed, and screens currently read from the query cache only.
- **`socket.once('connect', ...)` race in `auth.store`.** If the socket is already connected by the time `.once('connect')` is registered, `joinVendorRoom` never fires.

### Medium
- **`useNavigation<any>()` and `useRoute<any>()`** everywhere drop type safety on params. `RootStackParamList` exists for auth, but no equivalent for the app stacks/tabs.
- **No pagination** anywhere despite `PAGE_SIZE = 20` constant — `getAll()` returns the entire list every time.
- **No abort signals** on any query — navigating away mid-fetch keeps the request alive.
- **Magic strings** for SecureStore keys (`'accessToken'`, `'refreshToken'`, `'vendorId'`) are duplicated across `api.ts`, `socket.ts`, and `auth.service.ts`.
- **`isDarkMode` exists in `ui.store`** and is wired to a Switch in MoreScreen and SettingsScreen, but **no screen actually consumes it** — toggling does nothing.
- **No error boundaries** — a render error in any screen crashes the whole app.
- **No accessibility labels** on `TouchableOpacity` controls (icon-only buttons especially).
- **Hardcoded "+12.5%"** growth metric on the dashboard revenue card (TASKS P0-03).
- **`StoreSettingsScreen` saves to nothing** — `handleSave` just sleeps 800 ms and shows an Alert (TASKS P0-04).
- **`NotificationsScreen` is mock-only** — no service, no socket subscription (TASKS P0-05).
- **`ProductDetailsScreen` returns `null`** when product is missing after loading — should show an error state.

### Low
- `console.log` calls in `socket.ts` connection handlers ship to production.
- Inline `StyleSheet.create({})` empty objects (e.g. `EditProductScreen`) are dead.
- TypeScript path alias `@/*` is configured but never used.

A prioritised remediation roadmap is in `TASKS.md` and `PROCESS_PLAN.md`.

---

## 9. Backlog & Model Routing

The full remediation backlog lives in **`TASKS.md`** (P0 → P3, priority-ordered). Each row carries a **Best model** column.

When Claude Code is asked to work on something here, it should:

1. Find the task (or closest match) in `TASKS.md`.
2. Switch to the recommended model before starting:
   - **Opus 4.7** for architecture decisions, multi-file refactors, and production-readiness calls.
   - **Sonnet 4.6** for typical code edits, hooks, services, screens, CI YAML, complex bug fixes (default).
   - **Haiku 4.5** for documentation, copy edits, mechanical chores, and codemods that don't require judgement.
3. Update the task's **Status** inline (Open → In Progress → Done).
4. Append a short note to "Audit fixes already applied" or to a `## Done` section when the task lands, with the commit SHA if available.

If a task has no recommendation column filled in, default to **Sonnet 4.6**.

---

## 10. Doing Tasks in This Repo

- **Adding an endpoint?** Add the type to `src/types/`, add both the mock and real branches in the right `*.service.ts`, expose it through a `useX` hook in `src/hooks/`, then consume from a screen. Mirror existing patterns rather than introducing new ones.
- **Adding a screen?** Add to `SCREENS` in `constants.ts`, register in the relevant stack in `AppNavigator.tsx`, wrap the screen in `<SafeScreen>` and use `<ScreenHeader>` for consistency.
- **Currency / dates?** Always go through the helpers in `src/utils/`.
- **Need a colour?** Pull from `COLORS` in `constants.ts`.
- **Don't introduce a new state library.** Zustand for client state, TanStack Query for server state.
- **Don't commit the demo login credentials** as the actual default — the `LoginScreen` defaultValues should be cleared before any real launch (TASKS P0-07).

---

## 11. Companion Documents

| File | Purpose |
|------|---------|
| `README.md` | Public-facing setup, scripts, conventions, troubleshooting. |
| `TASKS.md` | Live backlog (P0–P3) with task → model routing. **Update inline.** |
| `UPGRADE.md` | SDK upgrade log (51 → 52 → 53 → 54 → 55). All steps complete. |
| `PRODUCTION_READINESS.md` | Ship-readiness verdict + operational checklist. |
| `ARCHITECTURE.md` | Layered design, data flow, navigation tree, real-time channels. |
| `API_DOCS.md` | Authoritative REST + Socket.io contract. |
| `PROCESS_PLAN.md` | Phased roadmap (Phase 0 → 7) with exit criteria + risk register. |
| `SERVER_SETUP.md` | One-time manual steps for SonarCloud / Sentry / EAS / Apple / Google / GCP. |
| `SCALE.md` | Production-scale playbook — what mobile already does, what backend must do, load-test scenario, cost ceilings. |
| `API_SPECIFICATION.md` | Original short spec — kept for history; `API_DOCS.md` supersedes. |
| `DEVLOG.md` | Running session log — decisions, setup steps, outstanding TODOs. Newest entries at the top. |
| `BACKEND_IMPLEMENTATION_PLAN.txt` / `BACKEND_COST_SCOPE.txt` | ❌ Unrelated ("TrustBase"). Ignore. |

---

## 12. CI / CD & Tooling Status

- ESLint v8 (`.eslintrc.cjs`) + Prettier (`.prettierrc`) + Husky v9 + lint-staged + Jest (`jest-expo ~55`) — all configured and active.
- GitHub Actions: `pr.yml` (lint/type-check/test/SonarCloud) + `main.yml` (EAS OTA update + Sentry release) + `codeql.yml` + `bundle-size.yml` + `dependabot.yml`.
- Sentry: `src/services/sentry.ts` wired with PII redaction + per-env sample rates. Needs DSN + `npx expo install @sentry/react-native` (TASKS P0-08).
- SonarCloud: `sonar-project.properties` exists — fill `sonar.projectKey` + `sonar.organization` (see `SERVER_SETUP.md`).
- EAS: `eas.json` has development / preview / staging / production profiles. Run `eas init` to get real project ID (TASKS P0-06).
- `.husky/pre-commit` runs `lint-staged` + `tsc --noEmit`. `.husky/commit-msg` enforces Conventional Commits.

---

## 13. Known Local-dev Gotchas

- **Metro OOM on Windows.** `npm run start` may crash with "JavaScript heap out of memory". Workaround: `$env:NODE_OPTIONS='--max-old-space-size=4096'` before starting.
- **`--legacy-peer-deps` required** for `npm install` because some transitive deps lag behind RN 0.83's peer-dep declarations.
- **Expo Go does NOT support SDK 55** via the Play Store / App Store at this time. Use a **Development Build** instead:
  ```bash
  # Option A — local (requires Android Studio)
  npx expo run:android
  # Option B — EAS cloud build (requires Expo login + eas init)
  npx eas build --profile development --platform android
  ```
  Install the resulting APK on your device. After that, Metro hot-reload works exactly like Expo Go.
- **`.husky/_/` directory** is auto-managed by Husky v9 — don't edit, only edit hook files at `.husky/pre-commit` and `.husky/commit-msg`.

---

## 14. Branch Workflow

- `main` — stable, production-ready code only. **No direct commits.** Branch protection enforced.
- `chore/expo-sdk-55-upgrade` — current active branch (SDK 51 → 55 upgrade, complete as of 2026-05-20).
- All work happens on feature/fix/chore branches. Open a PR to merge into `main`.
- A GitHub Action auto-creates a PR from `chore/expo-sdk-55-upgrade → main` every 2 days as a progress checkpoint.
- **The merge into main is always done by a human** — review the diff, approve, then click Merge. This is intentional and non-negotiable for safety.
- Conventional Commits are enforced by Husky commit-msg hook: `feat|fix|chore|docs|style|refactor|test|perf|build|ci|revert`.
