import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  console.log('PrivateRoute:', { currentUser, loading, pathname: location.pathname }); // Debug log

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-indigo-600 border-gray-200"></div>
      </div>
    );
  }

  return currentUser ? <>{children}</> : <Navigate to="/login" replace />;
};

export default PrivateRoute;