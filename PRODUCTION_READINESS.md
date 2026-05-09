# Production Readiness Verdict — EkoPicker Vendor App

> Generated as part of the onboarding analysis pass (May 2026).
> **Verdict: NOT production-ready.** Realistic ship date is 4–6 engineering weeks behind the current state, gated primarily on the backend not yet existing.

---

## TL;DR

| Layer | Status | Notes |
|-------|--------|-------|
| Mobile app code quality | 🟡 Solid foundation | Onboarding pass closed all Critical/High audit items; remaining work is documented in `TASKS.md`. |
| Backend API | 🔴 Does not exist | `API_SPECIFICATION.md` is the contract; no server is running. The other "Backend Plan" docs in this repo describe a different project (TrustBase) and should be ignored. |
| Real-time (Socket.io) | 🔴 Server-side missing | Mobile client is wired correctly; no socket server to connect to. |
| Auth | 🟡 Partial | JWT + refresh-queue is implemented client-side. Forgot-password is wired in UI but has no backend endpoint or screen. |
| Notifications | 🔴 Mock-only | `NotificationsScreen` reads a hardcoded array. No FCM/APNs configured. |
| Payments / payouts | 🔴 Out of scope here | Earnings UI exists; payout flow is read-only. Backend will need Paystack integration. |
| CI/CD | 🟢 Configured | GitHub Actions, Husky, ESLint, Prettier, Jest, Sonar, CodeQL, Dependabot, Sentry, EAS — all in this PR. Server-side activations require manual handoff (see `SERVER_SETUP.md`). |
| Crash reporting | 🟡 Wired | Sentry SDK call sites exist, gated on `EXPO_PUBLIC_SENTRY_DSN`. Add DSN → live. |
| Tests | 🔴 None yet | `jest-expo` configured; no tests written. P2-03 in TASKS.md. |
| Store distribution | 🔴 Not configured | `eas.json` is committed but `eas init` hasn't been run; no Apple/Google Play submission credentials. |

---

## What's blocking ship

### Hard blockers (must fix before any public release)

1. **Backend doesn't exist.** Mock mode (`EXPO_PUBLIC_USE_MOCK=true`) is the default and every service silently falls back to fixtures. A real Express/Postgres backend matching `API_SPECIFICATION.md` is **prerequisite** to anything. Estimated 3–5 weeks for a small backend team based on the spec.
2. **Forgot-password.** UI shows the link; no flow. Either implement it or remove the link.
3. **Notifications screen + push.** Currently mock-only. Needs a service, socket subscription, and Expo Notifications wiring with FCM/APNs tokens registered against the backend.
4. **Store-settings save is fake.** `StoreSettingsScreen.handleSave` does `setTimeout(800)` and an Alert — UX lies to the vendor.
5. **EAS project ID** in `app.json` is the placeholder string `"ekopicker-vendor"`. Run `eas init` and replace with the real UUID before any build.
6. **Hardcoded "+12.5%"** growth metric on the Dashboard revenue card. Either compute it from `dashboard-stats` (period-over-period) or hide the badge until real data exists.

### Soft blockers (acceptable for v1.0 if you accept the trade-off, but track)

7. **Image upload.** `expo-image-picker` returns *local URIs*. The backend has to accept multipart uploads, persist to S3/Cloudinary, and the app has to upload before submitting product create/update. Currently the app sends `file://...` URIs — those will never resolve on a server.
8. **Pagination missing** on every list. Fine for early users with <50 products/orders; will degrade quickly.
9. **No tests at all.** Risky for any change to the chat or refresh-token flow. Recommend at least: auth-store unit tests, formatCurrency/Date tests, ProductList smoke test.
10. **`isDarkMode` is a fake toggle.** Wired to two Switches but consumed by zero screens. Either implement properly or remove.

---

## What's solid right now

These are good — don't regress them:

- **TanStack Query + Zustand split** is clean: server state vs. client state.
- **React Hook Form + Zod** with `<Controller>` blocks is consistent across all forms.
- **Service layer pattern** (each domain has its own `*.service.ts` with a mock/real branch) is easy to extend.
- **Screen components** are self-contained, named exports, with their styles below — easy to find work.
- **Token refresh** now has a single in-flight promise, the auth store is notified on failure, and SecureStore keys are centralised.
- **ErrorBoundary** wraps the app root and forwards to Sentry.
- **SafeScreen / ScreenHeader** layout primitives keep header/safe-area concerns out of every screen.
- **Custom tab bar** handles unread badges via a Zustand selector — won't re-render on typing events.

---

## Recommended path to ship (high-level)

```
Week 1   Backend bootstrap: Express + Postgres + Supabase Auth (or whatever the team picks).
         Land /vendor/auth/* endpoints + /vendor/auth/refresh end-to-end.
Week 2   Products + Orders endpoints. File upload (S3) for product images.
         Start ditching mock mode in dev — point app at a real localhost backend.
Week 3   Chat (Socket.io server, Mongo or Postgres for messages/reads).
         Earnings (read-only views; Paystack payout webhooks later).
Week 4   Forgot-password, push notifications (Expo Notifications + FCM).
         Implement notifications service, replace mock array.
Week 5   QA pass: real device testing on iOS + Android, fix race conditions.
         Run TASKS.md P0 list to zero. Add core tests (auth store, chat, formatters).
         Remove demo credentials path entirely.
Week 6   Submit to TestFlight + Play Internal Testing. Run Sentry + Sonar against
         a real release. Triage. Public submit.
```

If the backend already exists (or is being built in parallel by another team), compress to **2–3 weeks** focused on the soft blockers and Sentry/EAS finalization.

---

## Operational sign-off checklist (run before tagging v1.0.0)

- [ ] `EXPO_PUBLIC_USE_MOCK=false` in production EAS profile (already set in `eas.json`).
- [ ] `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SOCKET_URL` point to the production backend.
- [ ] `EXPO_PUBLIC_SENTRY_DSN` set; verified an error reaches Sentry.
- [ ] `eas init` run; real `extra.eas.projectId` in `app.json`.
- [ ] `eas submit` profiles in `eas.json` populated with Apple Team ID, ASC App ID, Play service account.
- [ ] App Store Connect listing populated (icons, screenshots, copy, age rating).
- [ ] Google Play Console listing populated.
- [ ] Privacy policy + ToS URLs live (the screens reference them but don't link anywhere).
- [ ] Demo credentials removed from `LoginScreen` defaultValues — already gated on mock mode but verify in a real build.
- [ ] At least one test per critical flow (auth, send-message, advance-order-status) passing in CI.
- [ ] CodeQL + Dependabot scans clean (or risks accepted in writing).
- [ ] SonarCloud quality gate green.
- [ ] Backend rate-limited, behind WAF/CDN.
- [ ] Backend has structured logging + alerting.

---

## What this onboarding pass already did

See the "Audit fixes already applied" section at the bottom of `TASKS.md`.
