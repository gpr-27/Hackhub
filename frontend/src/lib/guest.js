// Anonymous guest-session helpers. The guestId is stored in localStorage and
// sent to the backend via the `x-guest-id` header (see config/api.js). Guest
// data persists in MongoDB exactly like a Clerk user's.
import config from '../config';

const GUEST_KEY = 'aura-guest-id';

export const getGuestId = () => {
  try {
    return localStorage.getItem(GUEST_KEY);
  } catch {
    return null;
  }
};
export const setGuestId = (id) => {
  try {
    localStorage.setItem(GUEST_KEY, id);
  } catch {
    /* ignore */
  }
};
export const clearGuestId = () => {
  try {
    localStorage.removeItem(GUEST_KEY);
  } catch {
    /* ignore */
  }
};

// Creates a new anonymous guest on the server and stores the id locally.
export async function createGuest() {
  const res = await fetch(`${config.apiUrl}/api/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    mode: 'cors',
  });
  if (!res.ok) throw new Error(`Could not start a guest session (${res.status})`);
  const data = await res.json();
  setGuestId(data.guestId);
  return data;
}

// Restores a guest record by id (returns null if it no longer exists / expired).
export async function fetchGuest(guestId) {
  try {
    const res = await fetch(`${config.apiUrl}/api/guest/${encodeURIComponent(guestId)}`, { mode: 'cors' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
