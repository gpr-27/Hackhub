const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Utility function for making authenticated API calls with JWT
export const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }
  
  const requestOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Keep for backward compatibility
  };
  
  return fetch(url, requestOptions);
};

export { API_BASE_URL }; 