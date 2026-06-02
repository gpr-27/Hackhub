// Auth display helpers. Identity/session is managed by Clerk (@clerk/react):
// components read the user via Clerk hooks (useUser/useAuth) and the central
// useAppUser() wrapper. This module keeps only framework-agnostic UI helpers.

// Friendly initials for an avatar fallback, e.g. "Ada Lovelace" -> "AL".
export const initialsOf = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '🙂';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default initialsOf;
