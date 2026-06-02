'use strict';

// Manual Jest mock for @clerk/express. Jest auto-applies mocks placed in a
// __mocks__ folder adjacent to node_modules for node_modules packages, so the
// test suite never needs a real Clerk session or live keys. This file is used
// ONLY under Jest — production code always loads the real @clerk/express.
//
// Authentication is simulated via an `x-test-user` request header: when present,
// getAuth() reports that user id as signed in; otherwise the request is anonymous.
module.exports = {
  clerkMiddleware: () => (req, res, next) => next(),
  getAuth: (req) => ({
    userId: (req && req.headers && req.headers['x-test-user']) || null,
  }),
  requireAuth: () => (req, res, next) => next(),
};
