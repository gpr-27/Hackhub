import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import API_BASE_URL from '../config/api';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status with the server
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking auth at:', `${API_BASE_URL}/api/auth/check`);
        
        const response = await fetch(`${API_BASE_URL}/api/auth/check`, {
          method: 'GET',
          credentials: 'include',
        });
        
        console.log('🔐 Auth check response status:', response.status);
        
        const data = await response.json();
        console.log('🔐 Auth check response data:', data);
        
        setIsAuthenticated(data.isAuthenticated);
      } catch (error) {
        console.log('❌ Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    // Show loading indicator while checking authentication
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated, but save the location they were
    // trying to access so we can send them there after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute; 