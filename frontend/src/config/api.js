// HTTP helpers built on top of the centralized config. The API base URL comes
// from config (which reads VITE_API_URL) — never hardcoded here.
import config from './index';
import { getGuestId } from '../lib/guest';

const API_BASE_URL = config.apiUrl;

// Returns the current Clerk session token (or null when signed out). Clerk
// exposes its instance on window.Clerk once <ClerkProvider> has mounted.
const getClerkToken = async () => {
  try {
    const clerk = typeof window !== 'undefined' ? window.Clerk : undefined;
    if (clerk?.session) {
      return await clerk.session.getToken();
    }
  } catch {
    /* not signed in / Clerk not ready */
  }
  return null;
};

// Wrapper around fetch that authenticates the request: a Clerk session token
// when signed in, otherwise the anonymous guest id (x-guest-id). Applies JSON +
// CORS defaults and returns the raw Response.
export const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = await getClerkToken();
  const guestId = token ? null : getGuestId();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(guestId ? { 'x-guest-id': guestId } : {}),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
    mode: 'cors',
  });
};

export { API_BASE_URL };
