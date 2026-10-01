# SmartQueue — Kilifi County Referral Hospital

> **A modern, real-time queue management system** for Kilifi County Referral Hospital (KCRH). Replaces manual ticketing with a digital, data-driven queue experience for patients, staff, and administrators.

---

## Features

### For Patients (Customers)
- Online registration and login
- Join a queue digitally, by walk-in or appointment
- Ticket tracking with position and estimated wait time
- Notifications by SMS (Africa's Talking) and email (Nodemailer)
- Appointment requests with time slot selection
- Ticket history and upcoming appointments

### For Staff (Nurses/Clerks)
- Staff console for calling, serving, skipping, and marking no-shows
- Counter status controls
- Ticket transfers between counters
- Live queue updates via WebSockets

### For Administrators
- Department and service management
- Counter and staff assignment management
- User management for ADMIN, STAFF, and CUSTOMER roles
- Appointment review and confirmation
- Analytics for wait times, throughput, no-shows, and peak periods
- Queue and service visualizations

### Display Board (TV/Kiosk)
- Public display screen for waiting areas
- Now Serving and Next Up ticket lists
- Live clock and announcements
- Socket.io updates with periodic refresh

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend API** | Node.js 20 + Express 5 |
| **Real-time** | Socket.io 4 |
| **ORM** | Prisma 5 |
| **Database** | SQLite (local development) |
| **SMS** | Africa's Talking SDK |
| **Email** | Nodemailer (Gmail SMTP) |
| **Frontend** | React 18 + Vite 5 |
| **Styling** | Vanilla CSS with custom design system |
| **Auth** | JWT (access 15m + refresh 7d) + bcrypt |
| **Validation** | Zod (backend) + React Hook Form (frontend) |
| **Charts** | Recharts |

---

## Project Structure

```
SmartQueue/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Full data model
│   │   └── seed.js            # Initial data seeder
│   ├── src/
│   │   ├── config/            # env, database, socket setup
│   │   ├── middleware/        # auth, errorHandler, rateLimiter, validate
│   │   ├── modules/           # Feature modules (each has controller/service/routes)
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── branches/
│   │   │   ├── services/
│   │   │   ├── counters/
│   │   │   ├── queues/
│   │   │   ├── tickets/
│   │   │   ├── appointments/
│   │   │   ├── analytics/
│   │   │   └── notifications/
│   │   ├── events/            # Socket.io event handlers
│   │   ├── utils/             # Helpers (asyncHandler, jwt, apiResponse, etc.)
│   │   ├── app.js             # Express app setup
│   │   └── server.js          # HTTP + Socket.io server
│   ├── .env.example
│   ├── package.json
│   └── nodemon.json
│
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios instance + all API modules
│   │   ├── components/
│   │   │   ├── common/        # Button, Card, Input, Modal, Sidebar, etc.
│   │   │   ├── dashboard/     # StatsCard, QueueChart, ActiveTicketsTable
│   │   │   └── queue/         # TicketCard, QueueDisplay, CounterPanel
│   │   ├── context/           # AuthContext, SocketContext
│   │   ├── hooks/             # useAuth, useSocket, useQueue
│   │   ├── pages/
│   │   │   ├── admin/         # Dashboard, Users, Branches, Services, Counters, Analytics, Appointments
│   │   │   ├── auth/          # Login, Register
│   │   │   ├── customer/      # Dashboard, JoinQueue, TrackTicket, Appointments, Profile
│   │   │   ├── display/       # DisplayBoard (public TV screen)
│   │   │   └── staff/         # StaffDashboard, StaffCounter
│   │   ├── styles/            # index.css, components.css, pages.css, animations.css
│   │   ├── utils/             # constants.js, formatters.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── database/
│   └── init.sql               # Raw SQL bootstrap (Prisma migrations preferred)
│
├── docs/
│   ├── API.md                 # Full REST API reference
│   └── ARCHITECTURE.md        # System architecture diagram
│
├── docker-compose.yml         # Optional PostgreSQL tooling (not used by default)
├── .gitignore
├── .prettierrc
└── .eslintrc.json
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm 9+

### 1. Clone the repository

```bash
git clone <repo-url>
cd SmartQueue
```

### 2. Configure backend environment

```bash
cp backend/.env.example backend/.env
```
SQLite is stored in `backend/prisma/dev.db`; no database server is required for local development. Configure notification integrations in `backend/.env` for local testing.

### 3. Set up the database

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
```
This creates all tables and seeds: 1 admin account, 5 hospital departments, 10 services, 8 counters.

The seed data and its demo accounts are for local development only. The seed script refuses to run when `NODE_ENV=production`.

## Production Deployment Gate

This repository is not yet certified for production handling of patient information. Before deployment:

- Migrate from the current SQLite-only Prisma schema to a production database with access controls, encryption at rest, tested backups, and a recovery procedure.
- Serve the frontend and API over HTTPS, use unique secrets from a secret manager, and set `FRONTEND_URL` to the exact HTTPS frontend origin.
- Configure a production SMTP account and notification provider. Production startup requires enabled email notifications for password recovery.
- Create the first administrator with `backend/scripts/ensureAdmin.js` using `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_PHONE`, and a unique `INITIAL_ADMIN_PASSWORD` supplied through the deployment environment.
- Review privacy notices, data retention, access logging, incident response, and local health-data obligations with the hospital before collecting patient data.
- Verify role boundaries, account recovery, monitoring, backup restoration, and load limits in a staging deployment.

### 4. Start the backend

```bash
# From backend/
npm run dev
```
Backend runs at `http://localhost:5000`

### 5. Start the frontend

```bash
# From frontend/
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`

---

## Important URLs

| URL | Purpose |
|---|---|
| `http://localhost:5173` | Main application |
| `http://localhost:5173/display?branchId=<id>` | Display board (TV screen) |
| `http://localhost:5000/api` | REST API base |
| `http://localhost:5000/health` | API health check |
| `http://localhost:5050` | pgAdmin database GUI |

---

## User Roles

| Role | Access |
|---|---|
| **ADMIN** | Full system access — manage users, branches, services, counters, view analytics |
| **STAFF** | Staff console — call next, mark complete, manage their counter |
| **CUSTOMER** | Patient portal — join queue, book appointments, track tickets |

---

## Real-time Events (Socket.io)

| Event | Direction | Data |
|---|---|---|
| `queue:updated` | Server → Client | `{ branchId, queueId, ticket }` |
| `ticket:called` | Server → Client | `{ ticket, counter }` |
| `ticket:status_changed` | Server → Client | `{ ticketId, status }` |
| `counter:status_changed` | Server → Client | `{ counterId, status }` |
| `display:refresh` | Server → Client | `{ branchId }` |

---

## Data Model Overview

```
User ──────┐
           ├── Tickets (1:N)
           ├── Appointments (1:N)
           └── Counter (1:1 for STAFF)

Branch ────┐
           ├── Services (1:N)
           ├── Counters (1:N)
           └── Queues (1:N daily)

Queue ─────┐
           └── Tickets (1:N)

Ticket ────┐
           ├── User (N:1)
           ├── Queue (N:1)
           ├── Service (N:1)
           ├── Counter (N:1)
           └── Appointment (1:1 optional)
```

---

## License

Built for **Kilifi County Referral Hospital**. All rights reserved.
