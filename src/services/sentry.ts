/**
 * Sentry initialisation — call once from App.tsx at the very top.
 *
 * To enable in production builds:
 *   1. `npx expo install @sentry/react-native` (already in deps if Phase 6 ran)
 *   2. Add `EXPO_PUBLIC_SENTRY_DSN` to .env (or eas.json env per profile).
 *   3. Add the Sentry config plugin to app.json:
 *        "plugins": [..., ["@sentry/react-native/expo", {
 *          "organization": "YOUR_ORG", "project": "ekopicker-vendor"
 *        }]]
 *   4. Add SENTRY_AUTH_TOKEN as a GitHub Actions secret for source-map upload.
 *
 * If the DSN is missing, init is skipped — safe to call from App.tsx unconditionally.
 */

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

let initialised = false;

export function initSentry() {
  if (initialised || !DSN) return;
  initialised = true;

  try {
    // Dynamic require so the bundle doesn't pull Sentry in if the package
    // isn't installed yet (e.g. before `npm install`).
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/react-native');
    Sentry.init({
      dsn: DSN,
      environment: __DEV__ ? 'development' : 'production',
      tracesSampleRate: __DEV__ ? 1.0 : 0.2,
      attachStacktrace: true,
      enableAutoSessionTracking: true,
    });
  } catch (e) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[sentry] init skipped — package not installed yet', e);
    }
  }
}

export function captureError(err: unknown, extra?: Record<string, unknown>) {
  if (!DSN) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/react-native');
    Sentry.captureException(err, { extra });
  } catch {
    // ignore
  }
}
