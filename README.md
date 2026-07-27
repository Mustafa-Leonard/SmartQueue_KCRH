# 🏥 SmartQueue — Kilifi County Referral Hospital

> **A modern, real-time queue management system** for Kilifi County Referral Hospital (KCRH). Replaces manual ticketing with a digital, data-driven queue experience for patients, staff, and administrators.

---

## ✨ Features

### For Patients (Customers)
- ✅ Online registration and secure login
- ✅ Join a queue digitally — walk-in or appointment
- ✅ Real-time ticket tracking (position, estimated wait time)
- ✅ Get notified via **SMS** (Africa's Talking) and **Email** (Nodemailer) when called
- ✅ Book appointments in advance with time slot selection
- ✅ View full ticket history and upcoming appointments

### For Staff (Nurses/Clerks)
- ✅ Staff console dashboard — call next, serve, skip, no-show
- ✅ Toggle counter status (Open / Closed / Paused)
- ✅ Transfer tickets between counters
- ✅ Real-time queue updates via WebSockets

### For Administrators
- ✅ Full department (branch) management
- ✅ Service catalogue per department
- ✅ Counter and staff assignment management
- ✅ User management (ADMIN / STAFF / CUSTOMER roles)
- ✅ Appointments oversight and confirmation
- ✅ Analytics dashboard — wait times, throughput, no-show rates, peak hours
- ✅ Recharts-powered visualizations

### Display Board (TV/Kiosk)
- ✅ Public display screen for waiting area
- ✅ Shows: Now Serving tickets + Next Up queue list
- ✅ Live clock, scrolling ticker
- ✅ Real-time via Socket.io + 30-second auto-refresh

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend API** | Node.js 20 + Express 5 |
| **Real-time** | Socket.io 4 |
| **ORM** | Prisma 5 |
| **Database** | PostgreSQL 16 (via Docker) |
| **SMS** | Africa's Talking SDK |
| **Email** | Nodemailer (Gmail SMTP) |
| **Frontend** | React 18 + Vite 5 |
| **Styling** | Vanilla CSS with custom design system |
| **Auth** | JWT (access 15m + refresh 7d) + bcrypt |
| **Validation** | Zod (backend) + React Hook Form (frontend) |
| **Charts** | Recharts |

---

## 📁 Project Structure

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
├── docker-compose.yml         # PostgreSQL 16 + pgAdmin 4
├── .gitignore
├── .prettierrc
└── .eslintrc.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm 9+

### 1. Clone the repository

```bash
git clone <repo-url>
cd SmartQueue
```

### 2. Start the database

```bash
docker compose up -d
```
PostgreSQL runs on port `5432`. pgAdmin runs on port `5050` (admin@kcrh.go.ke / Admin@2026)

### 3. Configure backend environment

```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` and fill in:
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` — generate strong secrets
- `ATK_API_KEY` — your Africa's Talking API key (get from [africastalking.com](https://africastalking.com))
- `SMTP_USER` and `SMTP_PASS` — your email credentials

### 4. Set up the database

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
```
This creates all tables and seeds: 1 admin account, 5 hospital departments, 10 services, 8 counters.

**Default admin credentials:**
```
Email: admin@kcrh.go.ke
Password: Admin@KCRH2024!
```

### 5. Start the backend

```bash
# From backend/
npm run dev
```
Backend runs at `http://localhost:5000`

### 6. Start the frontend

```bash
# From frontend/
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`

---

## 🔗 Important URLs

| URL | Purpose |
|---|---|
| `http://localhost:5173` | Main application |
| `http://localhost:5173/display?branchId=<id>` | Display board (TV screen) |
| `http://localhost:5000/api` | REST API base |
| `http://localhost:5000/health` | API health check |
| `http://localhost:5050` | pgAdmin database GUI |

---

## 👥 User Roles

| Role | Access |
|---|---|
| **ADMIN** | Full system access — manage users, branches, services, counters, view analytics |
| **STAFF** | Staff console — call next, mark complete, manage their counter |
| **CUSTOMER** | Patient portal — join queue, book appointments, track tickets |

---

## 🔌 Real-time Events (Socket.io)

| Event | Direction | Data |
|---|---|---|
| `queue:updated` | Server → Client | `{ branchId, queueId, ticket }` |
| `ticket:called` | Server → Client | `{ ticket, counter }` |
| `ticket:status_changed` | Server → Client | `{ ticketId, status }` |
| `counter:status_changed` | Server → Client | `{ counterId, status }` |
| `display:refresh` | Server → Client | `{ branchId }` |

---

## 📊 Data Model Overview

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

## 📄 License

Built for **Kilifi County Referral Hospital**. All rights reserved.
