const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Utility function for making authenticated API calls with JWT
export const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  console.log('🔧 makeAuthenticatedRequest called for:', url);
  console.log('🔧 Token from localStorage:', token ? 'Present' : 'Missing');
  console.log('🔧 API_BASE_URL:', API_BASE_URL);
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
    console.log('🔧 Authorization header added:', `Bearer ${token.substring(0, 20)}...`);
  } else {
    console.log('🔧 No token available - making unauthenticated request');
  }
  
  const requestOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Keep for backward compatibility
    mode: 'cors', // Explicitly set CORS mode
  };
  
  console.log('🔧 Final request options:', {
    method: requestOptions.method || 'GET',
    url: url,
    headers: requestOptions.headers,
    hasBody: !!requestOptions.body
  });
  
  try {
    const response = await fetch(url, requestOptions);
    console.log('🔧 Response status:', response.status);
    console.log('🔧 Response headers:', Object.fromEntries(response.headers.entries()));
    return response;
  } catch (error) {
    console.error('🔧 Request failed:', error);
    throw error;
  }
};

export { API_BASE_URL }; 