'use strict';

const express = require('express');
const cors = require('cors');
const { clerkMiddleware } = require('@clerk/express');
const config = require('./config');
const logger = require('./config/logger');
const apiRoutes = require('./routes');

// CORS is fully env-driven (see config.clientUrl / corsOrigins /
// corsAllowedOriginSuffixes). No origin, port or deployment domain is hardcoded.
const buildCorsOptions = () => {
  const allowed = new Set([config.clientUrl, ...config.corsOrigins].filter(Boolean));
  const suffixes = config.corsAllowedOriginSuffixes;

  logger.info(
    `[cors] allowed origins: ${[...allowed].join(', ') || '(none)'}` +
      (suffixes.length ? ` | wildcard suffixes: ${suffixes.join(', ')}` : '')
  );

  return {
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true); // curl/mobile/same-origin
      }
      if (allowed.has(origin) || suffixes.some((suffix) => origin.endsWith(suffix))) {
        return callback(null, true);
      }
      logger.warn(`[cors] blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
};

// Builds the Express application. Identity/sessions are managed by Clerk:
// clerkMiddleware attaches the verified auth context to each request, and
// route guards (middleware/auth.js) read it via getAuth().
const createApp = () => {
  const app = express();

  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use(
    clerkMiddleware({
      secretKey: config.clerk.secretKey,
      publishableKey: config.clerk.publishableKey,
    })
  );

  app.use('/api', apiRoutes);

  app.use((req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
      return res.status(403).json({ error: 'CORS: origin not allowed' });
    }
    logger.error('[error]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
};

module.exports = { createApp, buildCorsOptions };
