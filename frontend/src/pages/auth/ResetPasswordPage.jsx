import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { KCRHLogo, CheckCircleIcon } from '../../components/common/Icons.jsx';
import * as authApi from '../../api/authApi.js';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { email: email || '' }
  });

  const newPassword = watch('newPassword');

  const onSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword(data.email, token, data.newPassword);
      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="auth-page">
        <div className="auth-sidebar">
          <div className="auth-logo-large"><KCRHLogo size={56} /></div>
          <h1>Invalid Reset Link</h1>
          <p>This password reset link is invalid or missing required parameters.</p>
        </div>
        <div className="auth-form-container" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <h2>Invalid or Expired Link</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '1rem' }}>
            Please request a new password reset link.
          </p>
          <Link to="/forgot-password" style={{ display: 'inline-block', marginTop: '1.5rem' }}>
            <Button variant="primary">Request New Reset Link</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-sidebar">
        <div className="auth-logo-large"><KCRHLogo size={56} /></div>
        <h1>Reset Your Password</h1>
        <p>Create a new strong password for your KCRH SmartQueue account. Use at least 8 characters with a mix of letters, numbers, and symbols.</p>
      </div>

      <div className="auth-form-container">
        <div className="auth-form-header">
          <h2>Set New Password</h2>
          <p>Enter your new password below</p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
            }}>
              <CheckCircleIcon size={36} />
            </div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Password Reset Successful!</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Email Address"
              type="email"
              error={errors.email}
              disabled
              {...register('email', { required: true })}
            />

            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              error={errors.newPassword}
              {...register('newPassword', { 
                required: 'New password is required',
                minLength: { value: 8, message: 'Must be at least 8 characters' }
              })}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword}
              {...register('confirmPassword', { 
                required: 'Please confirm your password',
                validate: (val) => val === newPassword || 'Passwords do not match'
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
              {submitting ? 'Resetting...' : 'Reset Password'}
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

export default ResetPasswordPage;

