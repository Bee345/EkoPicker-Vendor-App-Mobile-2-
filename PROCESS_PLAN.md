# PROCESS_PLAN.md — Phased Roadmap

The opinionated, dependency-aware sequence for taking the EkoPicker Vendor app from "wired up against mocks" to "shippable v1.0 in stores". Cross-references `TASKS.md` (which is the live backlog) and `PRODUCTION_READINESS.md` (which is the launch checklist).

> Convention: each phase has an **Exit criterion** — the explicit signal that you can move on. Don't skip ahead.

---

## Phase 0 — Onboarding pass (DONE — completed during this analysis)

| Item | Status |
|------|--------|
| Audit (Phases 1–3 of onboarding workflow) | ✅ |
| `CLAUDE.md`, `TASKS.md`, `README.md`, `ARCHITECTURE.md`, `API_DOCS.md`, `PROCESS_PLAN.md`, `PRODUCTION_READINESS.md`, `SERVER_SETUP.md` | ✅ |
| Critical/High audit fixes (token-refresh queue, error parser, ErrorBoundary, race-safe socket join, useEffect deps, demo-cred gating, broken-package removal) | ✅ |
| ESLint + Prettier + Husky + lint-staged + Jest skeleton + GitHub Actions + Dependabot + CodeQL + Sonar config + Sentry stub + EAS profile | ✅ |
| `git init` (no remote yet) | ✅ |

**Exit criterion:** This document exists. ✅

---

## Phase 1 — External services live (week 1)

The goal is to turn every "we have a config for X" into "X is actually receiving data".

1. **GitHub remote** — push to `git@github.com:YOUR_ORG/ekopicker-vendor.git`. Add branch protection on `main`.
2. **SonarCloud** — import the repo, paste the project key into `sonar-project.properties`, add `SONAR_TOKEN` secret. **Exit criterion:** open a PR, watch the Sonar job pass.
3. **Sentry** — create the project, paste the DSN into `.env` (locally) and EAS profile env (for builds). Add the four secrets in GitHub. **Exit criterion:** trigger a deliberate `throw` and see it land in Sentry.
4. **EAS** — `eas init` (writes the real `extra.eas.projectId` into `app.json`), `eas login` once, run a `preview` build. **Exit criterion:** preview APK/iOS link in your inbox.
5. **Apple + Google accounts** — enroll in Apple Developer Program, set up Play Console. **Exit criterion:** bundle IDs `com.ekopicker.vendor` registered in both consoles.

Owner: 1× DevOps engineer. Estimate: 2–4 days.

---

## Phase 2 — Backend MVP (weeks 2–4)

The mobile app is meaningless without a real backend. Build it against the spec in `API_DOCS.md`.

### Phase 2a — Auth + DB (days 1–4)

- Express + Postgres (managed: Supabase / Neon / Railway / Cloud SQL).
- Migrations for `vendors`, `vendor_addresses`, `refresh_tokens`.
- Endpoints: `POST /vendor/auth/{register,login,refresh,logout}`, `GET/PATCH /vendor/auth/me`, `PUT /vendor/auth/change-password`.
- JWT issuance + refresh-token rotation with single-use guarantee.
- Forgot-password flow (TASKS P0-02): `POST /vendor/auth/forgot-password` (email link), `POST /vendor/auth/reset-password`. Use Resend or SES.

**Exit criterion:** Mobile app with `EXPO_PUBLIC_USE_MOCK=false` can register → login → load profile → change password against this backend.

### Phase 2b — Products + image upload (days 5–8)

- DB: `products`, `product_images`.
- `POST /vendor/uploads/image` returning HTTPS URL (S3 / Cloudflare R2 / Supabase Storage).
- CRUD per spec, including `toggle-status`.
- Vendor scoping enforced server-side (a vendor cannot read/write another vendor's products).

**Exit criterion:** Pick a product image from the device, see it persist as an HTTPS URL, reload from another device.

### Phase 2c — Orders + dashboard stats (days 9–12)

- DB: `orders`, `order_items`, `order_status_history`.
- CRUD per spec including state-machine guard (no skipping statuses).
- `dashboard-stats` endpoint with real `growthVsLastWeek` (replace hardcoded `+12.5%`).

**Exit criterion:** A test customer (via the user app or admin panel) places an order; the vendor app shows it on the dashboard within 60 s (poll fallback) and immediately if Socket.io is also up.

### Phase 2d — Chat + Socket.io (days 13–16)

- Socket.io server with JWT auth on `connection`. Rooms per `API_DOCS.md`.
- `messages` table (chat_id, sender_id, sender_type, text, read, created_at).
- REST endpoints + emit fan-out.
- Read-receipts via `PATCH /vendor/chats/:id/read`.

**Exit criterion:** Vendor and customer can chat in real time; typing indicators appear; unread badge clears on read.

### Phase 2e — Earnings + transactions (days 17–18)

- Read-only views on the orders table for `summary` + `transactions`.
- Weekly chart aggregation.
- Payouts and Paystack: out of scope for v1.0; manual payouts initially.

**Exit criterion:** Earnings screen shows accurate today/week/month/all-time totals matching the underlying orders table.

### Phase 2f — Notifications + push tokens (days 19–21)

- DB: `notifications`, `push_tokens`.
- `POST /vendor/push-tokens` (on login + token refresh).
- `GET /vendor/notifications` (replaces hardcoded mock — TASKS P0-05).
- Trigger pushes on `new_order` + `new_message` via Expo Push API.

**Exit criterion:** Vendor receives an Expo push notification for a new order while the app is backgrounded.

---

## Phase 3 — Mobile cleanup (week 5)

By now the backend is real. Walk the TASKS.md P0/P1 list to zero.

- **P0-04** Wire `StoreSettingsScreen.handleSave` to `PATCH /vendor/store-settings`.
- **P1-01** Type-narrow every `useNavigation<any>()` and `useRoute<any>()` against per-stack `ParamList`.
- **P1-02** Move mock data to `src/__mocks__/` and conditionally import to keep production bundles lean.
- **P1-03** Add pagination to product/order/chat lists using `useInfiniteQuery`.
- **P1-04** Pause polling when `AppState !== 'active'`.
- **P1-05** AbortSignal on every query.
- **P1-06** Decide darkmode strategy (implement for real, or remove the toggle).
- **P1-08** Accessibility labels for icon-only buttons.

**Exit criterion:** TASKS.md P0 = 0 open, P1 ≤ 2 open with conscious deferral.

---

## Phase 4 — Tests (week 5, parallel with Phase 3)

- Unit: `formatCurrency`, `formatDate`, `apiError.parseApiError`, `auth.store` reducers.
- Hook tests: `useChat` (mock socket), `useUpdateOrderStatus` optimistic-update.
- Smoke screens: `LoginScreen` form validation, `ProductListScreen` empty state.
- Optional: 1× Detox flow for `login → place mock order → advance status`.

**Exit criterion:** `npm test` runs in CI on every PR with > 50% line coverage on `src/services/` and `src/store/`.

---

## Phase 5 — Beta distribution (week 6)

- Build with `eas build --profile preview` for both platforms.
- TestFlight (iOS) — invite vendors as external testers (App Store review needed for 100+ testers).
- Play Internal Testing (Android) — direct opt-in link.
- Sentry release tagging — verify source maps resolve to readable filenames.
- Run a closed beta for ≥ 1 week with at least 5 real vendors.
- Triage Sentry issues + Sonar quality-gate failures.

**Exit criterion:** No P0/P1 incident in 7 consecutive days of beta usage.

---

## Phase 6 — Public launch (week 7)

- `eas build --profile production` for iOS + Android.
- `eas submit --profile production` to App Store + Play.
- App Store / Play review (3–7 days iOS, 1–3 days Android).
- Tag `v1.0.0` in git. Cut a Sentry release. Announce.

**Exit criterion:** Build is *Available* in both stores. Anyone can install it.

---

## Phase 7 — Post-launch (week 8+)

| Track | Owner | First-30-days work |
|-------|-------|--------------------|
| Reliability | Backend + DevOps | Sentry alert routing, error budget, p95 latency targets, on-call. |
| Growth | Product | Vendor onboarding funnel analytics. App Store optimisation. |
| Hardening | Mobile | TASKS.md P2-* items, especially typed navigation, pagination polish, dark mode if not done. |
| Compliance | Legal + Eng | Privacy policy + ToS go live; Apple/Google data-safety questionnaires updated. |
| Scaling | Backend | Add read replicas, switch socket.io to Redis adapter for horizontal scale. |

**Exit criterion:** Continuous. The product is alive — TASKS.md is now your perpetual backlog.

---

## Risk register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Backend slips beyond Phase 2 estimate | Medium | High | Slice Phase 2 into independently shippable pieces; can launch with REST-only and add sockets later. |
| Apple Review rejects a vendor-only app | Low | Medium | Ensure Demo Account is provided; the app must demonstrate value to a reviewer. |
| Image upload pipeline overruns | Medium | Medium | Use a managed storage provider (Supabase / R2). Don't hand-roll multipart at first. |
| RN 0.74 / Expo SDK 51 ages out before launch | Low (5/2026) | Low | Plan an SDK 53 upgrade in Phase 7 if it's released. Pin majors via Dependabot ignore rules already configured. |
| Pre-existing 24 npm vulnerabilities in transitive deps | Low | Medium | Run `npm audit` weekly; most are dev-only and fixed by transitive bumps via Dependabot. |
| Sentry source maps don't resolve | Medium | Low | Test in Phase 1 step 3 before relying on Sentry. |
| `jest-expo@55` installed against Expo 51 | Low | Low | Pin to `~51.x.x` — see TASKS.md `P2-11`. |

---

## Product decisions (locked 2026-05-08)

These were ratified in the onboarding pass. Treat as authoritative.

1. ✅ **Forgot-password channel — email link** (Resend or SES). No SMS OTP for password reset.
2. ✅ **Payouts — Paystack from day one** (TASKS P0-09). Adds ~1 week to Phase 2 backend.
3. ✅ **Dark mode — implement properly** for v1.0 (TASKS P1-06). Light + dark variants of `COLORS` + theme context.

## Still open

4. **Target platforms** — Android-first vs. iOS+Android simultaneously vs. add Web. Backend & EAS work is identical; gate iOS on App Review timing.
5. **Multi-language** — English-only at launch? Yoruba/Igbo/Hausa would help adoption.
6. **Vendor approval rejection UX** — currently the app has Pending Approval; what happens for `rejected` or `suspended` states?
7. **Audit trail** — does the admin need to see who-changed-what for orders / products?

---

## Versioning & release cadence (recommendation)

- `vMAJOR.MINOR.PATCH` semver.
- `MINOR` bump on new feature → store re-submit (full review).
- `PATCH` bump on bug fix → ship via `eas update` (OTA, no review) when possible.
- Tag releases in git; Sentry release name = `<bundleId>@<version>+<build>` per Expo conventions.
- Changelog kept in `CHANGELOG.md` (not yet created; consider on first release).
