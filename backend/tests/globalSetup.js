'use strict';

// Starts a single in-memory MongoDB shared by every test suite. Spinning up one
// server (instead of one per file) is faster and avoids start/stop contention.
const { MongoMemoryServer } = require('mongodb-memory-server');

// The library's default launch timeout is 10s, but a cold WiredTiger start on a
// slow disk or a fresh CI runner can exceed that and flake. Allow CI/slow hosts
// to raise it via MONGOMS_LAUNCH_TIMEOUT_MS; default to a generous 60s.
const LAUNCH_TIMEOUT_MS = Number(process.env.MONGOMS_LAUNCH_TIMEOUT_MS) || 60000;

module.exports = async () => {
  const mongod = await MongoMemoryServer.create({ instance: { launchTimeout: LAUNCH_TIMEOUT_MS } });
  global.__MONGOD__ = mongod;
  process.env.MONGO_URI = mongod.getUri();
};
