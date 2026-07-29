import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { KCRHLogo, CheckCircleIcon } from '../../components/common/Icons.jsx';
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
          <KCRHLogo size={56} />
        </div>
        <h1>Reset Your Password</h1>
        <p>Kilifi County Referral Hospital Digital Patient Queue System. Enter your registered email to receive a password reset link.</p>
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

