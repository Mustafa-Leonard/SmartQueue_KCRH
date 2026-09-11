import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { CheckCircleIcon } from '../../components/common/Icons.jsx';
import * as authApi from '../../api/authApi.js';

const ForgotPasswordPage = () => {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
      toast.success('If that email is registered, a reset link has been sent.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-sidebar">
        <div className="auth-logo-large">
          <svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v8M8 12h8" strokeWidth="2" />
          </svg>
        </div>
        <h1>Hospital Queue Management System</h1>
        <p>Enter your registered email address to receive a secure password reset link and regain access to your account.</p>
      </div>

      <div className="auth-form-container">
        <div className="auth-form-header">
          <h2>Forgot Password</h2>
          <p>Enter your email to receive reset instructions</p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
            }}>
              <CheckCircleIcon size={36} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Check Your Email</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              If that email is registered in our system, you will receive a password reset link shortly. Please check your inbox and spam folder.
            </p>
            <Link to="/login">
              <Button variant="primary">Back to Login</Button>
            </Link>
          </div>
        ) : (
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

            <Button 
              type="submit" 
              variant="primary" 
              disabled={submitting}
              size="lg"
              fullWidth
              style={{ marginTop: '1.5rem' }}
            >
              {submitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        )}

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Remember your password? <Link to="/login" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Log in here</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

