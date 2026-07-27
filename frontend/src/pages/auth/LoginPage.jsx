import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { KCRHLogo } from '../../components/common/Icons.jsx';

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
      {/* Visual Left Sidebar — KCRH Branding */}
      <div className="auth-sidebar">
        <div className="auth-logo-large">
          <KCRHLogo size={56} />
        </div>
        <h1>KCRH SmartQueue</h1>
        <p>Kilifi County Referral Hospital Digital Patient Queue System. Avoid physical waiting lines, get instant SMS alerts, and track your turn live.</p>
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
      </div>
    </div>
  );
};

export default LoginPage;
