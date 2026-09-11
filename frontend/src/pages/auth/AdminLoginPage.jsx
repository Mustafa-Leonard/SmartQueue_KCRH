import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { LockIcon } from '../../components/common/Icons.jsx';

const AdminLoginPage = () => {
  const { login } = useContext(AuthContext);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const response = await login(data);
      if (response.user.role !== 'ADMIN') {
        toast.error('Access denied. This portal is for administrators only.');
        return;
      }
      toast.success(`Welcome back, ${response.user.name}`);
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'var(--font-family)',
    }}>
      {/* Left — Dark Enterprise Branding Panel */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(160deg, hsl(222, 47%, 8%) 0%, hsl(226, 68%, 15%) 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem',
        color: '#fff',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 25% 25%, hsla(226,65%,53%,0.06) 0%, transparent 60%), radial-gradient(circle at 75% 75%, hsla(172,66%,36%,0.05) 0%, transparent 60%)',
          pointerEvents: 'none'
        }} />
        {/* Corner decoration lines */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '3px',
          background: 'linear-gradient(90deg, transparent, hsl(226,65%,53%), hsl(172,66%,36%), transparent)'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Shield icon + branding */}
          <div style={{
            width: 80, height: 80,
            borderRadius: '20px',
            background: 'linear-gradient(135deg, hsl(226,68%,38%) 0%, hsl(172,66%,36%) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px hsla(226,68%,38%,0.4)',
            margin: '0 auto 1.75rem',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>

          {/* Text branding */}
          <div style={{
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '3px',
            textTransform: 'uppercase', color: 'hsl(226,65%,70%)',
            marginBottom: '0.75rem'
          }}>
            Secure Administration Access
          </div>
          <h1 style={{
            fontSize: '1.75rem', fontWeight: 800,
            letterSpacing: '-0.5px', lineHeight: 1.2,
            color: '#fff', marginBottom: '1rem'
          }}>
            Hospital Queue<br />Management System
          </h1>
          <p style={{
            fontSize: '0.9rem', color: 'hsla(226,65%,80%,0.85)',
            lineHeight: 1.7, maxWidth: '360px', margin: '0 auto'
          }}>
            Administrator portal for managing hospital departments, queues, staff, services, and operational analytics.
          </p>

          <div style={{
            marginTop: '2.5rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
            fontSize: '0.8rem', color: 'hsla(226,65%,75%,0.7)',
          }}>
            {['Real-time Queue Monitoring', 'Staff & Counter Management', 'Analytics & Reporting', 'System Configuration'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', justifyContent: 'center' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'hsl(172,66%,50%)', flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div style={{
        width: 460,
        backgroundColor: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '3rem 3.5rem',
        boxShadow: '-4px 0 30px hsla(226,40%,20%,0.08)',
        position: 'relative',
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, hsl(226,68%,38%), hsl(172,66%,36%))'
        }} />

        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '1.5px', color: 'var(--color-primary)',
            backgroundColor: 'var(--color-primary-50)',
            padding: '0.3rem 0.875rem', borderRadius: 'var(--radius-full)',
            marginBottom: '1.25rem'
          }}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Admin Portal Only
          </div>
          <h2 style={{
            fontSize: '1.625rem', fontWeight: 800, color: 'var(--color-text)',
            letterSpacing: '-0.3px', marginBottom: '0.5rem'
          }}>
            Administrator Login
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Enter your admin credentials to access the management console
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Admin Email Address"
            type="email"
            placeholder="admin@hospital.go.ke"
            error={errors.email}
            {...register('email', {
              required: 'Email address is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Provide a valid email address'
              }
            })}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password}
            {...register('password', { required: 'Password is required' })}
          />

          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            size="lg"
            fullWidth
            style={{ marginTop: '1.75rem' }}
          >
            {submitting ? 'Authenticating...' : 'Access Admin Console'}
          </Button>
        </form>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-primary-50)',
          border: '1px solid var(--color-primary-100)',
          fontSize: '0.8rem',
          color: 'var(--color-primary-dark)',
          display: 'flex',
          gap: '0.625rem',
          alignItems: 'flex-start'
        }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>This portal is restricted to authorized administrators only. Unauthorized access is prohibited and monitored.</span>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          Patient or staff?{' '}
          <Link to="/login" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
            Use the main portal
          </Link>
        </div>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          Hospital Queue Management System &mdash; Admin Console
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
