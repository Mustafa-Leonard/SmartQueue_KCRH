# SmartQueue Enhancement Plan

## Overview
Comprehensive upgrade of the Kilifi County Referral Hospital Queue Management System into a production-ready platform.

## Current System Architecture
- **Frontend**: React 18 + Vite + React Router 6 + Recharts + Socket.io-client
- **Backend**: Express 5 + Prisma + SQLite + Socket.io + JWT Auth
- **Design**: Professional dark sidebar + white/blue content area with Inter font
- **3 Role Portals**: Admin (13 pages), Staff (4 pages), Customer (8 pages) + Public Display Board

## Enhancement Phases

### Phase 1: Customer Portal Enhancements (12 pages)

#### 1. Join Queue Page (`JoinQueuePage.jsx`)
- [ ] Add live queue info on department cards (waiting count, serving ticket, estimated wait, department status badges)
- [ ] Add department icons (Stethoscope, Pill, Heart, etc.)
- [ ] Add search bar to filter departments
- [ ] QR code ticket generation after joining (using qrcode.react already in deps)
- [ ] Confirmation dialog before joining queue
- [ ] Queue progress tracking with live updates
- [ ] Appointment conflict detection
- [ ] Estimated service completion time
- [ ] Real-time position updates via WebSocket

#### 2. My Queue Dashboard (`CustomerDashboardPage.jsx`)
- [ ] Modern ticket card with queue number, current serving, live countdown
- [ ] Queue progress bar showing position
- [ ] QR code on ticket card
- [ ] Cancel/transfer options
- [ ] Auto-update without refresh (enhance socket listeners)
- [ ] Better empty states and loading skeletons
- [ ] Countdown timer animation
- [ ] Department details expansion

#### 3. Appointments Page (`AppointmentPage.jsx`)
- [ ] Enhanced booking with doctor selection
- [ ] Appointment reminders configuration
- [ ] Appointment history with filters
- [ ] Status tracking with timeline
- [ ] Rescheduling workflow
- [ ] Cancel with reason
- [ ] Calendar view integration
- [ ] Conflict detection

#### 4. Visit History (`QueueHistoryPage.jsx`)
- [ ] Searchable cards/table with filters (date range, department, status)
- [ ] Feedback submitted indicator
- [ ] Downloadable visit receipts (PDF)
- [ ] Expanded details modal per visit
- [ ] Duration tracking (wait time + service time)
- [ ] Doctor/desk attended display
- [ ] Export options
- [ ] Pagination for large history

#### 5. Feedback Page (`FeedbackPage.jsx`)
- [ ] Enhanced star rating with hover effects
- [ ] Service categories with icons
- [ ] Optional comments field character count
- [ ] Complaint submission workflow
- [ ] Satisfaction analytics chart
- [ ] Confirmation animation after submission
- [ ] Response from hospital admin
- [ ] Feedback history with filtering

#### 6. Notifications Page (`NotificationsPage.jsx`)
- [ ] Category tabs (Queue Updates, Appointments, Announcements, Emergency, System)
- [ ] Mark as read functionality
- [ ] Read/unread visual distinction
- [ ] Notification grouping by date
- [ ] Priority indicators
- [ ] Click-to-action (e.g., navigate to queue on ticket update)
- [ ] Empty state illustrations
- [ ] Pagination

#### 7. My Profile (`CustomerProfilePage.jsx`)
- [ ] Profile picture upload with preview
- [ ] Emergency contacts section
- [ ] Notification preferences (SMS, Email, In-app)
- [ ] Account activity log (recent logins)
- [ ] Two-factor auth option (UI only)
- [ ] Better form validation UX
- [ ] Success animation after save
- [ ] Dark mode toggle

#### 8. Track Ticket Page (`TrackTicketPage.jsx`)
- [ ] Enhanced real-time WebSocket updates
- [ ] Better audio chime system
- [ ] QR code display for scanning
- [ ] Estimated wait time countdown
- [ ] Position in queue with visual progress
- [ ] Estimated completion time
- [ ] Department contact info
- [ ] Share ticket option
- [ ] Better mobile responsive layout

### Phase 2: Admin Portal Transformation (12 pages)

#### 9. Dashboard - Live Command Center (`DashboardPage.jsx`)
- [ ] Live activity feed (registrations, completions, skips, transfers)
- [ ] Counter open/close events in real-time
- [ ] Staff login/logout activity
- [ ] Hourly registration chart
- [ ] Daily patient trends chart
- [ ] Average waiting time trend
- [ ] Department workload distribution
- [ ] Busiest hours heatmap
- [ ] Service completion rates
- [ ] Historical comparison (week-over-week)
- [ ] Department congestion indicators (green/yellow/red)
- [ ] Hospital performance KPI summary
- [ ] Quick action buttons
- [ ] Real-time notification bell

#### 10. Branches Page (`BranchesPage.jsx`)
- [ ] Multi-branch management
- [ ] Branch operational status (Open/Closed/Maintenance)
- [ ] Location mapping
- [ ] Services offered summary
- [ ] Branch administrators assignment
- [ ] Performance summary per branch
- [ ] Branch contact info
- [ ] Working hours configuration
- [ ] Branch-wise analytics link

#### 11. Counters Page (`CountersPage.jsx`)
- [ ] Real-time counter status display
- [ ] Current patient info on each counter card
- [ ] Waiting patients count per counter
- [ ] Average serving time per counter
- [ ] Open/Close/Pause/Reassign controls (inline)
- [ ] Counter utilization rate
- [ ] Drag-and-drop staff assignment
- [ ] Service assignment per counter
- [ ] Performance metrics per counter
- [ ] Live status indicators

#### 12. Services Page (`ServicesPage.jsx`)
- [ ] Service categorization
- [ ] Priority ordering (drag and drop)
- [ ] Estimated service duration configuration
- [ ] Service activation/deactivation toggle
- [ ] Service assignment to multiple counters
- [ ] Service-wise analytics
- [ ] Required documents/fields per service
- [ ] Service description rich text
- [ ] Service icon/color coding

#### 13. Staff & Users Page (`UsersPage.jsx`)
- [ ] Complete user management with role assignment
- [ ] Permission matrix (granular access control)
- [ ] Department assignment
- [ ] Shift management
- [ ] Profile management
- [ ] Staff activity tracking (login history)
- [ ] Account status management (Active/Suspended/Banned)
- [ ] Bulk user import
- [ ] User statistics
- [ ] Activity log per user

#### 14. Appointments Management (`AppointmentsPage.jsx`)
- [ ] Calendar view integration
- [ ] Approve/Reject workflow
- [ ] Assign department/counter
- [ ] Appointment statistics dashboard
- [ ] Daily appointment timeline
- [ ] Patient no-show tracking
- [ ] SMS/Email reminder triggers
- [ ] Appointment rescheduling admin tools
- [ ] Export appointments report

#### 15. Task Assignment (`TaskAssignPage.jsx`)
- [ ] Task creation with categories
- [ ] Priority levels (Low/Medium/High/Urgent)
- [ ] Due date tracking with reminders
- [ ] Progress tracking (0-100%)
- [ ] Staff notifications on assignment
- [ ] Completion confirmation
- [ ] Task categories/filters
- [ ] Overdue task alerts
- [ ] Task statistics dashboard

#### 16. Reports & Analytics Page (`AnalyticsPage.jsx`)
- [ ] Daily/Weekly/Monthly/Yearly reports
- [ ] Department-wise reports
- [ ] Staff-wise performance reports
- [ ] Branch-wise comparison
- [ ] Service-wise utilization
- [ ] PDF export
- [ ] Excel/CSV export
- [ ] Scheduled report generation
- [ ] Custom date range selector
- [ ] Report templates
- [ ] Print-friendly layouts

#### 17. Queue Management (`QueueManagementPage.jsx`)
- [ ] Drag-and-drop queue reordering
- [ ] Emergency priority queue
- [ ] VIP queue handling
- [ ] Queue pause/resume
- [ ] Patient recall functionality
- [ ] No-show handling workflow
- [ ] Queue transfer between departments
- [ ] Manual ticket assignment to counters
- [ ] Queue metrics dashboard
- [ ] Bulk operations (call next, skip, etc.)

#### 18. Notifications Log (`NotificationLogPage.jsx`)
- [ ] Advanced filtering (type, status, date range, recipient)
- [ ] Real-time notification feed
- [ ] Resend failed notifications
- [ ] Notification templates
- [ ] Bulk notification sending
- [ ] Notification statistics
- [ ] Delivery reports
- [ ] Export notification logs

#### 19. Feedback Review (`FeedbackPage.jsx`)
- [ ] Enhanced feedback analytics
- [ ] Response/reply to feedback
- [ ] Feedback categories management
- [ ] Feedback trends chart
- [ ] Sentiment analysis (positive/neutral/negative)
- [ ] Resolved/unresolved tracking
- [ ] Feedback export
- [ ] Rating distribution visualization

#### 20. System Settings (`SystemSettingsPage.jsx`)
- [ ] Hospital settings (name, address, logo, contact)
- [ ] Notification channels (SMS, Email, WhatsApp)
- [ ] Queue rules configuration
- [ ] Emergency priority settings
- [ ] Working hours configuration
- [ ] Branding customization (colors, logo)
- [ ] Backup management
- [ ] Security options (password policy, 2FA)
- [ ] Audit log settings
- [ ] Email/SMS provider configuration
- [ ] Integration settings
- [ ] Display board customization

#### 21. Audit Logs (NEW PAGE)
- [ ] Login/Logout activity
- [ ] User registrations
- [ ] Data updates/deletions
- [ ] Ticket transfers
- [ ] Counter actions (open/close/pause)
- [ ] Staff actions monitoring
- [ ] Administrative changes
- [ ] Searchable logs with advanced filters
- [ ] Export logs

### Phase 3: Staff Interface Redesign (4 pages)

#### 22. Staff Dashboard - My Console (`StaffDashboardPage.jsx`)
- [ ] Redesigned current patient card (name, ticket, department, wait time, reason)
- [ ] Call Next, Recall, Skip, Transfer, Complete, Hold actions
- [ ] Upcoming patients queue
- [ ] Real-time auto-update
- [ ] Patient notes/visit reason display
- [ ] Quick stats (served today, avg time, skipped, transferred)
- [ ] Performance trend mini-chart
- [ ] Daily achievements
- [ ] Break timer
- [ ] Shift timer

#### 23. Counter Settings (`StaffCounterPage.jsx`)
- [ ] Desk status management (Open/Closed/Break/Paused)
- [ ] Queue capacity settings
- [ ] Break mode with timer
- [ ] Service availability toggle
- [ ] Estimated serving speed indicator
- [ ] Counter performance metrics
- [ ] Shift schedule display
- [ ] Intercom/communication controls

#### 24. Staff Tasks (`StaffTaskListPage.jsx`)
- [ ] Task list with priorities
- [ ] Deadline countdown
- [ ] Completion progress bar
- [ ] Task reminders
- [ ] Supervisor notes display
- [ ] Task completion confirmation
- [ ] Overdue task highlighting
- [ ] Task categories
- [ ] Status update workflow

#### 25. Staff Notifications (`StaffNotificationsPage.jsx`)
- [ ] Queue alerts (new patients, called patients)
- [ ] Emergency notifications
- [ ] Supervisor announcements
- [ ] Appointment alerts
- [ ] Patient transfer requests
- [ ] Priority indicators
- [ ] Read/unread tracking
- [ ] Click-to-action navigation
- [ ] Notification categories

### Phase 4: Public Display Board Enhancement ✅ COMPLETED

#### 26. Display Board (`DisplayBoardPage.jsx`) ✅
- [x] Extra-large "Now Serving" ticket number
- [x] Current service counter display
- [x] Department name prominently
- [x] Next patients waiting with queue positions
- [x] Bilingual labels (English + Swahili)
- [x] Hospital logo prominently
- [x] Live date and time
- [x] Health tips rotation (10 bilingual tips cycling)
- [x] Multi-department simultaneous display (Single/Multi view toggle)
- [x] Automatic voice announcements via Web Speech API (bilingual)
- [x] Real-time socket.io connection (public namespace, no auth required)
- [x] Flash overlay animation on new ticket call
- [x] Card glow animations and smooth transitions
- [x] Sound ON/OFF toggle

### Phase 5: Cross-Cutting Enhancements

#### 27. Real-time Synchronization
- [ ] WebSocket connection management with reconnection
- [ ] Connection status indicator
- [ ] Automatic updates across all interfaces
- [ ] Optimistic UI updates
- [ ] Conflict resolution

#### 28. QR Code System
- [ ] Ticket QR generation (qrcode.react)
- [ ] QR code scanning for verification
- [ ] QR code on tickets, receipts, display board

#### 29. Notification Channels
- [ ] SMS notifications (twilio/africastalking)
- [ ] Email notifications (nodemailer)
- [ ] WhatsApp integration (UI placeholder)
- [ ] In-app toast notifications
- [ ] Notification preferences per user

#### 30. Advanced Queue Features
- [ ] Emergency priority queues
- [ ] VIP queues
- [ ] Estimated waiting time prediction (using historical data)
- [ ] Queue pause and resume
- [ ] Patient recall (re-call after no-show)
- [ ] No-show handling with notes
- [ ] Patient satisfaction survey after service
- [ ] Queue transfer between departments without new ticket

#### 31. UX & UI Polish
- [ ] Dark mode support (CSS variable switching)
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Keyboard shortcuts (K for next patient, etc.)
- [ ] Loading skeleton components
- [ ] Polished empty states with illustrations
- [ ] Error boundaries
- [ ] Success/error toast animations
- [ ] Confirmation dialogs on destructive actions
- [ ] Responsive mobile layouts
- [ ] Production-ready error handling
- [ ] Form validation improvements
- [ ] Page transition animations
- [ ] Hover effects and micro-interactions
- [ ] Consistent loading states

#### 32. Backend Services Enhancement
- [ ] Kiosk registration mode (walk-in patient)
- [ ] SMS notification service (AfricasTalking)
- [ ] WhatsApp notification service
- [ ] Audit logging middleware
- [ ] Reports generation service (PDF/CSV)
- [ ] Settings caching
- [ ] Backup system
- [ ] Enhanced analytics with historical data
- [ ] Activity logging service

## Priority Order

1. **Phase 1**: Customer Portal (highest impact for patients)
2. **Phase 4**: Display Board (visible to all patients)
3. **Phase 3**: Staff Interface (daily workflow critical)
4. **Phase 2**: Admin Portal (management oversight)
5. **Phase 5**: Cross-cutting (foundation for everything)

## Technical Approach

- **All enhancements** maintain existing design system (CSS variables, Inter font, white/blue theme)
- **No breaking changes** to existing functionality
- **Incremental improvements** - each page enhanced independently
- **Real-time**: Socket.io already integrated, enhance existing event system
- **QR Code**: qrcode.react already in package.json dependencies
- **Charts**: Recharts already in dependencies
- **Forms**: react-hook-form already in use
- **Notifications**: react-hot-toast already in use
- **Backend**: Express + Prisma, extend existing services

