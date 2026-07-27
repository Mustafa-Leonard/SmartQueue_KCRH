# SmartQueue REST API Reference
**Kilifi County Referral Hospital — Queue Management System**
Version 1.0.0 | Base URL: `http://localhost:5000/api`

---

## Authentication

All protected endpoints require an `Authorization` header:
```
Authorization: Bearer <accessToken>
```

Access tokens expire in **15 minutes**. Use the refresh endpoint to obtain a new one.

---

## Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": ["Validation error 1", "Validation error 2"]
}
```

## Success Response Format

```json
{
  "success": true,
  "message": "Action completed",
  "data": { }
}
```

---

## Auth Endpoints

### POST `/auth/register`
Register a new customer account.

**Body:**
```json
{
  "name": "John Kamau",
  "email": "john@example.com",
  "phone": "+254712345678",
  "password": "SecurePass@123",
  "confirmPassword": "SecurePass@123"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "id": "...", "name": "John Kamau", "email": "...", "role": "CUSTOMER" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### POST `/auth/login`

**Body:**
```json
{ "email": "john@example.com", "password": "SecurePass@123" }
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "...", "role": "CUSTOMER" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### POST `/auth/refresh`

**Body:** `{ "refreshToken": "eyJ..." }`

**Response 200:** `{ "accessToken": "eyJ..." }`

---

### POST `/auth/logout`
Requires auth. Invalidates refresh token.

---

### GET `/auth/me`
Requires auth. Returns current user.

---

## Users Endpoints *(ADMIN only)*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | List all users (paginated) |
| GET | `/users/:id` | Get user by ID |
| PUT | `/users/:id` | Update user details |
| DELETE | `/users/:id` | Deactivate user |
| PUT | `/users/:id/role` | Change user role |

**Query params for GET `/users`:** `?page=1&limit=20&role=STAFF&search=john`

---

## Branches Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/branches` | Public | List all active branches |
| POST | `/branches` | ADMIN | Create branch |
| PUT | `/branches/:id` | ADMIN | Update branch |
| DELETE | `/branches/:id` | ADMIN | Delete branch |

**POST/PUT Body:**
```json
{
  "name": "Outpatient Department",
  "description": "General outpatient services",
  "location": "Block A, Ground Floor",
  "isActive": true
}
```

---

## Services Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/services` | Public | List all services |
| GET | `/services/branch/:branchId` | Public | Services for a branch |
| POST | `/services` | ADMIN | Create service |
| PUT | `/services/:id` | ADMIN | Update service |
| DELETE | `/services/:id` | ADMIN | Delete service |

**POST/PUT Body:**
```json
{
  "name": "General Consultation",
  "description": "Initial assessment by a general practitioner",
  "estimatedTime": 15,
  "branchId": "branch_id_here",
  "isActive": true
}
```

---

## Counters Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/counters` | STAFF,ADMIN | List all counters |
| GET | `/counters/branch/:branchId` | Public | Counters for a branch |
| POST | `/counters` | ADMIN | Create counter |
| PUT | `/counters/:id` | ADMIN | Update counter |
| DELETE | `/counters/:id` | ADMIN | Delete counter |
| PUT | `/counters/:id/status` | STAFF | Change counter status |
| PUT | `/counters/:id/assign-staff` | ADMIN | Assign staff to counter |

**Status change body:** `{ "status": "OPEN" }` — values: `OPEN`, `CLOSED`, `PAUSED`

**Assign staff body:** `{ "staffId": "user_id" }`

---

## Queues Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/queues/today/:branchId` | Public | Get today's queue for a branch |
| POST | `/queues/open` | ADMIN | Open a queue for today |
| PUT | `/queues/:id/close` | ADMIN | Close a queue |

**POST body:** `{ "branchId": "branch_id" }`

---

## Tickets Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/tickets/join` | CUSTOMER | Join walk-in queue |
| GET | `/tickets/track/:ticketCode` | Public | Track ticket by code |
| GET | `/tickets/branch/:branchId` | STAFF,ADMIN | Get branch ticket list |
| POST | `/tickets/:id/call` | STAFF | Call this ticket to counter |
| POST | `/tickets/:id/skip` | STAFF | Skip this ticket |
| POST | `/tickets/:id/complete` | STAFF | Mark as completed |
| POST | `/tickets/:id/transfer` | STAFF | Transfer to another counter |
| POST | `/tickets/:id/no-show` | STAFF | Mark as no-show |

**Join queue body:**
```json
{
  "serviceId": "service_id",
  "branchId": "branch_id"
}
```

**Track ticket response:**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "...",
      "ticketNumber": "OPD001",
      "ticketCode": "...",
      "status": "WAITING",
      "position": 3,
      "waitingBefore": 2,
      "estimatedWaitMinutes": 30,
      "service": { "name": "General Consultation", "estimatedTime": 15 },
      "counter": null,
      "customer": { "name": "John Kamau" }
    }
  }
}
```

**Transfer body:** `{ "targetCounterId": "counter_id" }`

---

## Appointments Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/appointments` | AUTH | Customer: own; Admin: all |
| POST | `/appointments` | CUSTOMER | Book appointment |
| GET | `/appointments/:id` | AUTH | Get appointment |
| PUT | `/appointments/:id/confirm` | ADMIN,STAFF | Confirm appointment |
| PUT | `/appointments/:id/cancel` | AUTH | Cancel appointment |
| GET | `/appointments/available-slots` | Public | Get available time slots |

**Book appointment body:**
```json
{
  "serviceId": "service_id",
  "date": "2024-08-15",
  "timeSlot": "09:30",
  "notes": "Follow-up for previous visit"
}
```

**Available slots query:** `?serviceId=xxx&date=2024-08-15`

---

## Analytics Endpoints *(ADMIN only)*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/analytics/overview` | Dashboard KPIs |
| GET | `/analytics/tickets-today` | Hourly breakdown for today |
| GET | `/analytics/wait-times` | Average wait time trend |
| GET | `/analytics/counter-perf` | Counter performance stats |
| GET | `/analytics/weekly` | Weekly summary (last 7 days) |

**Query params:** `?branchId=xxx&from=2024-08-01&to=2024-08-31`

**Overview response:**
```json
{
  "data": {
    "ticketsToday": 145,
    "waiting": 23,
    "serving": 8,
    "completed": 114,
    "avgWaitMinutes": 18,
    "openCounters": 8,
    "totalCounters": 12
  }
}
```

---

## Notifications Endpoints *(ADMIN only)*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/notifications` | List notification log |

**Query params:** `?status=FAILED&type=SMS&page=1`

---

## WebSocket Events

Connect to: `ws://localhost:5000`

**Authentication:**
```js
const socket = io('http://localhost:5000', {
  auth: { token: 'Bearer eyJ...' }
});
```

**Join a room:**
```js
socket.emit('join:branch', { branchId: 'xxx' });
socket.emit('join:ticket', { ticketCode: 'xxx' });
```

**Listen to events:**

| Event | Payload | Description |
|---|---|---|
| `ticket:called` | `{ ticketNumber, counterName, serviceName, branchId }` | Ticket called to counter |
| `ticket:completed` | `{ ticketId, ticketNumber, branchId }` | Session completed |
| `ticket:skipped` | `{ ticketId, ticketNumber, branchId }` | Ticket skipped |
| `queue:updated` | `{ branchId, waiting, position, ticketCode }` | Queue state changed |
| `display:refresh` | `{ branchId, calledTickets }` | Display board refresh |

---

## Seed Credentials

| Role | Email | Password |
|---|---|---|
| ADMIN | admin@kcrh.go.ke | Admin@2024 |
| STAFF | staff@kcrh.go.ke | Staff@2024 |
| CUSTOMER | patient@gmail.com | Patient@2024 |
