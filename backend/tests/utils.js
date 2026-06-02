'use strict';

const mongoose = require('mongoose');
const request = require('supertest');
const { createApp } = require('../src/app');

// Connects to the shared in-memory MongoDB started in tests/globalSetup.js.
const startDb = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await clearDb();
};

const stopDb = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};

const clearDb = async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
};

const makeApp = () => createApp();

// Identity is managed by Clerk; @clerk/express is auto-mocked in tests (see
// backend/__mocks__) and reads the signed-in user from the `x-test-user` header.
// This helper returns an auth() that sets that header, deriving a STABLE,
// DISTINCT user id from the supplied creds (so cross-user ownership tests work).
const registerAndLogin = async (app, creds = {}) => {
  const userId = creds.userId || (creds.email ? `user_${creds.email}` : 'test-user-1');
  return {
    token: 'test-clerk-token',
    user: { id: userId, ...creds },
    auth: (req) => req.set('x-test-user', userId),
  };
};

module.exports = { startDb, stopDb, clearDb, makeApp, registerAndLogin, request };
