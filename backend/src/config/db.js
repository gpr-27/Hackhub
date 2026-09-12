'use strict';

const mongoose = require('mongoose');
const config = require('./index');
const logger = require('./logger');

let retryTimer = null;
let isConnecting = false;

// Connects mongoose to MongoDB. SSL/TLS is only enabled for Atlas (mongodb+srv)
// connection strings; local/in-memory instances connect plainly.
const connectDatabase = async (uri = config.mongoUri) => {
  if (!uri) {
    logger.warn(
      '[db] MONGODB_URI is not set. Add your MongoDB connection string to backend/.env, ' +
        'or run "npm run dev:memory" to start with an in-memory database.'
    );
    return null;
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnecting) {
    return null;
  }

  isConnecting = true;
  const isAtlas = uri.includes('mongodb+srv');
  logger.info(`[db] connecting to MongoDB (${isAtlas ? 'Atlas' : 'standard'})`);

  try {
    await mongoose.connect(uri, {
      ssl: isAtlas,
      tls: isAtlas,
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('[db] connection established ✓');
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    return mongoose.connection;
  } catch (err) {
    logger.error(`[db] MongoDB connection error: ${err.message}`);
    if (!config.isTest && !retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        if (mongoose.connection.readyState !== 1) {
          logger.info('[db] retrying MongoDB connection in background...');
          connectDatabase(uri).catch(() => {});
        }
      }, 10000);
      if (retryTimer.unref) retryTimer.unref();
    }
    throw err;
  } finally {
    isConnecting = false;
  }
};

const disconnectDatabase = async () => {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  await mongoose.disconnect();
};

module.exports = { connectDatabase, disconnectDatabase };
