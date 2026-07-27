import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { KCRHLogo } from '../../components/common/Icons.jsx';

const RegisterPage = () => {
  const { register: signup } = useContext(AuthContext);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors } 
  } = useForm();

  const passwordValue = watch('password');

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await signup(data);
      toast.success('Patient account registered successfully!');
      navigate('/join');
    } catch (err) {
      toast.error(err.message || 'Registration failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Sidebar Info — KCRH Branding */}
      <div className="auth-sidebar">
        <div className="auth-logo-large">
          <KCRHLogo size={56} />
        </div>
        <h1>Create Patient Account</h1>
        <p>Register to Kilifi County Referral Hospital Digital Queue System. Booking appointments and checking in requires a verified phone number for SMS queue alerts.</p>
      </div>

      {/* Main Registration Form */}
      <div className="auth-form-container">
        <div className="auth-form-header">
          <h2>Self Registration</h2>
          <p>Register as a patient to access queues</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Full Name"
            placeholder="e.g. John Kamau"
            error={errors.name}
            {...register('name', { required: 'Full name is required' })}
          />

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
            label="Phone Number (for SMS Alerts)"
            placeholder="e.g. +254712345678"
            error={errors.phone}
            {...register('phone', { 
              required: 'Phone number is required',
              pattern: {
                value: /^\+?[1-9]\d{1,14}$/,
                message: 'Provide a valid phone number in international format (e.g. +254712345678)'
              }
            })}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password}
            {...register('password', { 
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' }
            })}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword}
            {...register('confirmPassword', { 
              required: 'Confirm password is required',
              validate: (val) => val === passwordValue || 'Passwords do not match'
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
            {submitting ? 'Registering Account...' : 'Create Account'}
          </Button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Log in here</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
