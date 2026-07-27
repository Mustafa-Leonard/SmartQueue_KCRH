import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import Badge from './Badge.jsx';
import {
  DashboardIcon,
  BranchIcon,
  CounterIcon,
  ServiceIcon,
  UsersIcon,
  CalendarIcon,
  AnalyticsIcon,
  TicketIcon,
  UserIcon,
  LogOutIcon,
  FileTextIcon,
  BellIcon,
  SettingsIcon,
  MessageIcon,
  HistoryIcon,
  ActivityIcon,
  KCRHLogo
} from './Icons.jsx';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const getLinks = () => {
    if (!user) return [];

    switch (user.role) {
      case 'ADMIN':
        return [
          { to: '/admin/dashboard', label: 'Dashboard', icon: DashboardIcon },
          { to: '/admin/branches', label: 'Branches', icon: BranchIcon },
          { to: '/admin/counters', label: 'Counters', icon: CounterIcon },
          { to: '/admin/services', label: 'Services', icon: ServiceIcon },
          { to: '/admin/users', label: 'Staff & Users', icon: UsersIcon },
          { to: '/admin/appointments', label: 'Appointments', icon: CalendarIcon },
          { to: '/admin/tasks', label: 'Task Assignment', icon: FileTextIcon },
          { to: '/admin/queue-management', label: 'Queue Management', icon: CounterIcon },
          { to: '/admin/feedback', label: 'Feedback', icon: MessageIcon },
{ to: '/admin/notifications', label: 'Notifications', icon: BellIcon },
          { to: '/admin/audit-logs', label: 'Audit Logs', icon: ActivityIcon },
{ to: '/admin/analytics', label: 'Analytics', icon: AnalyticsIcon },
          { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
        ];
      case 'STAFF':
        return [
          { to: '/staff', label: 'My Console', icon: CounterIcon },
          { to: '/staff/counter', label: 'Counter Settings', icon: BranchIcon },
          { to: '/staff/tasks', label: 'My Tasks', icon: FileTextIcon },
          { to: '/staff/notifications', label: 'Notifications', icon: BellIcon },
        ];
      case 'CUSTOMER':
        return [
          { to: '/customer/dashboard', label: 'My Queue', icon: TicketIcon },
          { to: '/customer/join', label: 'Join Queue', icon: BranchIcon },
          { to: '/customer/appointments', label: 'Appointments', icon: CalendarIcon },
          { to: '/customer/history', label: 'Visit History', icon: HistoryIcon },
          { to: '/customer/feedback', label: 'Feedback', icon: MessageIcon },
          { to: '/customer/notifications', label: 'Notifications', icon: BellIcon },
          { to: '/customer/profile', label: 'My Profile', icon: UserIcon },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleBadgeVariant =
    user?.role === 'ADMIN' ? 'error' : user?.role === 'STAFF' ? 'warning' : 'info';

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        background: 'var(--sidebar-bg)',
        color: 'var(--color-text-inverse)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 'var(--z-sidebar)',
        boxShadow: '4px 0 30px rgba(0,0,0,0.2)',
        borderRight: '1px solid rgba(255,255,255,0.03)',
      }}
    >
      {/* Brand Header — KCRH Official Shield Logo */}
      <div
        style={{
          padding: 'var(--space-6) var(--space-5)',
          background: 'var(--sidebar-bg)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <KCRHLogo size={38} showText />
      </div>

      {/* Nav Links */}
      <nav style={{
        flexGrow: 1,
        padding: 'var(--space-4) var(--space-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        overflowY: 'auto',
      }}>
        <div style={{
          fontSize: '0.6rem',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: 'rgba(255,255,255,0.2)',
          padding: '0 var(--space-3) var(--space-2)',
          fontWeight: 600,
        }}>
          Navigation
        </div>
        {links.map((link) => {
          const IconComp = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/staff' || link.to === '/customer/dashboard'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.875rem',
                borderRadius: '10px',
                color: isActive ? '#fff' : 'var(--sidebar-text)',
                backgroundColor: isActive ? 'var(--sidebar-active)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.875rem',
                transition: 'all var(--transition-fast)',
                textDecoration: 'none',
                position: 'relative',
                boxShadow: isActive ? '0 2px 8px var(--sidebar-active-glow)' : 'none',
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
                }
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', width: 20, justifyContent: 'center', opacity: 0.8 }}>
                <IconComp size={18} />
              </span>
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info Footer with glass effect */}
      {user && (
        <div
          style={{
            padding: 'var(--space-4)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            backgroundColor: 'rgba(0,0,0,0.25)',
            flexShrink: 0,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ marginBottom: '0.75rem' }}>
            {/* Avatar row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                background: 'var(--gradient-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.875rem',
                color: '#fff',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(23, 162, 184, 0.3)',
              }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {user.name}
                </p>
                <p style={{
                  fontSize: '0.675rem',
                  color: 'var(--sidebar-text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  opacity: 0.7,
                }}>
                  {user.email}
                </p>
              </div>
            </div>
            <Badge variant={roleBadgeVariant}>
              {user.role}
            </Badge>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: 'var(--space-2_5)',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(255,255,255,0.03)',
              color: 'var(--sidebar-text)',
              fontSize: '0.8125rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all var(--transition-fast)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.color = 'var(--sidebar-text)';
            }}
          >
            <LogOutIcon size={16} /> Sign Out
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
