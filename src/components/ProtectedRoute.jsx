import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { API_BASE_URL, makeAuthenticatedRequest } from '../config/api';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status with the server
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking auth at:', `${API_BASE_URL}/api/auth/check`);
        
        // Check if JWT token exists in localStorage
        const token = localStorage.getItem('authToken');
        console.log('🔑 JWT token from localStorage:', token ? 'Present' : 'Missing');
        
        if (!token) {
          console.log('🔑 No JWT token found - user not authenticated');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Use makeAuthenticatedRequest to check auth status
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/auth/check`, {
          method: 'GET'
        });

        console.log('🔐 Auth check response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔐 Auth check response data:', data);
          setIsAuthenticated(data.isAuthenticated === true);
          console.log('🔐 setIsAuthenticated called with:', data.isAuthenticated);
        } else {
          console.log('❌ Auth check failed with status:', response.status);
          if (response.status === 401) {
            // Remove invalid token
            localStorage.removeItem('authToken');
            console.log('🔑 Invalid JWT token removed from localStorage');
          }
          setIsAuthenticated(false);
        }
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
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#6B7280'
      }}>
        Verifying authentication...
      </div>
    );
  }

  console.log('🔐 Final render - isAuthenticated:', isAuthenticated);
  console.log('🔐 Final render - isLoading:', isLoading);

  if (!isAuthenticated) {
    console.log('🔐 Redirecting to login because isAuthenticated is:', isAuthenticated);
    // Redirect to login if not authenticated, but save the location they were
    // trying to access so we can send them there after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
