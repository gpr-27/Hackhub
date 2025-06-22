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
        
        // TEMPORARY: Clear old invalid tokens
        const token = localStorage.getItem('authToken');
        if (token && token.includes('eyJ')) {
          console.log('🧹 Clearing potentially invalid old token...');
          localStorage.removeItem('authToken');
          console.log('🧹 Old token cleared, redirecting to login...');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        // Small delay to ensure localStorage is available after navigation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get JWT token from localStorage
        const newToken = localStorage.getItem('authToken');
        console.log('🔑 JWT token from localStorage:', newToken ? 'Present' : 'Missing');
        
        const headers = {
          'Content-Type': 'application/json',
        };
        
        // Add JWT token to headers if available
        if (newToken) {
          headers.Authorization = `Bearer ${newToken}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/auth/check`, {
          method: 'GET',
          headers: headers,
          credentials: 'include', // Keep for session fallback
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