# ARCHITECTURE.md — EkoPicker Vendor App

This document describes how the app is structured, why the boundaries are where they are, and where data flows.

---

## High-level diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                            App.tsx (root)                            │
│   initSentry → ErrorBoundary → GestureHandlerRootView → SafeArea     │
│            → QueryClientProvider → RootNavigator                     │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                  ┌───────────────┴────────────────┐
                  ▼                                ▼
        ┌─────────────────┐              ┌──────────────────┐
        │ AuthNavigator   │   approved   │   AppNavigator   │
        │ (Native Stack)  │ ─────────►   │  (Bottom Tabs)   │
        └─────────────────┘              └──────────────────┘
        Splash → Onboarding              Dashboard | Products | Orders
        → AuthChoice → Login             | Chat | More
        → Register Step 1 / 2            (each tab is its own Stack)
        → PendingApproval

                                         Each screen ──► hooks (TanStack Query)
                                                       ──► stores (Zustand)
                                                       ──► UI primitives (components/ui)

                                         hooks ──► services (axios / socket.io)
                                         stores ◄── services events

                                                  ┌─────────┐
                                                  │  Backend  │
                                                  │  REST + WS │
                                                  └─────────┘
```

---

## Layers

### 1. Presentation (`src/screens`, `src/components`)

- **Screens** are leaf containers. They read from hooks/stores and render UI.
- **`components/layout/`** — `SafeScreen`, `ScreenHeader`, `ErrorBoundary`. Cross-cutting layout primitives. Every screen renders inside a `SafeScreen` (handles safe-area insets) and almost every non-tab-root renders a `ScreenHeader`.
- **`components/ui/`** — `Button`, `Input`, `Badge`, `Avatar`, `Skeleton`/`SkeletonCard`, `EmptyState`. Stateless visual atoms. Style is via inline `StyleSheet.create` keyed to `COLORS` constants.

### 2. Hooks (`src/hooks`)

The TanStack Query layer. Each hook wraps a service call and returns a `useQuery`/`useMutation`. **Screens should not call services directly** — always go through a hook so caching, invalidation, and retry policy stay consistent.

| Hook | Domain | Notes |
|------|--------|-------|
| `useProducts`, `useProduct`, `useCreateProduct`, `useUpdateProduct`, `useDeleteProduct`, `useToggleProductStatus` | Products | Mutations invalidate `PRODUCTS_KEY` + `[…, id]`. |
| `useOrders`, `useOrder`, `useUpdateOrderStatus`, `useDashboardStats` | Orders | Background polling: orders every 30 s, dashboard every 60 s. |
| `useChats`, `useChat(chatId)` | Chat | `useChat` also subscribes to socket `new_message` and `typing` events; cleans up on unmount. |
| `useEarningsSummary`, `useTransactions`, `useWeeklyChart` | Earnings | Read-only queries. |

### 3. Services (`src/services`)

Pure I/O. No UI.

- **`api.ts`** — single Axios instance. Request interceptor attaches the access token; response interceptor handles 401 → single-flight refresh → forced logout on refresh failure.
- **`socket.ts`** — single module-scoped Socket.io client. Exposes typed emitters (`joinVendorRoom`, `joinChat`, `sendSocketMessage`, …) and an `onSocketReady(cb)` helper that handles the race where the socket is already connected before a listener registers.
- **`*.service.ts`** — one per domain. Each function checks `EXPO_PUBLIC_USE_MOCK` and either returns mock fixtures or hits the real endpoint.
- **`sentry.ts`** — wraps `@sentry/react-native` in a no-op fallback so the bundle still works if the package isn't installed.

### 4. Stores (`src/store`)

Zustand. **Client-only state**, never server data.

- **`auth.store.ts`** — `vendor`, `isAuthenticated`, `isLoading`, `error`. Owns `login` / `register` / `logout` / `loadFromStorage` / `forceLogout`. Registers itself with `api.ts` so a refresh-token failure bounces the user back to login.
- **`socket.store.ts`** — connection state, `pendingNewOrders` (real-time inbox), `typingUsers`, `totalUnreadMessages`. Subscribers should always use a Zustand selector (e.g. `useSocketStore((s) => s.totalUnreadMessages)`) so unrelated updates don't cause re-renders.
- **`ui.store.ts`** — `isDarkMode` only. Currently a stub: toggled by Settings/More but consumed by no screen yet (TASKS.md `P1-06`).

### 5. Types (`src/types`)

Shared interfaces and DTOs. Co-located by domain (`auth.types.ts`, `product.types.ts`, …). All `OrderStatus` / `ProductStatus` / `BusinessType` unions live here. Constants like `ORDER_STATUS_LABELS` and `ORDER_STATUS_FLOW` live in the same file as the type they describe.

### 6. Utils (`src/utils`)

- `constants.ts` — `COLORS`, `SCREENS`, `TABS`, `BUSINESS_TYPE_*`, `PAGE_SIZE`.
- `formatCurrency.ts` — Naira formatter (`formatCurrency`, `formatCurrencyCompact`).
- `formatDate.ts` — `formatOrderDate`, `formatRelativeTime`, `formatTransactionDate`, `formatTime`.
- `apiError.ts` — `parseApiError(err, fallback)` extracts the server's `{ message, errors[] }` payload. Use this in every `catch (err)` block instead of `err.message`.
- `storageKeys.ts` — `STORAGE_KEYS.{ACCESS_TOKEN, REFRESH_TOKEN, VENDOR_ID}`. Single source of truth for SecureStore.

---

## Data flow examples

### Login

```
LoginScreen.onSubmit
  └─ useAuthStore.login(dto)
       ├─ authService.login(dto)
       │     ├─ if MOCK: in-memory check, return mock vendor + tokens
       │     └─ else:    POST /vendor/auth/login → vendor + tokens
       ├─ authService.saveTokens(accessToken, refreshToken)  (SecureStore)
       ├─ SecureStore.set(VENDOR_ID, vendor._id)
       ├─ connectSocket()  (lazy: only if SOCKET_URL set)
       └─ onSocketReady(() => joinVendorRoom(vendor._id))
  └─ set({ vendor, isAuthenticated: true })
RootNavigator re-renders → AppNavigator
```

### Receiving a real-time order

```
Backend emits 'new_order' to room "vendor_<id>"
  ↓
DashboardScreen useEffect handler
  ├─ socketStore.addPendingOrder(order)         ← banner state
  ├─ refetchOrders()                            ← TanStack Query refetch
  └─ refetchStats()
DashboardScreen re-renders banner + list
```

### Advancing an order status

```
OrderDetailsScreen.handleAdvanceStatus
  ├─ useUpdateOrderStatus.mutateAsync({ id, status: nextStatus })
  │     └─ ordersService.updateStatus(id, nextStatus)  → PATCH /vendor/orders/:id/status
  │  TanStack Query: invalidate ORDERS_KEY + DASHBOARD_STATS_KEY
  │                  optimistic setQueryData([...ORDERS_KEY, id], updatedOrder)
  └─ emitOrderStatusUpdate(id, nextStatus)              ← socket emit
       (server fans out 'order_status_updated' to user app + admin)
```

### Sending a chat message

```
ChatConversationScreen.handleSend
  └─ useChat.sendMessage(text)
       ├─ if socket connected: emit 'send_message' (server-side fan-out)
       └─ chatService.sendMessage({ chatId, text })  ← always REST for ACK + cache update
            └─ qc.setQueryData(MESSAGES_KEY(chatId), prev => [...prev, msg])
            └─ qc.invalidateQueries(CHATS_KEY)        ← updates last-message in chat list
```

### Token refresh under concurrent 401s

```
Request A → 401  ┐
Request B → 401  ├─►  refreshAccessToken()  (single in-flight promise)
Request C → 401  ┘                ↓
                              POST /vendor/auth/refresh
                                  ↓
                         success: rotate tokens, retry A/B/C
                         failure: clear tokens → onAuthExpired()
                                  → useAuthStore.forceLogout()
                                  → RootNavigator re-renders to AuthNavigator
```

---

## Navigation tree

```
RootNavigator
├── (loading)            ActivityIndicator on splash background
├── AuthNavigator (when isAuthenticated=false OR vendor.status !== 'approved')
│   ├── Splash           2.2s timer → replace(Onboarding)
│   ├── Onboarding       4-slide carousel → replace(AuthChoice)
│   ├── AuthChoice       Sign-up / Sign-in entry point
│   ├── Login            email + password
│   ├── RegisterStep1    business type selection
│   ├── RegisterStep2    personal + business details → register → navigate(PendingApproval)
│   └── PendingApproval  awaiting admin approval message
└── AppNavigator (BottomTabs, custom CustomTabBar, unread chat badge)
    ├── Dashboard
    │   ├── DashboardHome
    │   └── Notifications
    ├── Products
    │   ├── ProductList
    │   ├── ProductDetails
    │   ├── AddProduct
    │   └── EditProduct
    ├── Orders
    │   ├── OrderList
    │   └── OrderDetails
    ├── Chat
    │   ├── ChatList
    │   └── ChatConversation
    └── More
        ├── MoreHome
        ├── Earnings
        ├── Profile
        ├── EditProfile
        ├── ChangePassword
        ├── StoreSettings
        └── Settings
```

---

## State boundaries (don't mix)

| What it is | Where it lives | Examples |
|------------|----------------|----------|
| Anything fetched from the backend | TanStack Query | products, orders, chats, messages, earnings |
| Anything user-action-driven & cross-screen | Zustand | auth state, dark-mode toggle, real-time pending orders, typing indicators, total-unread |
| Form input | React Hook Form + Zod | login, register, add/edit product, change password |
| One-screen ephemeral state | `useState` | search input, active tab, image picker index |

If you find yourself stuffing server-derived data into Zustand, stop — make a new query key.

---

## Real-time channels

The mobile client maintains **one** Socket.io connection (websocket transport, `reconnection: true`, 5 attempts). Re-auth on JWT refresh is currently *not* handled — the socket auth.token snapshot is taken at `connectSocket()` time. P1 task to address.

| Direction | Event | When | Handler |
|-----------|-------|------|---------|
| client → server | `join_vendor_room` | on login | `useAuthStore.login` (after `connectSocket`) |
| client → server | `join_chat` / `leave_chat` | on opening/closing a chat | `useChat` mount/unmount |
| client → server | `send_message` | on send | `useChat.sendMessage` |
| client → server | `typing` | on text change | `useChat.notifyTyping` |
| client → server | `update_order_status` | on order advance | `OrderDetailsScreen.handleAdvanceStatus` |
| server → client | `new_order` | new order placed | `DashboardScreen` useEffect |
| server → client | `new_message` | message arrived | `useChat` handler — appends to query cache |
| server → client | `typing` | remote user typing | `useChat` handler — sets typing flag in socket store |
| server → client | `order_status_updated` | status changed elsewhere | _not yet handled_ — TASKS P1 candidate |

---

## Build & release pipeline

```
git push
  ├── PR  → .github/workflows/pr.yml
  │         lint → type-check → jest → Sonar (gated on SONAR_TOKEN)
  │
  └── main → .github/workflows/main.yml
            ├── EAS Build (preview profile by default; production via dispatch)
            ├── EAS Update (OTA to production channel)
            └── Sentry release (gated on SENTRY_AUTH_TOKEN)
                          (uploads source maps, creates release)
```

EAS profiles in `eas.json` distinguish `development` / `preview` / `production`, including environment variables that override `.env` values at build time.

---

## Things deliberately not in this codebase

- **No internal navigation library wrappers.** We use `useNavigation`/`useRoute` from React Navigation directly. The repo currently uses `<any>` for these — replace with typed param lists when picking up TASKS `P1-01`.
- **No global theme provider.** Colours come from `COLORS` constants. Dark-mode work is parked in TASKS `P1-06`.
- **No HTTP-cache (SWR/Apollo).** TanStack Query is the only server-state caching layer.
- **No state machines (XState).** Order/auth flows are simple enough that imperative code in stores is fine.
