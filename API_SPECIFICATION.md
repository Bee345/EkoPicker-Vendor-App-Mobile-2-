# EkoPicker Vendor App — API Specification

## Base URL
```
Production: https://api.ekopicker.com/api
Development: http://localhost:5000/api
```

## Authentication
All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

---

## Auth Endpoints

### POST `/vendor/auth/register`
Register a new vendor (awaits admin approval).
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+2348012345678",
  "password": "securePass123",
  "businessName": "Doe Retail",
  "businessType": "retail",
  "address": {
    "streetAddress": "23 Allen Ave, Ikeja",
    "country": "Nigeria",
    "state": "Lagos",
    "city": "Lagos",
    "locationType": "independent"
  }
}
```
**Response 201:**
```json
{ "message": "Registration submitted. Awaiting admin approval." }
```

---

### POST `/vendor/auth/login`
```json
{ "email": "john@example.com", "password": "securePass123" }
```
**Response 200:**
```json
{
  "vendor": { "_id": "...", "name": "...", "email": "...", "status": "approved", ... },
  "tokens": { "accessToken": "...", "refreshToken": "..." }
}
```

---

### POST `/vendor/auth/refresh`
```json
{ "refreshToken": "..." }
```
**Response 200:** `{ "tokens": { "accessToken": "...", "refreshToken": "..." } }`

---

### POST `/vendor/auth/logout`
Invalidates the refresh token. Returns `204 No Content`.

---

### GET `/vendor/auth/me` *(Protected)*
Returns the authenticated vendor's full profile.

### PATCH `/vendor/auth/me` *(Protected)*
Update profile fields: `name`, `phone`, `businessName`, `avatar`.

### PUT `/vendor/auth/change-password` *(Protected)*
```json
{ "current": "old_pass", "newPassword": "new_pass" }
```

---

## Products Endpoints *(All Protected)*

### GET `/vendor/products`
Returns all products belonging to the authenticated vendor.

### GET `/vendor/products/:id`

### POST `/vendor/products`
```json
{
  "name": "Product Name",
  "description": "...",
  "price": 5000,
  "category": "Electronics",
  "images": ["url1", "url2"],
  "status": "active",
  "brand": "Sony",
  "sku": "SNY-001",
  "quantityInStock": 50,
  "discount": 10
}
```
*Pharmacy extra fields:* `genericName`, `dosage`, `manufacturer`, `expiryDate`, `batchNumber`, `prescriptionRequired`

### PATCH `/vendor/products/:id`
Partial update, same fields as POST.

### DELETE `/vendor/products/:id`
Returns `204 No Content`.

### PATCH `/vendor/products/:id/toggle-status`
Toggles between `active` ↔ `out_of_stock`.

---

## Orders Endpoints *(All Protected)*

### GET `/vendor/orders`
Query params: `?status=pending|confirmed|preparing|ready_for_pickup|delivered|cancelled`

### GET `/vendor/orders/:id`

### PATCH `/vendor/orders/:id/status`
```json
{ "status": "confirmed" }
```
Valid flow: `pending → confirmed → preparing → ready_for_pickup → delivered`
Can also be set to `cancelled` at any point.

### GET `/vendor/orders/dashboard-stats`
**Response:**
```json
{
  "todayOrders": 3,
  "pendingOrders": 1,
  "completedOrders": 2,
  "todayRevenue": 63000,
  "totalRevenue": 4825000
}
```

---

## Chat Endpoints *(All Protected)*

### GET `/vendor/chats`
Returns all chat threads for this vendor, sorted by last message.

### GET `/vendor/chats/:chatId/messages`
Returns paginated messages for a chat thread.

### POST `/vendor/chats/:chatId/messages`
```json
{ "text": "Your message here" }
```

### PATCH `/vendor/chats/:chatId/read`
Marks all messages in a chat as read.

---

## Earnings Endpoints *(All Protected)*

### GET `/vendor/earnings/summary`
**Response:**
```json
{
  "today": 51500,
  "thisWeek": 312750,
  "thisMonth": 982500,
  "allTime": 4825000,
  "totalOrders": 145,
  "pendingPayouts": 120000
}
```

### GET `/vendor/earnings/transactions`
Returns list of `Transaction` objects.

### GET `/vendor/earnings/chart/weekly`
Returns `[{ label: "Mon", value: 42000 }, ...]`

---

## WebSocket Events (Socket.io)

### Connection
```js
io(SOCKET_URL, { auth: { token: "<accessToken>" } })
```

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_vendor_room` | `{ vendorId }` | Subscribe to vendor-specific events |
| `join_chat` | `{ chatId }` | Join a chat room |
| `leave_chat` | `{ chatId }` | Leave a chat room |
| `send_message` | `{ chatId, text, senderType: "vendor" }` | Send a chat message |
| `typing` | `{ chatId, isTyping, senderType }` | Typing indicator |
| `update_order_status` | `{ orderId, status }` | Notify status change to all parties |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `new_order` | `Order` | A new order was placed |
| `new_message` | `Message` | A new chat message arrived |
| `typing` | `{ chatId, isTyping, senderType }` | Remote typing indicator |
| `order_status_updated` | `{ orderId, status }` | Order status changed |

---

## Error Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Invalid email address" }]
}
```

## Status Codes
| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (missing / expired token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (e.g. email already exists) |
| 500 | Internal Server Error |
