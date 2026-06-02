// Current-user context. Resolves the active user from EITHER a Clerk session OR
// an anonymous guest session (backed by MongoDB), and exposes it in the shape the
// app already expects via useAppUser(). On startup it restores a stored guest;
// when a guest later signs into Clerk, their data is migrated automatically.
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk, useAuth } from '@clerk/react';
import { API_BASE_URL, makeAuthenticatedRequest } from '../config/api';
import { getGuestId, clearGuestId, fetchGuest, createGuest } from '../lib/guest';

const UserContext = createContext({
  user: null,
  loading: true,
  isGuest: false,
  logout: () => {},
  loginAsGuest: async () => {},
  reload: async () => {},
  setUser: () => {},
});

export function UserProvider({ children }) {
  const navigate = useNavigate();
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();

  const [guest, setGuest] = useState(null);
  const [guestChecking, setGuestChecking] = useState(true);
  const migratedRef = useRef(false);

  // --- Startup: restore a stored guest session (if any) ---
  useEffect(() => {
    let active = true;
    (async () => {
      const gid = getGuestId();
      if (gid) {
        const record = await fetchGuest(gid);
        if (active) {
          if (record) setGuest(record);
          else {
            clearGuestId();
            setGuest(null);
          }
        }
      }
      if (active) setGuestChecking(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // --- Upgrade: a guest who signs into Clerk gets their data migrated once ---
  useEffect(() => {
    if (!clerkLoaded || !isSignedIn) return;
    const gid = getGuestId();
    if (!gid || migratedRef.current) return;
    migratedRef.current = true;
    (async () => {
      try {
        await makeAuthenticatedRequest(`${API_BASE_URL}/api/guest/migrate`, {
          method: 'POST',
          body: JSON.stringify({ guestId: gid }),
        });
      } catch {
        /* best-effort; data stays under the guest id if this fails */
      } finally {
        clearGuestId();
        setGuest(null);
      }
    })();
  }, [clerkLoaded, isSignedIn]);

  const loginAsGuest = useCallback(async () => {
    const record = await createGuest();
    setGuest(record);
    return record;
  }, []);

  // Clerk user wins over a guest (e.g. mid-migration).
  const user = clerkUser
    ? {
        id: clerkUser.id,
        name: clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'Friend',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        avatar: clerkUser.imageUrl || null,
        isGuest: false,
      }
    : guest
    ? { id: guest.guestId, name: guest.displayName || 'Guest', email: '', avatar: null, isGuest: true }
    : null;

  const loading = !clerkLoaded || guestChecking;

  const logout = useCallback(async () => {
    if (getGuestId()) {
      clearGuestId();
      setGuest(null);
      navigate('/', { replace: true });
      return;
    }
    await signOut({ redirectUrl: '/' });
  }, [signOut, navigate]);

  return (
    <UserContext.Provider
      value={{ user, loading, isGuest: !!user?.isGuest, logout, loginAsGuest, reload: async () => {}, setUser: () => {} }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useAppUser = () => useContext(UserContext);

export default UserContext;
