# SmartQueue — System Architecture

**Kilifi County Referral Hospital | Queue Management System**

---

## System Overview

SmartQueue is a three-tier web application:

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  Browser (React/Vite SPA)                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  Admin   │ │  Staff   │ │ Customer │ │ Display Board │  │
│  │Dashboard │ │ Console  │ │  Portal  │ │   (TV/Kiosk)  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬───────┘  │
└───────┼────────────┼────────────┼───────────────┼───────────┘
        │            │            │               │
        ▼            ▼            ▼               ▼
┌──────────────────────────────────────────────────────────────┐
│                       SERVER LAYER                           │
│  Node.js 20 + Express 5                                      │
│  ┌─────────────────┐    ┌─────────────────────────────────┐  │
│  │   REST API      │    │        Socket.io Server         │  │
│  │  (Port 5000)    │    │      (Same HTTP server)         │  │
│  │                 │    │                                  │  │
│  │ /api/auth       │    │  Rooms:                          │  │
│  │ /api/tickets    │    │  • branch:{branchId}             │  │
│  │ /api/queues     │    │  • ticket:{ticketCode}           │  │
│  │ /api/analytics  │    │                                  │  │
│  │ ...etc          │    │  Events:                         │  │
│  └────────┬────────┘    │  • ticket:called                 │  │
│           │             │  • queue:updated                 │  │
│  ┌────────▼────────┐    │  • display:refresh               │  │
│  │  Prisma ORM     │    └─────────────────────────────────┘  │
│  └────────┬────────┘                                         │
└───────────┼──────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
│  PostgreSQL 16 (Docker)                                      │
│  • users           • branches        • services              │
│  • counters        • queues          • tickets               │
│  • appointments    • notifications                           │
└──────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────┐
│                   NOTIFICATION LAYER                         │
│  ┌─────────────────────┐    ┌──────────────────────────┐    │
│  │  Africa's Talking   │    │   Nodemailer             │    │
│  │  SMS Gateway        │    │   Email (SMTP)           │    │
│  └─────────────────────┘    └──────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Walk-In Queue Flow

```
Customer          Frontend         Backend          Database       Notifications
   │                 │                │                 │                │
   │ Open /join      │                │                 │                │
   │────────────────>│                │                 │                │
   │                 │ GET /branches  │                 │                │
   │                 │───────────────>│                 │                │
   │                 │                │ SELECT branches │                │
   │                 │                │────────────────>│                │
   │                 │<── branches ───│                 │                │
   │ Select Branch   │                │                 │                │
   │ & Service       │                │                 │                │
   │────────────────>│                │                 │                │
   │                 │ POST /tickets/join               │                │
   │                 │───────────────>│                 │                │
   │                 │                │ Find/Create Queue               │
   │                 │                │────────────────>│                │
   │                 │                │ Create Ticket   │                │
   │                 │                │────────────────>│                │
   │                 │                │ Emit queue:updated               │
   │                 │                │──────────────────────────────────│
   │                 │                │                 │ Send SMS/Email │
   │                 │                │─────────────────────────────────>│
   │<── Ticket Card──│                │                 │                │
```

### Staff Call-Next Flow

```
Staff             Frontend         Backend          Database       Socket.io
  │                  │                │                 │               │
  │ Click "Call Next"│                │                 │               │
  │─────────────────>│                │                 │               │
  │                  │POST /tickets/:id/call            │               │
  │                  │───────────────>│                 │               │
  │                  │                │ Find next ticket│               │
  │                  │                │────────────────>│               │
  │                  │                │ UPDATE status=CALLED            │
  │                  │                │────────────────>│               │
  │                  │                │                 │               │
  │                  │                │ Emit ticket:called to branch    │
  │                  │                │────────────────────────────────>│
  │                  │                │ Emit queue:updated               │
  │                  │                │────────────────────────────────>│
  │                  │                │ Send SMS to customer             │
  │<─ Updated UI ────│                │                 │               │
  │                  │                │                 │               │
  │  (All connected  │                │                 │               │
  │   clients in     │                │                 │               │
  │   branch receive │                │                 │               │
  │   the event)     │                │                 │               │
```

---

## Module Architecture

```
backend/src/
├── config/
│   ├── env.js          ← Load & validate all ENV vars at startup
│   ├── database.js     ← Prisma client singleton
│   └── socket.js       ← Socket.io init, io getter, room management
│
├── middleware/
│   ├── auth.js         ← JWT verify, role guard factory
│   ├── errorHandler.js ← Global error handler (Zod, Prisma, custom)
│   ├── rateLimiter.js  ← express-rate-limit configs per route type
│   └── validate.js     ← Zod schema validation middleware factory
│
├── modules/            ← Feature modules (controller → service → DB)
│   ├── auth/           ← register, login, refresh, logout, me
│   ├── users/          ← CRUD, role management
│   ├── branches/       ← CRUD
│   ├── services/       ← CRUD per branch
│   ├── counters/       ← CRUD, status, staff assignment
│   ├── queues/         ← Daily queue lifecycle
│   ├── tickets/        ← Core queue logic: join, call, skip, complete
│   ├── appointments/   ← Book, confirm, cancel, slots
│   ├── analytics/      ← Aggregations & reporting
│   └── notifications/  ← SMS + email log viewer
│
├── utils/
│   ├── asyncHandler.js      ← Wraps async route handlers for error catching
│   ├── apiResponse.js       ← success() and error() response helpers
│   ├── generateTicketNumber.js ← OPD001, LAB042 format generation
│   └── jwt.js               ← sign, verify, decode helpers
│
├── events/
│   └── socketEvents.js ← All socket event emission helpers
│
├── app.js              ← Express app setup (middleware, routes)
└── server.js           ← HTTP server + Socket.io bootstrap
```

---

## Security Architecture

| Layer | Mechanism |
|---|---|
| Transport | HTTPS (production) |
| Auth | JWT (RS256 or HS256), short-lived access tokens |
| Password | bcrypt, cost factor 12 |
| Rate Limiting | 100 req/15min general, 10 req/15min auth endpoints |
| Helmet | Security headers (CSP, HSTS, XSS Protection) |
| CORS | Allowlist: frontend origin only |
| Input Validation | Zod schemas on all POST/PUT bodies |
| SQL Injection | Prisma parameterized queries (no raw SQL in app logic) |

---

## Environment Configuration

```
# Backend /.env
DATABASE_URL=postgresql://smartqueue_user:SmartQueue@2024!@localhost:5432/smartqueue_db
JWT_ACCESS_SECRET=<32+ char random string>
JWT_REFRESH_SECRET=<32+ char random string>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@kcrh.go.ke
SMTP_PASS=<app-specific-password>
EMAIL_FROM="Kilifi County Referral Hospital <noreply@kcrh.go.ke>"

# SMS (Africa's Talking)
AT_API_KEY=<your-api-key>
AT_USERNAME=sandbox   # or your production username
AT_SENDER_ID=KCRH    # Alphanumeric sender ID

# Notifications
NOTIFICATION_ENABLED=true
```

---

## Deployment Topology (Production)

```
Internet
    │
    ▼
[Nginx Reverse Proxy]
    │
    ├── /          → React SPA (static files)
    ├── /api/*     → Node.js Backend (port 5000)
    └── /socket.io → Socket.io (same backend)
         │
         ▼
    [Node.js Process]
    [PM2 cluster mode]
         │
         ▼
    [PostgreSQL 16]
    [Managed or self-hosted]
```

---

## Key Business Rules

1. **One queue per branch per day** — auto-created on first ticket join
2. **Ticket number format** — `{SVC_PREFIX}{3-digit-sequence}` daily, e.g. `OPD001`, `LAB042`
3. **Counter serves services** — a counter can handle multiple service types
4. **Staff-Counter 1:1** — one staff member per counter at a time
5. **FIFO by default** — appointments have priority over walk-ins at same position
6. **Ticket transfer** — creates new WAITING ticket at target counter; original becomes TRANSFERRED
7. **Daily reset** — positions and sequences reset at midnight (new queue record)
8. **Notifications** — SMS is sent on: join, called, appointment confirm/reminder
