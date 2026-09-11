import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const response = await login(data);
      toast.success(`Welcome back, ${response.user.name}`);
      
      // Route based on role
      const redirectMap = {
        ADMIN: '/admin/dashboard',
        STAFF: '/staff',
        CUSTOMER: '/join'
      };
      navigate(redirectMap[response.user.role] || '/join');
    } catch (err) {
      toast.error(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Visual Left Sidebar — Text Branding */}
      <div className="auth-sidebar">
        <div className="auth-logo-large">
          <svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v8M8 12h8" strokeWidth="2" />
          </svg>
        </div>
        <h1>Hospital Queue Management System</h1>
        <p>Digital patient queue management for modern healthcare. Avoid physical waiting lines, get instant SMS alerts, and track your turn live.</p>
      </div>

      {/* Right side form */}
      <div className="auth-form-container">
        <div className="auth-form-header">
          <h2>Patient & Staff Portal</h2>
          <p>Login to schedule appointments or manage queues</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. name@domain.com"
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
            style={{ marginTop: '1.5rem' }}
          >
            {submitting ? 'Authenticating...' : 'Secure Log In'}
          </Button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Don't have a patient account? <Link to="/register" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Register here</Link>
        </div>
        <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <Link to="/forgot-password" style={{ fontWeight: 600, color: 'var(--color-primary-light)' }}>Forgot Password?</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
