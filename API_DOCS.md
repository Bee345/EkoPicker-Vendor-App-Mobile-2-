# API_DOCS.md — Vendor REST + Socket.io Contract

> Authoritative source. The shorter `API_SPECIFICATION.md` is the original sketch; this document expands it with auth requirements, full request/response shapes, error contracts, and pagination plans.

## Base URLs

| Env | Base URL |
|-----|----------|
| Production | `https://api.ekopicker.com/api` |
| Staging | `https://staging-api.ekopicker.com/api` |
| Local dev | `http://localhost:5000/api` |

Mobile reads from `EXPO_PUBLIC_API_URL`. Socket.io endpoint is `EXPO_PUBLIC_SOCKET_URL` (often the same host without `/api`).

## Authentication

All routes except register/login/refresh require:

```
Authorization: Bearer <accessToken>
```

Tokens are JWTs issued at login. Lifetimes (recommended):

- Access token — 15 min
- Refresh token — 30 days, single-use rotation

The mobile app stores both in Expo SecureStore and refreshes on 401 via a single in-flight promise (`src/services/api.ts`). On rotation the *new* refresh token must be returned and the *old* invalidated.

## Error contract

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

Status codes: `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`. The mobile app's `parseApiError` helper reads `errors[].message` first, falls back to `message`, then to a default string.

## Rate limits (recommended)

- `/vendor/auth/login` — 10 / min / IP
- `/vendor/auth/register` — 5 / hour / IP
- `/vendor/products` POST/PATCH — 60 / min / vendor
- All others — 120 / min / vendor

Enforce via `express-rate-limit` or equivalent.

---

# Auth

## POST `/vendor/auth/register`

**Auth:** none. **Status: 201 → vendor created in `pending` state.**

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+2348012345678",
  "password": "securePass123",
  "businessName": "Doe Retail",
  "businessType": "retail",
  "businessSubCategory": "Electronics",
  "address": {
    "country": "Nigeria",
    "state": "Lagos",
    "city": "Lagos",
    "streetAddress": "23 Allen Ave, Ikeja",
    "landmark": "Near GTBank",
    "gpsCoordinates": "6.6018,3.3515",
    "marketId": "market_001",
    "locationType": "independent"
  }
}
```

Validation:
- `email` unique, RFC 5322
- `phone` E.164
- `password` min 8 chars
- `businessType` ∈ `restaurant | retail | pharmacy | orders | others`
- `address.locationType` ∈ `market | independent`

Response 201:
```json
{ "message": "Registration submitted. Awaiting admin approval." }
```

Errors: 409 if email or phone already registered.

## POST `/vendor/auth/login`

**Auth:** none.

Request:
```json
{ "email": "john@example.com", "password": "securePass123" }
```

Response 200:
```json
{
  "vendor": {
    "_id": "vendor_001",
    "name": "Oluwaseun Adeyemi",
    "email": "vendor@ekopicker.com",
    "phone": "+2348012345678",
    "businessName": "Etimobile Express",
    "businessType": "retail",
    "businessSubCategory": "Electronics",
    "avatar": "https://cdn.../avatar.png",
    "status": "approved",
    "createdAt": "2026-04-01T08:00:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

Errors: 401 invalid credentials. Don't distinguish "user not found" vs "wrong password" in the message — leak protection.

If `vendor.status` is `pending`, return the vendor object with tokens **omitted** so the app can route to the PendingApproval screen.

## POST `/vendor/auth/refresh`

**Auth:** none (uses refresh token in body).

Request:
```json
{ "refreshToken": "eyJhbGciOi..." }
```

Response 200 (rotated):
```json
{
  "tokens": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

The previous refresh token must be revoked. If the same token is presented twice, return 401 — the mobile single-flight queue already guards against parallel calls, but a stolen token replay is an attack signal.

## POST `/vendor/auth/logout`

**Auth:** required.

Invalidates the user's current refresh token. Returns 204 No Content.

## GET `/vendor/auth/me`

**Auth:** required. Returns the full `Vendor` object.

## PATCH `/vendor/auth/me`

**Auth:** required.

Updatable fields: `name`, `phone`, `businessName`, `avatar`. Returns the updated vendor.

## PUT `/vendor/auth/change-password`

**Auth:** required.

Request:
```json
{ "current": "old_pass", "newPassword": "new_pass" }
```

Response 204. Errors: 401 if `current` mismatches; 400 if `newPassword` < 8 chars.

> **Should also invalidate all refresh tokens** for this vendor (force re-login on other devices).

---

# Products *(all require auth)*

## GET `/vendor/products`

Query: `?status=active|out_of_stock|inactive`, `?category=`, `?search=`, `?page=1&limit=20`.

Response 200:
```json
{
  "items": [ /* Product[] */ ],
  "page": 1,
  "limit": 20,
  "total": 124
}
```

> Mobile currently expects an array (legacy). Wrap with `{ items, page, limit, total }` once mobile P1-03 lands.

## GET `/vendor/products/:id`

Returns a single `Product` or 404.

## POST `/vendor/products`

Request — see `Product` shape in `src/types/product.types.ts`. Required: `name`, `description`, `price`, `category`, `images[]`. Optional: `status` (default `active`), `brand`, `sku`, `quantityInStock`, `discount`, plus business-type-specific fields.

| Business type | Extra fields |
|---------------|--------------|
| restaurant | `spiceLevel`, `variants[]`, `preparationTime` |
| retail | `brand`, `sku`, `quantityInStock`, `discount` |
| pharmacy | `genericName`, `dosage`, `manufacturer`, `expiryDate`, `batchNumber`, `prescriptionRequired` |
| orders (wholesale) | `unit`, `minimumOrderQuantity`, `bulkPricing[]` |

`images[]` must be **HTTPS URLs**, not local file URIs. The mobile app currently sends local URIs — this is a known gap (TASKS P2-06): the backend should expose a separate `POST /vendor/products/upload-image` endpoint returning an HTTPS URL, or accept multipart on POST.

Response 201: created product.

## PATCH `/vendor/products/:id`

Partial update with the same fields. Vendor scoping required (404 if not theirs).

## DELETE `/vendor/products/:id`

Soft-delete recommended (mark inactive). Returns 204.

## PATCH `/vendor/products/:id/toggle-status`

Atomic toggle between `active` and `out_of_stock`. Returns the updated product.

---

# Orders *(all require auth)*

## GET `/vendor/orders`

Query: `?status=pending|confirmed|preparing|ready_for_pickup|picked_up|delivered|cancelled`, `?page=`, `?limit=`.

Returns paginated `Order[]`.

## GET `/vendor/orders/:id`

Returns the full `Order` (see `src/types/order.types.ts`).

## PATCH `/vendor/orders/:id/status`

```json
{ "status": "confirmed" }
```

Valid transitions:

```
pending → confirmed → preparing → ready_for_pickup → picked_up → delivered
                                                             ↘
                                                              cancelled
                                                              (allowed from any non-terminal state)
```

Server should reject invalid transitions with 422. After commit, server emits `order_status_updated` to the customer's socket room.

## GET `/vendor/orders/dashboard-stats`

```json
{
  "todayOrders": 3,
  "pendingOrders": 1,
  "completedOrders": 2,
  "todayRevenue": 63000,
  "totalRevenue": 4825000,
  "growthVsLastWeek": 0.125
}
```

> `growthVsLastWeek` is new — needed to replace the hardcoded `+12.5%` on the dashboard (TASKS P0-03).

---

# Chat *(all require auth)*

## GET `/vendor/chats`

Returns chat threads ordered by `updatedAt desc`. Each thread includes `lastMessage` and `unreadCount` for the vendor.

## GET `/vendor/chats/:chatId/messages`

Query: `?cursor=<msgId>&limit=50` for pagination (newest-first).

Returns `Message[]`.

## POST `/vendor/chats/:chatId/messages`

```json
{ "text": "Hi! Your order is being prepared." }
```

Returns the saved `Message`. The mobile app uses this as the source of truth (REST first, socket as best-effort fan-out).

## PATCH `/vendor/chats/:chatId/read`

Marks all messages (sent by the *user* role) as read. Returns 204.

---

# Earnings *(all require auth)*

## GET `/vendor/earnings/summary`

```json
{
  "today": 51500,
  "thisWeek": 312750,
  "thisMonth": 982500,
  "allTime": 4825000,
  "totalOrders": 145,
  "pendingPayouts": 120000,
  "nextPayoutDate": "2026-05-13"
}
```

## GET `/vendor/earnings/transactions`

Query: `?type=order_income|payout|refund|fee`, `?from=YYYY-MM-DD`, `?to=`, `?page=`, `?limit=`.

Returns `Transaction[]`.

## GET `/vendor/earnings/chart/weekly`

```json
[
  { "label": "Mon", "value": 42000 },
  { "label": "Tue", "value": 58000 },
  { "label": "Wed", "value": 35000 },
  { "label": "Thu", "value": 71000 },
  { "label": "Fri", "value": 89500 },
  { "label": "Sat", "value": 63000 },
  { "label": "Sun", "value": 51500 }
]
```

7-element array, Mon-first.

---

# Endpoints expected but not yet specified

| Endpoint | Why | Linked task |
|----------|-----|-------------|
| `POST /vendor/auth/forgot-password` | UI link exists, no flow. Email-link reset (decided 2026-05-08) | P0-02 |
| `POST /vendor/auth/reset-password` | Same | P0-02 |
| `POST /vendor/uploads/image` | Multipart upload returning HTTPS URL | P2-06 |
| `GET /vendor/notifications` | Replace hardcoded mock | P0-05 |
| `PATCH /vendor/notifications/:id/read` | | P0-05 |
| `POST /vendor/push-tokens` | Register Expo push token | P0-05 |
| `PATCH /vendor/store-settings` | Real save for `StoreSettingsScreen` | P0-04 |

---

# Payouts (Paystack) — required for v1.0

The mobile client (`PayoutsScreen`, `usePayouts`/`useRequestPayout`/`useSavePayoutAccount`) is wired against these endpoints. Backend is **not yet built** — this section is authoritative for the implementer.

Paystack docs the backend will use:
- `POST /transferrecipient` to create a Paystack recipient when the vendor saves a bank account.
- `GET /bank/resolve` to verify the account number → account name.
- `POST /transfer` to initiate the actual payout.
- `POST /transfer/finalize_transfer` if OTP is required (for live keys).
- Webhook `transfer.success`, `transfer.failed`, `transfer.reversed` to update status.

## GET `/vendor/payouts/banks`

**Auth:** required.

Returns the static list of banks the backend supports for transfers. Likely fetched once and cached server-side from Paystack's `/bank` endpoint (filter to `country=nigeria&type=nuban`).

```json
[
  { "code": "058", "name": "Guaranty Trust Bank" },
  { "code": "044", "name": "Access Bank" }
]
```

## GET `/vendor/payouts/account`

**Auth:** required.

Returns the vendor's saved payout account, or 404 if none.

```json
{
  "_id": "pa_001",
  "vendorId": "vendor_001",
  "bankCode": "058",
  "bankName": "Guaranty Trust Bank",
  "accountNumber": "0123456789",
  "accountName": "Etimobile Express Nigeria Limited",
  "currency": "NGN",
  "recipientCodePresent": true,
  "createdAt": "2026-04-01T08:00:00.000Z",
  "updatedAt": "2026-04-01T08:00:00.000Z"
}
```

> The Paystack `recipient_code` itself **must not** be returned to the client. Only the boolean indicator that it exists.

## POST `/vendor/payouts/account`

**Auth:** required.

Resolves the account name via Paystack `/bank/resolve`, creates a `transferrecipient`, persists it, and returns the saved account. If a previous account exists, replace and revoke the old recipient.

Request:
```json
{ "bankCode": "058", "accountNumber": "0123456789" }
```

Errors:
- 400 if account number isn't 10 digits.
- 422 if Paystack `bank/resolve` rejects.

## GET `/vendor/payouts`

**Auth:** required. Query: `?page=&limit=&status=`.

Returns vendor's payout history.

```json
[
  {
    "_id": "po_001",
    "vendorId": "vendor_001",
    "amount": 250000,
    "status": "success",
    "reference": "TRF_eko_001",
    "initiatedAt": "...",
    "completedAt": "..."
  }
]
```

`status` ∈ `pending | processing | success | failed | reversed`.

## POST `/vendor/payouts`

**Auth:** required.

Initiates a transfer. Validates against `pendingPayouts` available, decrements it atomically, calls Paystack `POST /transfer`, persists with `status: 'processing'`. Webhook later updates to `success | failed | reversed`.

Request:
```json
{ "amount": 250000 }
```

Errors:
- 400 if amount ≤ 0 or > available balance.
- 412 if no payout account is saved.
- 503 if Paystack returns an error — the transfer must not be persisted as `processing` if Paystack rejected it synchronously.

## POST `/vendor/payouts/webhook/paystack`

**Auth:** Paystack signature header (`x-paystack-signature`) verified against `PAYSTACK_SECRET_KEY`.

Event types handled:
- `transfer.success` → set payout `status='success'`, set `completedAt`, write a `Transaction` row of type `payout`.
- `transfer.failed` → set `status='failed'`, set `failureReason`, **credit the vendor's pending balance back**.
- `transfer.reversed` → similar; investigate before crediting.

Idempotency: dedupe by `event.data.reference` since Paystack may retry.

## Backend implementation notes

- Hold a **ledger** table (`vendor_balance`) with a single source of truth, mutated only by:
  - Order completion → `+order.subtotal × (1 - platform_fee_rate)` to `pending_payout`.
  - Payout request → `-amount` from `pending_payout`, `+amount` to `in_flight_payout`.
  - Webhook success → `-amount` from `in_flight_payout`, `+amount` to `paid_out`.
  - Webhook failure → `-amount` from `in_flight_payout`, `+amount` back to `pending_payout`.
- Use a Postgres advisory lock or row-level lock on `vendor_balance` per vendor during `POST /vendor/payouts`.
- `EarningsSummary.pendingPayouts` is `vendor_balance.pending_payout` directly.

---

# Socket.io

Connection (server-side example, server-emit cookbook below the table):

```js
// Mobile (already implemented)
io(SOCKET_URL, { auth: { token: accessToken }, transports: ['websocket'] })
```

Authenticate on connection: read `socket.handshake.auth.token`, verify JWT, attach `vendorId` to the socket. Disconnect on invalid.

Rooms:
- `vendor_<vendorId>` — joined via `join_vendor_room`. Used to fan out `new_order` and `order_status_updated` to this vendor only.
- `chat_<chatId>` — joined via `join_chat` (vendor) and the analogous user-side room. Used for `new_message` and `typing`.

| Direction | Event | Payload |
|-----------|-------|---------|
| C → S | `join_vendor_room` | `{ vendorId }` |
| C → S | `join_chat` | `{ chatId }` |
| C → S | `leave_chat` | `{ chatId }` |
| C → S | `send_message` | `{ chatId, text, senderType: "vendor" }` |
| C → S | `typing` | `{ chatId, isTyping, senderType: "vendor" }` |
| C → S | `update_order_status` | `{ orderId, status }` |
| S → C | `new_order` | `Order` |
| S → C | `new_message` | `Message` |
| S → C | `typing` | `{ chatId, isTyping, senderType }` |
| S → C | `order_status_updated` | `{ orderId, status }` |

The server should treat `send_message` and `update_order_status` as **best-effort echoes** — REST is the source of truth. If the REST POST already happened, the socket emit is a fan-out trigger; the server should de-dupe by message/order id before persisting.

JWT expiry on a long-lived socket is **not** currently handled by the mobile client (snapshot at connect time). Backend should reject expired sockets with `connect_error` so the client can reconnect with a refreshed token.

---

# Sample CURL for local dev

```sh
# Login
curl -s -X POST http://localhost:5000/api/vendor/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"vendor@ekopicker.com","password":"password123"}' | jq

# List products
TOKEN="..."
curl -s http://localhost:5000/api/vendor/products \
  -H "Authorization: Bearer $TOKEN" | jq

# Advance an order
curl -s -X PATCH http://localhost:5000/api/vendor/orders/ord_001/status \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"confirmed"}' | jq
```
