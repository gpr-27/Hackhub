'use strict';

// Starts a single in-memory MongoDB shared by every test suite. Spinning up one
// server (instead of one per file) is faster and avoids start/stop contention.
const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  global.__MONGOD__ = mongod;
  process.env.MONGO_URI = mongod.getUri();
};
