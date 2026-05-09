# Server / Dashboard Setup — One-Time Manual Steps

The configs in this repo are wired up, but the *external services* they talk to need to be activated by a human in a browser. This file lists exactly what to click, where, and what secret to paste into the GitHub repo afterwards.

> ⚠️ The mobile app **is not deployed to a server**. It's a React Native binary distributed via the App Store and Google Play. "Deployment" for this project means EAS Build → store submission, plus OTA updates via EAS Update. Google Cloud is not involved in shipping the app itself; it would only host the *backend API* (which doesn't exist yet — see `PRODUCTION_READINESS.md`).

---

## 1. GitHub repository

Required because Husky, Actions, Dependabot, and CodeQL all live there.

1. Create a private repo on GitHub.
2. Locally:
   ```sh
   git remote add origin git@github.com:YOUR_ORG/ekopicker-vendor.git
   git add . && git commit -m "chore: initial onboarding setup" && git push -u origin main
   ```
3. **Settings → Branches → Branch protection rule** for `main`:
   - Require pull request, 1 approval.
   - Require status checks: `Lint, type-check, test`, `CodeQL`, `SonarCloud scan` (after Sonar is added).
   - Require up-to-date branches before merge.
   - Restrict who can push.

---

## 2. SonarCloud (static analysis & code smells)

Sonar runs **on their servers**; we just send it scan results from CI.

1. Go to [https://sonarcloud.io](https://sonarcloud.io) → **Sign in with GitHub** (use the same org).
2. **+ → Analyze new project** → pick `ekopicker-vendor` → **Set Up**.
3. Choose **GitHub Actions** as the analysis method. Sonar will show two values:
   - `SONAR_PROJECT_KEY` (e.g. `your-org_ekopicker-vendor`)
   - `SONAR_ORGANIZATION` (e.g. `your-org`)
4. Edit **`sonar-project.properties`** in this repo — replace the two `YOUR_ORG_*` placeholders with those values, commit.
5. In SonarCloud, copy the generated `SONAR_TOKEN`.
6. In GitHub → **Settings → Secrets and variables → Actions → New repository secret**:
   - Name: `SONAR_TOKEN`
   - Value: (paste)
7. **Settings → Quality Gate** in Sonar — accept the "Sonar way" gate or define your own.
8. Push a PR — `pr.yml` will trigger the Sonar job (gated on the secret existing).

---

## 3. Sentry (crash reporting + performance)

Sentry is also a hosted service.

1. [https://sentry.io](https://sentry.io) → **Create Project** → React Native → name it `ekopicker-vendor`.
2. Sentry shows you a **DSN** (looks like `https://abc123@oXXXX.ingest.sentry.io/YYYY`). Copy it.
3. Add to **`.env`** (not committed) and to each EAS profile in **`eas.json`**:
   ```
   EXPO_PUBLIC_SENTRY_DSN=https://abc123@oXXXX.ingest.sentry.io/YYYY
   ```
4. **Settings → Account → API → Auth Tokens** in Sentry → create a token with `project:releases` scope.
5. Add three GitHub secrets:
   - `SENTRY_AUTH_TOKEN` (the token from step 4)
   - `SENTRY_ORG` (your Sentry org slug)
   - `SENTRY_PROJECT` (`ekopicker-vendor`)
6. Add the Sentry Expo plugin to `app.json` (so source maps upload during EAS Build):
   ```json
   "plugins": [
     "expo-secure-store",
     ["expo-image-picker", { ... }],
     ["@sentry/react-native/expo", {
       "organization": "your-org-slug",
       "project": "ekopicker-vendor"
     }]
   ]
   ```
7. (Optional smoke test) Add a temporary `throw new Error('test')` in a screen, build, run, confirm it reaches Sentry, remove.

---

## 4. EAS / Expo (build + OTA + submit)

EAS is Expo's hosted build/CDN service.

1. Locally: `npm install -g eas-cli` then `eas login` (opens browser to expo.dev).
2. In the repo: `eas init` — this writes the **real** project ID into `app.json` (`extra.eas.projectId`). Commit the change.
3. `eas build:configure` — confirms `eas.json` is valid.
4. **First build (preview/internal):**
   ```sh
   eas build --platform all --profile preview
   ```
   The build runs on EAS infra and gives you an APK + iOS internal-distribution `.ipa` link.
5. **Production build:**
   ```sh
   eas build --platform all --profile production
   ```
6. **OTA updates** for already-installed binaries (no store submission):
   ```sh
   eas update --branch production --message "fix: small ChatList styling"
   ```
7. **GitHub Actions integration** — already wired in `.github/workflows/main.yml`. Add one secret:
   - `EXPO_TOKEN` — generate at expo.dev → **Account Settings → Access Tokens**.

---

## 5. App Store Connect (Apple)

Required for iOS production releases. Free Apple ID won't cut it — you need an Apple Developer Program seat ($99/yr).

1. Enroll at [https://developer.apple.com/programs](https://developer.apple.com/programs).
2. **App Store Connect** → **My Apps → +** → New iOS app:
   - Bundle ID: `com.ekopicker.vendor` (matches `app.json`).
   - SKU: `ekopicker-vendor-ios`.
3. Note the **App Store Connect App ID** (numeric).
4. **Users and Access → Keys → App Store Connect API → +** → create a key with **App Manager** role. Download the `.p8` file (one-time).
5. Update `eas.json` `submit.production.ios`:
   ```json
   "appleId": "your-developer-account@example.com",
   "ascAppId": "1234567890",
   "appleTeamId": "ABCDEFG123"
   ```
6. To submit:
   ```sh
   eas submit --platform ios --profile production
   ```

---

## 6. Google Play Console (Android)

$25 one-time fee.

1. Enroll at [https://play.google.com/console](https://play.google.com/console).
2. **Create app** → package name `com.ekopicker.vendor` (matches `app.json`).
3. **Setup → API access → Service accounts → Create new** → grant **Release manager** role.
4. Download the service account JSON (one-time). Save as `secrets/play-service-account.json` (already gitignored — see `.gitignore` update below).
5. To submit:
   ```sh
   eas submit --platform android --profile production
   ```

---

## 7. Push notifications (Expo + FCM/APNs)

1. **Android:** Firebase project → Add Android app (`com.ekopicker.vendor`) → download `google-services.json` → in EAS, upload via `eas credentials` or `app.json` plugin.
2. **iOS:** Apple Developer → **Keys → +** → enable **Apple Push Notifications service (APNs)** → download `.p8` → `eas credentials → ios → Push Notifications`.
3. In the app, register for tokens (not yet implemented — see TASKS.md `P0-05`).

---

## 8. Backend hosting — *if and when* the backend exists

Per `API_SPECIFICATION.md`, the backend is Node + Express + Postgres + Socket.io. Pick one of:

- **Render / Railway / Fly.io** — fastest to ship a small Express app. Web service + managed Postgres + a worker for socket.io.
- **Google Cloud Run** — containerised Express. Pair with **Cloud SQL** (Postgres) and **Memorystore** (Redis for socket.io adapter). Good if you're already on GCP.
- **AWS ECS / App Runner + RDS** — same idea on AWS.

The mobile app needs only:
- An HTTPS URL → `EXPO_PUBLIC_API_URL`
- A websocket-capable URL → `EXPO_PUBLIC_SOCKET_URL` (often the same host)
- TLS termination (Cloudflare in front of any of these works)

The mobile app **does not** care which cloud you pick — it just needs the URLs.

---

## 9. Add to `.gitignore`

```
secrets/
*.p8
*.p12
*.keystore
google-services.json
GoogleService-Info.plist
```

(The repo already ignores `*.p8 *.p12 *.key *.mobileprovision`. The list above adds the GCP/Apple/Firebase service-account artifacts.)

---

## Quick summary — secrets you'll add to GitHub

| Secret | Source | Used by |
|--------|--------|---------|
| `SONAR_TOKEN` | SonarCloud | `pr.yml` |
| `SENTRY_AUTH_TOKEN` | Sentry → API → Auth Tokens | `main.yml` (release upload) |
| `SENTRY_ORG` | Sentry org slug | `main.yml` |
| `SENTRY_PROJECT` | Sentry project slug | `main.yml` |
| `EXPO_TOKEN` | expo.dev → Access Tokens | `main.yml` (EAS build / update) |
