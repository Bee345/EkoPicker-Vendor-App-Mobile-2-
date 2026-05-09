# SCALE.md — Production-Scale Playbook

What "built for scale" means for EkoPicker Vendor — concrete targets, the levers we already pulled in this codebase, and the levers the **backend team** must pull. Pair this with `PROCESS_PLAN.md` (when) and `API_DOCS.md` (what).

---

## Target capacity (year-1 plan)

These shape every decision below. If they shift by 10x, revisit this document.

| Dimension | Year-1 target |
|-----------|---------------|
| Active vendors | 10 000 |
| Concurrent vendors during NG business hours | ~3 000 |
| Orders / day (system-wide) | 200 000 |
| Messages / day | 1 000 000 |
| Images / day uploaded | 30 000 |
| p95 mobile-API latency | < 400 ms (Lagos → backend) |
| Crash-free rate (mobile) | ≥ 99.5% |
| Real-time message delivery (P95) | < 2 s end-to-end |

If you ever see "Year-2 target", it's in the appendix.

---

## What the mobile client now does for scale (shipped)

### 1. Polling pauses when the app is backgrounded

`src/services/queryClient.ts` wires `AppState` → `focusManager.setFocused(...)`. Every query with `refetchInterval` (orders 30s, dashboard-stats 60s, payouts 30s) **automatically stops** when the user switches apps and resumes on return. At 10K vendors that saves ~333 RPS to the orders endpoint alone.

### 2. Online-aware refetches via NetInfo

`@react-native-community/netinfo` → `onlineManager.setOnline(...)`. No more "request fired into the void" when the user lost cellular. Cuts 4xx/5xx noise in Sentry and saves battery.

### 3. Persistent query cache (24h)

`src/services/queryPersister.ts` + `PersistQueryClientProvider` in `App.tsx`. Cold starts feel instant: products / orders / earnings render from AsyncStorage, then refresh in background. Auth, chats, payouts, messages are **explicitly excluded** (they move fast and have privacy concerns).

### 4. Exponential backoff with jitter

Network errors retry up to 3 times with `1s × 2^n + 30% jitter`, capped at 30 s. 4xx (except 408 / 429) **don't retry** — deterministic errors don't get better with patience. Mutations default to 0 retries (no double-write); chat-send overrides this.

### 5. Socket auth survives token rotation

`src/services/socket.ts` re-reads the access token on every reconnect attempt. `api.ts` calls `refreshSocketAuth()` after a successful refresh, dropping & reconnecting the socket so the new JWT is used. Without this, sockets die silently 15 min after each refresh.

### 6. Sentry hardening

`src/services/sentry.ts` ships with:
- Per-environment `tracesSampleRate` (1.0 dev / 0.2 staging / 0.05 prod) — keeps Sentry bills sane.
- `replaysSessionSampleRate: 0.1` in prod, `replaysOnErrorSampleRate: 1.0` — full replay only on crashes.
- `beforeSend` redacts `password`, `token`, `accountNumber`, `phone`, `email`, etc. before any event leaves the device. NDPR-friendly by construction.
- `setUser({ id: vendorId })` on login, cleared on logout — search Sentry by vendor without leaking PII.

### 7. Image upload via signed URLs (P2-06 client-side)

`src/services/uploads.service.ts` implements the two-step `POST /vendor/uploads/sign → PUT to storage` flow. Bytes never stream through our API — backend stays small while CDN handles delivery. Mobile enforces `maxBytes` client-side too, so we don't waste a roundtrip on rejected files.

### 8. CI/CD safety rails

- Production EAS builds gate on a **tag push** (`v*.*.*`), not every merge to `main`. Stops accidental store submissions and burns less EAS quota.
- Bundle-size CI check on every PR — fails if the JS bundle grows by > 10% or > 500 KB.
- Three EAS channels: `development` / `preview` / `staging` / `production`. Beta testers get `staging`; OTA releases promote `staging → production`.

---

## What the **backend team** must do for scale (Phase 2 reference)

Non-negotiables. None of this is optional at year-1 capacity.

### Database (Postgres)

- **Connection pooling** via PgBouncer. App connects to PgBouncer (transaction mode), not Postgres directly. Without this, 3 000 concurrent vendors will exhaust connections at ~200.
- **Indexes** (minimum):
  - `orders (vendor_id, status, created_at DESC)` — covers `GET /vendor/orders?status=pending`
  - `orders (vendor_id, created_at DESC)` — covers list views
  - `messages (chat_id, created_at DESC)` — covers history pagination
  - `chats (vendor_id, updated_at DESC)` — chat-list ordering
  - `transactions (vendor_id, created_at DESC, type)` — earnings views
  - `vendor_balance (vendor_id) PRIMARY KEY` — payout requests use `SELECT ... FOR UPDATE`
- **Partitioning**: `orders` by `created_at` monthly. After year-1 the table will be ~70M rows; partition pruning keeps queries on hot months only.
- **Materialized views** for `dashboard-stats`. Refresh every 30 s via `REFRESH MATERIALIZED VIEW CONCURRENTLY`. Saves the API from `SUM(amount) GROUP BY vendor_id, status` on every dashboard tick.
- **Read replicas** for any analytics / admin-panel reads. Mobile API stays on the primary.
- **Row-level locking** on payouts: `BEGIN; SELECT pending_payout FROM vendor_balance WHERE vendor_id = $1 FOR UPDATE; ... COMMIT;` — prevents double-spend on concurrent payout requests.

### Real-time (Socket.io)

- **Redis adapter** (`@socket.io/redis-adapter`). A single Node process can hold ~10K sockets; we'll need 4–8 processes minimum. Without the adapter they can't fan out to each other's rooms.
- **Sticky sessions** on the load balancer — the websocket transport requires it.
- **Heartbeat tuning**: `pingInterval: 25s, pingTimeout: 20s` (defaults are fine; just don't drop these).
- **Capacity planning**: each Node process should reserve ~1 GB memory for ~10K concurrent sockets. Run on dedicated socket nodes, not co-located with REST API.
- **Event throttling**: a vendor sending 1 typing event per keystroke at 60 wpm = 5 events/s. Aggregate to 1 event/s server-side.

### Image storage

- **S3 / Cloudflare R2 / GCS** with a presigned-PUT URL flow (matches mobile client).
- **CDN** in front (CloudFront / Cloudflare). Origin shielding ON.
- **Lifecycle rules**: thumbnails auto-generated on upload (Lambda@Edge / Cloudflare Workers); originals tier to cold storage after 90 days.
- **Bucket policy**: deny `s3:PutObject` without a signed URL. Public reads only via CDN domain, never direct bucket URL.

### API server

- **Stateless** Express processes behind an L7 load balancer (ALB / Cloud Run / GCLB).
- **Horizontal autoscaling** target: CPU 60% / p95 latency 400 ms. Min 2, max 20 instances.
- **Rate limiting** via `express-rate-limit` + Redis store:
  - `/vendor/auth/login` — 10 / min / IP
  - `/vendor/auth/register` — 5 / hour / IP
  - All others — 120 / min / vendor
- **Request timeout** of 15s (matches mobile axios timeout). Anything longer kicks off background workers.
- **Background jobs** (BullMQ + Redis) for:
  - Push notification fan-out (Expo push API takes batches of 100; don't block the request thread)
  - Paystack webhook reconciliation
  - Email sending (forgot-password, payout receipts)
  - Materialized view refreshes
- **Graceful shutdown**: `SIGTERM` → stop accepting new requests, drain inflight, exit. Otherwise EAS rolling deploys drop in-flight requests.

### Observability

- **Structured JSON logging** (Pino) with `requestId`, `vendorId`, `route`. Every log line correlates back through the stack.
- **APM** (Datadog / New Relic / Sentry Performance). Minimum: trace every API request, every Postgres query, every Paystack call.
- **SLO definitions** (write these down):
  - Mobile API availability: 99.9% / 30d
  - Mobile API p95 latency: ≤ 400 ms / 30d
  - Real-time message delivery p95: ≤ 2 s / 30d
- **Dashboards**: per-route latency, per-vendor request rate, socket connection count, queue depth, error budget burn rate.
- **Alerting**: PagerDuty with two tiers — error-budget burn (slow page) vs availability < 99% in 5-min window (fast page).

### Security

- **TLS 1.2+ only** at the edge.
- **WAF** (Cloudflare / AWS WAF) with managed rules + custom rate limits.
- **Secrets in a vault** (AWS Secrets Manager / GCP Secret Manager / Doppler). Never in env files committed anywhere.
- **JWT rotation** — single-use refresh tokens (already documented in `API_DOCS.md`).
- **Webhook signature verification** for Paystack. Reject anything without a valid `x-paystack-signature`.
- **Audit log** table (separate Postgres schema) for all writes against `vendors`, `orders`, `payouts`. Append-only.
- **Mobile-side certificate pinning** is in `TASKS.md` P1-11 and is not yet shipped; backend should publish its certificate hash so we can pin it once we add a custom dev client.

---

## Load testing (Phase 2 exit criterion)

Before Phase 5 beta, run k6 / Artillery against staging at **2× year-1 capacity** to see the breaking point with headroom.

```js
// k6 scenario
export const options = {
  scenarios: {
    vendor_polling: {
      executor: 'constant-vus',
      vus: 6000,           // 2× concurrent vendors target
      duration: '15m',
      exec: 'pollOrders',
    },
    order_placement: {
      executor: 'constant-arrival-rate',
      rate: 5,             // orders/sec → 432K/day, 2× target
      timeUnit: '1s',
      duration: '15m',
      preAllocatedVUs: 200,
      exec: 'placeOrder',
    },
    chat_burst: {
      executor: 'ramping-arrival-rate',
      startRate: 5,
      stages: [{ duration: '5m', target: 50 }, { duration: '5m', target: 100 }],
      timeUnit: '1s',
      preAllocatedVUs: 500,
      exec: 'sendMessage',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<400'],
    http_req_failed: ['rate<0.01'],
  },
};
```

Pass conditions: p95 ≤ 400 ms across all scenarios for 15 min sustained, error rate < 1%, no Postgres connection pool saturation.

---

## Cost ceilings (year-1 plan, monthly)

Rough — the backend team should validate against actual provider pricing.

| Line item | Estimate |
|-----------|----------|
| Cloud (4–8 API + 2–4 socket + 1 worker) | $400–800 |
| Managed Postgres (db.m6g.large, 200 GB SSD) | $250 |
| Redis (cache + queue + socket adapter) | $100 |
| Object storage + CDN egress (30K images/day, 100 GB egress/month) | $150 |
| Sentry team plan | $80 |
| SonarCloud private | $20 |
| Expo EAS (Production plan, ~50 builds/month) | $99 |
| Twilio / Resend (~100K emails, no SMS) | $30 |
| Cloudflare WAF / DDoS | $20 |
| **Total** | **~$1 200 / month** |

This excludes Paystack fees (per-transaction, passed to vendor or absorbed) and mobile push (free at this volume via Expo).

---

## Year-2 things we are deliberately *not* designing for now

- Multi-region (Lagos → Accra → Nairobi). Adds replication + DNS routing. Revisit at 50K vendors.
- Offline-first product editing. Hard on a small team; current online-required UX is acceptable.
- Vendor desktop / web app. Mobile-only is enough.
- Multi-currency. NGN-only at v1.0; add when expanding.
- ML — fraud detection, demand forecasting. After we have the data.

If a year-1 decision blocks any of these *forever*, flag it. Otherwise we ship.
