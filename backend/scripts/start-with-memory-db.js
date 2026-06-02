'use strict';

// Starts the backend against a throwaway in-memory MongoDB. Useful for running
// the full app locally without a MongoDB Atlas account. Data does not persist.
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mem = await MongoMemoryServer.create();
  // Set before requiring the server so config picks up the in-memory URI.
  // dotenv does not override an already-set variable, so this wins over .env.
  process.env.MONGODB_URI = mem.getUri('healthcareDB');
  console.log('Started in-memory MongoDB for local development.');

  // Require after setting the env var so config picks up the in-memory URI.
  const { start } = require('../server');
  await start();

  const shutdown = async () => {
    await mem.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})().catch((err) => {
  console.error('Failed to start with in-memory database:', err);
  process.exit(1);
});
