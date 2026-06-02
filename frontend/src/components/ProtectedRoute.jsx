import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppUser } from '../context/UserContext';
import { Loader } from './ui/Feedback';

/**
 * Route guard. Allows access for a valid Clerk session OR an anonymous guest
 * session (both surfaced through useAppUser). Redirects to /login otherwise,
 * preserving the target path.
 */
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { user, loading } = useAppUser();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Loader label="Verifying your session…" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

export default ProtectedRoute;
