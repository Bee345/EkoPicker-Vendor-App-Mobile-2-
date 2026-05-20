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
| P0-09 | **Paystack payout integration (decided 2026-05-08).** Backend: `POST /vendor/payouts` to initiate, Paystack transfer API integration, webhook to update status, ledger-based `pending_payout` balance. Mobile-side (DONE 2026-05-08): `PayoutsScreen` with bank picker, account form, request flow, history list; types/services/hooks; CTA on EarningsScreen; full mock implementation; backend contract documented in `API_DOCS.md`. **Backend remaining.** | Sonnet 4.6 (impl) + Opus 4.7 (ledger schema design) | In Progress (mobile ✅, backend pending) |

## P1 — High priority (should fix soon)

| # | Task | Best model | Status |
|---|------|-----------|--------|
| P1-01 | Replace every `useNavigation<any>()` and `useRoute<any>()` with typed param lists (`AppStackParamList`, per-stack types) | Sonnet 4.6 | Open |
| P1-02 | Move mock data to `src/__mocks__/` and conditionally import only when `EXPO_PUBLIC_USE_MOCK=true` so it tree-shakes out of production | Sonnet 4.6 | Open |
| P1-03 | Add pagination support to `getProducts`, `getOrders`, `getChats`, `getMessages` — `PAGE_SIZE = 20` already exists | Sonnet 4.6 | Open |
| P1-04 | Pause `useOrders` and `useDashboardStats` polling when `AppState !== 'active'` to save battery | Sonnet 4.6 | Done (2026-05-09 — `src/services/queryClient.ts` wires AppState → focusManager) |
| P1-05 | Pass `AbortSignal` to all axios queries so navigation cancels in-flight requests | Sonnet 4.6 | Open |
| P1-06 | Implement `isDarkMode` properly (decided 2026-05-08 — proceed): theme provider + apply across screens. Recommend rolling our own with `COLORS_LIGHT` / `COLORS_DARK` exports rather than pulling in a UI library. | Opus 4.7 (architecture) + Sonnet 4.6 (codemod) | Open |
| P1-07 | `react-native-reanimated/plugin` should be the **last** plugin in `babel.config.js` — verify ordering after any changes | Haiku 4.5 (currently is last) | Done (verified) |
| P1-08 | Add `accessibilityLabel` / `accessibilityRole` to every icon-only `TouchableOpacity` | Haiku 4.5 | Open |
| P1-09 | Switch from `socket.io-client` `transports: ['websocket']` only — allow `polling` fallback for restrictive networks | Sonnet 4.6 | Done (2026-05-09) |
| P1-10 | Avatar fallback `name?.[0]` is not surrogate-pair-safe — use `Array.from(name)[0]` for emoji/non-BMP names | Haiku 4.5 | Open |
| P1-11 | TLS certificate pinning on the API host (mitigates MITM on hostile WiFi) | Sonnet 4.6 — needs custom dev client (Expo prebuild) | Open |
| P1-12 | i18n scaffolding (`i18next` + `react-i18next`) — extract every hardcoded English string. Yoruba/Igbo/Hausa to follow | Sonnet 4.6 (codemod-heavy) | Open |
| P1-13 | Convert `useOrders` / `useProducts` / `useChats` to `useInfiniteQuery` for proper pagination | Sonnet 4.6 | Open |
| P1-14 | Pin dev-deps to versions matching Expo SDK 51: `eslint-config-expo@~7.1.2`, `jest@^29.4.0`, `jest-expo@~51.0.4`, `expo-image-picker@~15.1.0`. Run `npx expo install --check` to verify. | Haiku 4.5 | Open |

## P2 — Medium priority (tech debt, ergonomics)

| # | Task | Best model | Status |
|---|------|-----------|--------|
| P2-01 | Adopt the `@/*` path alias project-wide instead of `../../` chains | Haiku 4.5 (codemod) | Open |
| P2-02 | Decide between NativeWind and StyleSheet — currently configured but not used; commit either way and remove the other | Opus 4.7 (decision) + Sonnet 4.6 (codemod) | Open |
| P2-03 | Add Jest + RN Testing Library unit tests for `formatCurrency`, `formatDate`, the auth store, and the chat hook | Sonnet 4.6 | Open |
| P2-04 | Add Detox (or Maestro) e2e tests for login → dashboard → place-order pipeline | Sonnet 4.6 | Open |
| P2-05 | Implement multi-image carousel + zoom on `ProductDetailsScreen` | Sonnet 4.6 | Open |
| P2-06 | Image upload: signed-URL flow shipped (`src/services/uploads.service.ts`), wired into `AddProductScreen`. Backend must implement `POST /vendor/uploads/sign`. | Sonnet 4.6 | Done — mobile (2026-05-09); backend pending |
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

## Mobile-side payouts work (P0-09) — landed 2026-05-09

- Types: `PayoutAccount`, `Payout`, `PayoutStatus`, `Bank`, `SavePayoutAccountDto`, `RequestPayoutDto`. `EarningsSummary` extended with `growthVsLastWeek` + `nextPayoutDate`.
- Service: `earningsService.{getBanks, getPayoutAccount, savePayoutAccount, getPayouts, requestPayout}` with mock + real branches. Mock simulates a 4 s Paystack webhook delay so processing → success transitions are visible.
- Hooks: `useBanks`, `usePayoutAccount`, `useSavePayoutAccount`, `usePayouts` (polls every 30 s), `useRequestPayout` (invalidates summary + transactions on success).
- Screen: `src/screens/earnings/PayoutsScreen.tsx` — balance card, account form (with bank picker modal + 10-digit account validation), request-payout flow (amount + 25/50/Max quick pills + confirmation alert), history list with status badges.
- Navigation: `SCREENS.PAYOUTS` added; route registered in `MoreStack`. EarningsScreen has a `Pending Payout` CTA banner that navigates here.
- Backend contract: `API_DOCS.md` § "Payouts (Paystack)" defines all six endpoints (banks list, account get/save, history, request, webhook) plus the ledger schema recommendation.

## Scale upgrades (shipped 2026-05-09)

These move the app from "works locally" to "survives 10K vendors". See `SCALE.md` for the full playbook.

- ✅ **Polling pauses on background** — `src/services/queryClient.ts` wires `AppState` → `focusManager`. Saves ~333 RPS on the orders endpoint at year-1 scale.
- ✅ **Online-state aware** — NetInfo → `onlineManager`. No queries fire on disconnected networks.
- ✅ **Persistent query cache** — `@tanstack/react-query-persist-client` + AsyncStorage. 24h TTL. Auth/chats/messages/payouts deliberately excluded.
- ✅ **Exponential backoff with jitter** — retries up to 3× with 1s × 2^n + 30% jitter, capped at 30s. 4xx (except 408/429) skip retry.
- ✅ **Socket re-auth on token rotation** — `refreshSocketAuth()` called from `api.ts` after a successful refresh; sockets re-handshake with the new token. Polling-fallback transport added for restrictive networks.
- ✅ **Sentry hardened** — per-environment sample rates, replay throttled, `beforeSend` PII redactor (passwords, tokens, account numbers, phone, email), `setUserContext` on login, cleared on logout.
- ✅ **Image upload (signed-URL)** — `src/services/uploads.service.ts` implements two-step `POST /vendor/uploads/sign → PUT to storage`. AddProductScreen uses it. Mobile enforces `maxBytes` client-side.
- ✅ **EAS staging channel** — `eas.json` has `development / preview / staging / production`. OTA workflow targets `staging`; tag push targets `production`.
- ✅ **Tag-gated production deploys** — `.github/workflows/main.yml` only builds production on `v*.*.*` tag pushes. Push to `main` only triggers an OTA staging update.
- ✅ **Bundle-size CI check** — `.github/workflows/bundle-size.yml` fails PRs that grow the JS bundle by > 10% AND > 500 KB.
- ✅ **`SCALE.md`** — backend scale playbook (Postgres indexes/partitioning/pooling, Redis socket adapter, S3 + CDN, observability targets, k6 load-test scenario, cost ceilings).

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
