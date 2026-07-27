import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { KCRHLogo } from '../components/common/Icons.jsx';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const getHomeLink = () => {
    if (!isAuthenticated) return '/login';
    if (user?.role === 'ADMIN') return '/admin/dashboard';
    if (user?.role === 'STAFF') return '/staff';
    return '/customer/dashboard';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* KCRH Official Logo */}
      <div style={{ marginBottom: '2rem', opacity: 0.7 }}>
        <KCRHLogo size={48} showText />
      </div>

      {/* 404 illustration */}
      <div style={{
        fontSize: '8rem',
        fontWeight: 900,
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        lineHeight: 1,
        marginBottom: '1rem',
        letterSpacing: '-4px',
      }}>
        404
      </div>

      <div style={{
        fontSize: '3rem',
        marginBottom: '1rem',
      }}>
        🏥
      </div>

      <h1 style={{
        fontSize: '1.75rem',
        fontWeight: 700,
        color: 'var(--color-text)',
        marginBottom: '0.75rem',
        textAlign: 'center',
      }}>
        Page Not Found
      </h1>

      <p style={{
        fontSize: '1rem',
        color: 'var(--color-text-secondary)',
        textAlign: 'center',
        maxWidth: '400px',
        lineHeight: 1.6,
        marginBottom: '2.5rem',
      }}>
        The page you're looking for doesn't exist or has been moved. 
        Please check the URL or return to the dashboard.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.color = 'var(--color-primary)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text)';
          }}
        >
          ← Go Back
        </button>

        <Link
          to={getHomeLink()}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)',
            color: '#fff',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: '0.95rem',
            transition: 'background 0.2s',
            display: 'inline-block',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-dark)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary)'}
        >
          🏠 Return to Dashboard
        </Link>
      </div>

      <p style={{
        marginTop: '4rem',
        fontSize: '0.8rem',
        color: 'var(--color-text-muted)',
      }}>
        SmartQueue v1.0 — Kilifi County Referral Hospital
      </p>
    </div>
  );
}
