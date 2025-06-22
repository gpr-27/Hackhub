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
        
        // Small delay to ensure localStorage is available after navigation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get JWT token from localStorage with retry logic
        let token = null;
        let retryCount = 0;
        const maxRetries = 3;

        while (!token && retryCount < maxRetries) {
          retryCount++;
          console.log(`🔑 Attempt ${retryCount}: Retrieving JWT token from localStorage`);
          token = localStorage.getItem('authToken');

          if (!token) {
            const delay = retryCount * 500; // Increase delay with each retry
            console.log(`🔑 Token missing. Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }

        console.log('🔑 JWT token from localStorage:', token ? 'Present' : 'Missing');
        console.log('🔑 Token length:', token ? token.length : 0);

        const headers = {
          'Content-Type': 'application/json',
        };

        // Add JWT token to headers if available
        if (token) {
          headers.Authorization = `Bearer ${token}`;
          console.log('🔑 Authorization header set:', headers.Authorization);
        } else {
          console.log('🔑 No JWT token found, Authorization header not set.');
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/check`, {
          method: 'GET',
          headers: headers,
        });

        console.log('🔐 Auth check response status:', response.status);
        
        const data = await response.json();
        console.log('🔐 Auth check response data:', data);
        console.log('🔐 data.isAuthenticated value:', data.isAuthenticated);
        console.log('🔐 data.isAuthenticated type:', typeof data.isAuthenticated);
        
        setIsAuthenticated(data.isAuthenticated);
        console.log('🔐 setIsAuthenticated called with:', data.isAuthenticated);
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
