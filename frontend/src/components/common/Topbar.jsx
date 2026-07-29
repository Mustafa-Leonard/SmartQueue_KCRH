import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { ClockIcon } from './Icons.jsx';

const Topbar = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.startsWith('/admin/dashboard')) return 'Admin / Dashboard';
    if (path.startsWith('/admin/branches')) return 'Admin / Branches';
    if (path.startsWith('/admin/counters')) return 'Admin / Counters';
    if (path.startsWith('/admin/services')) return 'Admin / Services';
    if (path.startsWith('/admin/users')) return 'Admin / Staff & Users';
    if (path.startsWith('/admin/analytics')) return 'Admin / Reports';
    if (path.startsWith('/staff')) return 'Staff Console';
    if (path.startsWith('/join')) return 'Join Queue';
    if (path.startsWith('/appointment')) return 'Appointments';
    return 'Dashboard';
  };

  const formattedTime = time.toLocaleTimeString('en-KE', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

  return (
    <header 
      style={{
        height: '70px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-6)',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-topbar)',
        boxShadow: 'var(--shadow-xs)'
      }}
    >
      {/* Left: Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            backgroundColor: 'var(--color-success)',
            boxShadow: '0 0 5px var(--color-success)',
            animation: 'pulse-dot 2s infinite',
            flexShrink: 0
          }} />
          <h1 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.2px' }}>
            {getBreadcrumb()}
          </h1>
        </div>
      </div>

      {/* Right widgets */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
        {/* Real-time Clock with glass pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          fontSize: '0.8125rem', fontWeight: 600,
          color: 'var(--color-text-secondary)',
          fontVariantNumeric: 'tabular-nums',
          backgroundColor: 'var(--color-surface-2)',
          padding: '0.4rem 0.875rem',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--color-border-light)'
        }}>
          <ClockIcon size={14} /> {formattedTime}
        </div>

        {/* User avatar section */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>{user.name}</p>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-primary-light)', letterSpacing: '0.3px' }}>
                {user.role}
              </span>
            </div>
            <div 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'var(--gradient-primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.875rem',
                boxShadow: '0 2px 6px hsla(226, 68%, 38%, 0.25)'
              }}
            >
              {user.name.substring(0, 2).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
