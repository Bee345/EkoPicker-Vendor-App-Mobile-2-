/**
 * Sentry initialisation — call once from App.tsx at the very top.
 *
 * To enable in production builds:
 *   1. `npx expo install @sentry/react-native`
 *   2. Add `EXPO_PUBLIC_SENTRY_DSN` to .env (or each EAS profile env).
 *   3. Add the Sentry config plugin to app.json:
 *        ["@sentry/react-native/expo", { "organization": "...", "project": "ekopicker-vendor" }]
 *   4. Add SENTRY_AUTH_TOKEN as a GitHub Actions secret for source-map upload.
 *
 * Scale-grade defaults below: PII filter, traces sample rate per environment,
 * release health, and replay throttled.
 */

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const ENV =
  process.env.EXPO_PUBLIC_ENV ?? (typeof __DEV__ !== 'undefined' && __DEV__ ? 'development' : 'production');
const RELEASE = process.env.EXPO_PUBLIC_APP_VERSION ?? '1.0.0';

let initialised = false;

/** PII keys we strip from breadcrumb data and request payloads before sending. */
const PII_KEYS = [
  'password',
  'newPassword',
  'currentPassword',
  'accessToken',
  'refreshToken',
  'token',
  'authorization',
  'accountNumber',
  'phone',
  'email',
];

function redact<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redact) as unknown as T;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (PII_KEYS.some((key) => k.toLowerCase().includes(key.toLowerCase()))) {
      out[k] = '[REDACTED]';
    } else if (v && typeof v === 'object') {
      out[k] = redact(v);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

export function initSentry() {
  if (initialised || !DSN) return;
  initialised = true;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/react-native');
    Sentry.init({
      dsn: DSN,
      environment: ENV,
      release: `com.ekopicker.vendor@${RELEASE}`,

      // Performance — sample 100% in dev, 20% in staging, 5% in production.
      tracesSampleRate: ENV === 'production' ? 0.05 : ENV === 'staging' ? 0.2 : 1.0,
      // Session-replay (privacy-aware: text masked by default at SDK level).
      replaysSessionSampleRate: ENV === 'production' ? 0.1 : 0,
      replaysOnErrorSampleRate: 1.0,

      attachStacktrace: true,
      enableAutoSessionTracking: true,
      autoSessionTracking: true,
      sendDefaultPii: false,

      beforeSend(event: Record<string, unknown>) {
        // Strip PII from request data, breadcrumbs, and extras.
        return redact(event);
      },
      beforeBreadcrumb(breadcrumb: Record<string, unknown>) {
        if (!breadcrumb) return breadcrumb;
        if (breadcrumb.category === 'console' && breadcrumb.level === 'log') return null; // drop noisy logs
        return redact(breadcrumb);
      },

      integrations: (defaultIntegrations: unknown[]) => defaultIntegrations,
    });
  } catch (e) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
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
    Sentry.captureException(err, { extra: redact(extra) });
  } catch {
    // ignore
  }
}

export function setUserContext(vendorId: string | null) {
  if (!DSN) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/react-native');
    Sentry.setUser(vendorId ? { id: vendorId } : null);
  } catch {
    // ignore
  }
}
