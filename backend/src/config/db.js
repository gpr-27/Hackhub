'use strict';

const mongoose = require('mongoose');
const config = require('./index');
const logger = require('./logger');

// Connects mongoose to MongoDB. SSL/TLS is only enabled for Atlas (mongodb+srv)
// connection strings; local/in-memory instances connect plainly.
const connectDatabase = async (uri = config.mongoUri) => {
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Add your MongoDB connection string to backend/.env, ' +
        'or run "npm run dev:memory" to start with an in-memory database.'
    );
  }

  const isAtlas = uri.includes('mongodb+srv');
  logger.info(`[db] connecting to MongoDB (${isAtlas ? 'Atlas' : 'standard'})`);
  await mongoose.connect(uri, {
    ssl: isAtlas,
    tls: isAtlas,
  });
  logger.debug('[db] connection established');

  return mongoose.connection;
};

const disconnectDatabase = async () => {
  await mongoose.disconnect();
};

module.exports = { connectDatabase, disconnectDatabase };
