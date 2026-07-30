import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import Spinner from './Spinner.jsx';

const ProtectedRoute = ({ roles = [], children }) => {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    // Redirect to home or role dashboard
    const homeMap = {
      ADMIN: '/admin/dashboard',
      STAFF: '/staff',
      CUSTOMER: '/customer/dashboard'
    };
    return <Navigate to={homeMap[user.role] || '/login'} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
