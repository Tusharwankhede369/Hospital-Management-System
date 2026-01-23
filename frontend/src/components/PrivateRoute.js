import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    console.log('PrivateRoute: No user found, redirecting to login');
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    console.log(`PrivateRoute: User role "${user.role}" not in allowed roles:`, allowedRoles);
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;

