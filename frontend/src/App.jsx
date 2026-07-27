import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
// Admin pages
import DashboardPage from './pages/admin/DashboardPage.jsx';
import BranchesPage from './pages/admin/BranchesPage.jsx';
import CountersPage from './pages/admin/CountersPage.jsx';
import ServicesPage from './pages/admin/ServicesPage.jsx';
import UsersPage from './pages/admin/UsersPage.jsx';
import AnalyticsPage from './pages/admin/AnalyticsPage.jsx';
import AppointmentsPage from './pages/admin/AppointmentsPage.jsx';
import TaskAssignPage from './pages/admin/TaskAssignPage.jsx';
import QueueManagementPage from './pages/admin/QueueManagementPage.jsx';
import NotificationLogPage from './pages/admin/NotificationLogPage.jsx';
import SystemSettingsPage from './pages/admin/SystemSettingsPage.jsx';
import FeedbackPage from './pages/admin/FeedbackPage.jsx';
import AuditLogPage from './pages/admin/AuditLogPage.jsx';
// Staff pages
import StaffDashboardPage from './pages/staff/StaffDashboardPage.jsx';
import StaffCounterPage from './pages/staff/StaffCounterPage.jsx';
import StaffTaskListPage from './pages/staff/StaffTaskListPage.jsx';
import StaffNotificationsPage from './pages/staff/StaffNotificationsPage.jsx';
// Customer pages
import CustomerDashboardPage from './pages/customer/CustomerDashboardPage.jsx';
import JoinQueuePage from './pages/customer/JoinQueuePage.jsx';
import TrackTicketPage from './pages/customer/TrackTicketPage.jsx';
import AppointmentPage from './pages/customer/AppointmentPage.jsx';
import CustomerProfilePage from './pages/customer/CustomerProfilePage.jsx';
import CustomerFeedbackPage from './pages/customer/FeedbackPage.jsx';
import CustomerNotificationsPage from './pages/customer/NotificationsPage.jsx';
import QueueHistoryPage from './pages/customer/QueueHistoryPage.jsx';
// Display board (public)
import DisplayBoardPage from './pages/display/DisplayBoardPage.jsx';
// Shared
import NotFoundPage from './pages/NotFoundPage.jsx';
import Spinner from './components/common/Spinner.jsx';
import AppLayout from './components/common/AppLayout.jsx';

function RoleRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'STAFF') return <Navigate to="/staff" replace />;
  return <Navigate to="/customer/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public auth routes (no layout) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/track/:ticketCode" element={<TrackTicketPage />} />
      <Route path="/track" element={<TrackTicketPage />} />
      <Route path="/display/:branchId" element={<DisplayBoardPage />} />
      <Route path="/display" element={<DisplayBoardPage />} />

      {/* Protected routes — all use AppLayout (sidebar + topbar) */}
      <Route element={<AppLayout />}>
        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/branches"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <BranchesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/counters"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <CountersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/services"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <ServicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
<Route
          path="/admin/appointments"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AppointmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tasks"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <TaskAssignPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/queue-management"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <QueueManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <NotificationLogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <SystemSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/feedback"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <FeedbackPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AuditLogPage />
            </ProtectedRoute>
          }
        />

        {/* Staff routes */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute roles={['STAFF', 'ADMIN']}>
              <StaffDashboardPage />
            </ProtectedRoute>
          }
        />
<Route
          path="/staff/counter"
          element={
            <ProtectedRoute roles={['STAFF', 'ADMIN']}>
              <StaffCounterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/tasks"
          element={
            <ProtectedRoute roles={['STAFF', 'ADMIN']}>
              <StaffTaskListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/notifications"
          element={
            <ProtectedRoute roles={['STAFF', 'ADMIN']}>
              <StaffNotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Customer routes */}
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <CustomerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/join"
          element={
            <ProtectedRoute roles={['CUSTOMER', 'ADMIN', 'STAFF']}>
              <JoinQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/join"
          element={
            <ProtectedRoute roles={['CUSTOMER', 'ADMIN', 'STAFF']}>
              <JoinQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/appointments"
          element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <AppointmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointment"
          element={
            <ProtectedRoute roles={['CUSTOMER', 'ADMIN', 'STAFF']}>
              <AppointmentPage />
            </ProtectedRoute>
          }
        />
<Route
          path="/customer/profile"
          element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <CustomerProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/feedback"
          element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <CustomerFeedbackPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/notifications"
          element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <CustomerNotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/history"
          element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <QueueHistoryPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<RoleRedirect />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
