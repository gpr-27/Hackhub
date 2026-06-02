'use strict';

const { getAuth } = require('@clerk/express');
const { GuestUser } = require('../models');
const logger = require('../config/logger');

// Resolves the authenticated Clerk user id from the request (verified by
// clerkMiddleware, mounted in app.js). Returns null if there is no Clerk session.
const resolveClerkUserId = (req) => {
  try {
    const auth = getAuth(req);
    return auth && auth.userId ? auth.userId : null;
  } catch (err) {
    logger.error('[auth] failed to read Clerk session:', err.message);
    return null;
  }
};

// Route guard. Accepts EITHER a Clerk session OR an anonymous guest session.
// Guests are identified by an `x-guest-id` header validated against a GuestUser
// record; each authenticated guest request bumps lastActiveAt (resets the TTL).
// In both cases req.user carries the owner id under `_id` and `id` so existing
// data-ownership checks work unchanged; `isGuest` distinguishes the two.
const authenticateUser = async (req, res, next) => {
  // 1) Clerk session takes precedence (so an upgrading guest is treated as the
  //    real account even if a stale x-guest-id header is still present).
  const clerkId = resolveClerkUserId(req);
  if (clerkId) {
    req.user = { _id: clerkId, id: clerkId, isGuest: false };
    return next();
  }

  // 2) Anonymous guest session.
  const guestId = req.headers['x-guest-id'];
  if (guestId && /^guest_/.test(guestId)) {
    try {
      const guest = await GuestUser.findOneAndUpdate(
        { guestId },
        { $set: { lastActiveAt: new Date() } }
      );
      if (guest) {
        req.user = { _id: guestId, id: guestId, isGuest: true };
        return next();
      }
    } catch (err) {
      logger.error('[auth] guest lookup failed:', err.message);
    }
  }

  logger.warn(`[auth] unauthenticated request to ${req.method} ${req.originalUrl}`);
  return res.status(401).json({ error: 'Not authenticated' });
};

module.exports = { authenticateUser, resolveClerkUserId };
