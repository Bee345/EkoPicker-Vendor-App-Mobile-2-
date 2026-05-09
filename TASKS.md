# TASKS.md — Remediation Backlog & Model Routing

This file is the *backlog* for the EkoPicker Vendor app. Each task carries:

- **Priority** — Critical / High / Medium / Low (matches the audit severity).
- **Best model** — which Claude model is best-suited to do the task (so a human or an automation can pick the right one). See the routing rubric at the bottom.
- **Status** — Open / In Progress / Done. Update inline when work happens.

`CLAUDE.md` references this file: when Claude Code is asked to work on an open task here, it should pick the model recommended in the **Best model** column.

---

## Routing rubric (rule of thumb)

| Task shape                                                                 | Recommended model |
|----------------------------------------------------------------------------|-------------------|
| Architecture / multi-file refactor / production-readiness judgement calls  | **Claude Opus 4.7** |
| Mid-size code edits, hooks, services, screens, CI YAML, complex bug fixes  | **Claude Sonnet 4.6** |
| Documentation drafting, README/CHANGELOG, release notes, copy edits        | **Claude Haiku 4.5** |
| Mechanical chores: file rename, lint auto-fix, regex replace, simple typos | **Claude Haiku 4.5** |

When in doubt, start with Sonnet 4.6 — it covers most engineering work.

---

## P0 — Production blockers (must fix before public launch)

| # | Task | Best model | Status |
|---|------|-----------|--------|
| P0-01 | Wire a real backend (mock-mode is the default; the API per `API_SPECIFICATION.md` does not exist yet) | Opus 4.7 (architecture), Sonnet 4.6 (impl) | Open |
| P0-02 | Forgot-password flow — email-link reset via Resend/SES (decided 2026-05-08). Add `/vendor/auth/forgot-password` + `/vendor/auth/reset-password` endpoints, screen + deep-link handler in app. | Sonnet 4.6 | Open |
| P0-03 | Replace the hardcoded "+12.5%" growth indicator on the Dashboard revenue card with a real metric (or hide it) | Sonnet 4.6 | Open |
| P0-04 | `StoreSettingsScreen.handleSave` is a fake save — wire it to a real `PATCH /vendor/store-settings` endpoint and add the route to the spec | Sonnet 4.6 | Open |
| P0-05 | `NotificationsScreen` shows hardcoded mock data — needs a service + socket subscription | Sonnet 4.6 | Open |
| P0-06 | EAS project ID in `app.json` is the placeholder `"ekopicker-vendor"` — run `eas init` and replace with the real UUID | Haiku 4.5 (5-min chore) | Open |
| P0-07 | Remove demo credentials from `LoginScreen` defaultValues entirely once mock-mode is removed for production | Haiku 4.5 | Open (currently gated on `EXPO_PUBLIC_USE_MOCK`, so already safe for prod builds) |
| P0-08 | Set up Sentry DSN, init in `App.tsx`, forward errors from `ErrorBoundary` | Sonnet 4.6 | Open |
| P0-09 | **Paystack payout integration (decided 2026-05-08).** Backend: `POST /vendor/earnings/payout` to initiate, Paystack transfer API integration, webhook to update transaction status, `pendingPayouts` derived from a real ledger. App: "Request payout" CTA on EarningsScreen, payout history view. | Sonnet 4.6 (impl) + Opus 4.7 (ledger schema design) | Open |

## P1 — High priority (should fix soon)

| # | Task | Best model | Status |
|---|------|-----------|--------|
| P1-01 | Replace every `useNavigation<any>()` and `useRoute<any>()` with typed param lists (`AppStackParamList`, per-stack types) | Sonnet 4.6 | Open |
| P1-02 | Move mock data to `src/__mocks__/` and conditionally import only when `EXPO_PUBLIC_USE_MOCK=true` so it tree-shakes out of production | Sonnet 4.6 | Open |
| P1-03 | Add pagination support to `getProducts`, `getOrders`, `getChats`, `getMessages` — `PAGE_SIZE = 20` already exists | Sonnet 4.6 | Open |
| P1-04 | Pause `useOrders` and `useDashboardStats` polling when `AppState !== 'active'` to save battery | Sonnet 4.6 | Open |
| P1-05 | Pass `AbortSignal` to all axios queries so navigation cancels in-flight requests | Sonnet 4.6 | Open |
| P1-06 | Implement `isDarkMode` properly (decided 2026-05-08 — proceed): theme provider + apply across screens. Recommend rolling our own with `COLORS_LIGHT` / `COLORS_DARK` exports rather than pulling in a UI library. | Opus 4.7 (architecture) + Sonnet 4.6 (codemod) | Open |
| P1-07 | `react-native-reanimated/plugin` should be the **last** plugin in `babel.config.js` — verify ordering after any changes | Haiku 4.5 (currently is last) | Done (verified) |
| P1-08 | Add `accessibilityLabel` / `accessibilityRole` to every icon-only `TouchableOpacity` | Haiku 4.5 | Open |
| P1-09 | Switch from `socket.io-client` `transports: ['websocket']` only — allow `polling` fallback for restrictive networks | Sonnet 4.6 | Open |
| P1-10 | Avatar fallback `name?.[0]` is not surrogate-pair-safe — use `Array.from(name)[0]` for emoji/non-BMP names | Haiku 4.5 | Open |

## P2 — Medium priority (tech debt, ergonomics)

| # | Task | Best model | Status |
|---|------|-----------|--------|
| P2-01 | Adopt the `@/*` path alias project-wide instead of `../../` chains | Haiku 4.5 (codemod) | Open |
| P2-02 | Decide between NativeWind and StyleSheet — currently configured but not used; commit either way and remove the other | Opus 4.7 (decision) + Sonnet 4.6 (codemod) | Open |
| P2-03 | Add Jest + RN Testing Library unit tests for `formatCurrency`, `formatDate`, the auth store, and the chat hook | Sonnet 4.6 | Open |
| P2-04 | Add Detox (or Maestro) e2e tests for login → dashboard → place-order pipeline | Sonnet 4.6 | Open |
| P2-05 | Implement multi-image carousel + zoom on `ProductDetailsScreen` | Sonnet 4.6 | Open |
| P2-06 | Image upload: currently the picker stores local URIs; a real backend needs upload to S3/Cloudinary first → swap URIs for hosted URLs | Sonnet 4.6 | Open |
| P2-07 | Order list could grow to thousands — switch from `FlatList` + filtering to `useInfiniteQuery` + server-side filter | Sonnet 4.6 | Open |
| P2-08 | `ChangePasswordScreen` doesn't sign the user out after change — typical UX is to force re-login | Haiku 4.5 | Open |
| P2-09 | Add password-strength meter to register/change password | Haiku 4.5 | Open |
| P2-10 | Internationalisation (i18next) — currently English-only Naira; add Yoruba/Igbo/Hausa | Sonnet 4.6 | Open |

## P3 — Polish

| # | Task | Best model | Status |
|---|------|-----------|--------|
| P3-01 | Splash → Onboarding 2.2 s timer feels slow; gate on `Asset.loadAsync` instead | Haiku 4.5 | Open |
| P3-02 | Add a "test push notification" button in StoreSettings → Notifications | Haiku 4.5 | Open |
| P3-03 | Empty-state illustrations instead of emoji icons | Haiku 4.5 | Open |
| P3-04 | Animated tab bar (icons grow on focus) — already partially done, finish | Sonnet 4.6 | Open |
| P3-05 | Replace `ScreenHeader` text title with optional logo for top-level screens | Haiku 4.5 | Open |
| P3-06 | Document keyboard shortcuts in the Expo dev client | Haiku 4.5 | Open |

---

## Audit fixes already applied

These were addressed during the onboarding pass — listed here so they're not picked up as fresh work.

- ✅ Token-refresh queue & forced logout on refresh failure (`src/services/api.ts`).
- ✅ Concurrent-refresh guard (single in-flight promise).
- ✅ Server error normalisation (`src/utils/apiError.ts`, used in `LoginScreen`).
- ✅ Hardcoded `localhost:5000` fallbacks removed; missing env vars now warn loudly.
- ✅ Centralised SecureStore keys (`src/utils/storageKeys.ts`).
- ✅ Race-safe socket room join (`onSocketReady` helper).
- ✅ `useChat` no longer double-stores messages (Zustand mirror dropped).
- ✅ Mark-as-read now invalidates `CHATS_KEY`.
- ✅ Tab-bar subscribes to a single Zustand selector (no whole-store re-renders).
- ✅ `useEffect` deps fixed in DashboardScreen and useChat.
- ✅ `<ErrorBoundary>` wraps the app root.
- ✅ Skeleton actually pulses (Animated opacity loop).
- ✅ Demo credentials gated on `EXPO_PUBLIC_USE_MOCK`.
- ✅ `ProductDetailsScreen` shows a real "not found" state.
- ✅ Removed incompatible `react-native-worklets` / `react-native-worklets-core` (RN 0.81+ peer dep, project is on 0.74.5).
- ✅ Removed deprecated `@types/react-native` (RN ships its own types since 0.71).
- ✅ Pre-existing TypeScript strict-mode errors in `SettingsScreen` and `products.service` resolved.
