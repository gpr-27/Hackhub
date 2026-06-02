'use strict';

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
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
    // 'x-guest-id' is required: anonymous guests authenticate with it
    // (middleware/auth.js). Omitting it preflight-blocks every cross-origin
    // guest request in production.
    allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-id'],
  };
};

// Builds the Express application. Identity/sessions are managed by Clerk:
// clerkMiddleware attaches the verified auth context to each request, and
// route guards (middleware/auth.js) read it via getAuth().
const createApp = () => {
  const app = express();

  // Don't advertise the framework.
  app.disable('x-powered-by');

  // Behind a reverse proxy / load balancer in production: trust the configured
  // number of proxy hops so req.ip and req.protocol reflect the real client (and
  // the rate-limiter keys correctly). A numeric value — never `true` — is
  // required; a permissive `trust proxy: true` lets clients spoof their IP and
  // is rejected by express-rate-limit.
  app.set('trust proxy', config.trustProxy);

  // Security headers. CSP and COEP are disabled here because this process is a
  // JSON API that serves no HTML; the frontend's nginx sets CSP for the SPA.
  // CORP is set to cross-origin so the API can be consumed from another origin.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // gzip responses.
  app.use(compression());

  // HTTP access logs. Skipped under test to keep the jest output clean.
  if (!config.isTest) {
    app.use(morgan(config.isProduction ? 'combined' : 'dev'));
  }

  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: config.bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: config.bodyLimit }));

  app.use(
    clerkMiddleware({
      secretKey: config.clerk.secretKey,
      publishableKey: config.clerk.publishableKey,
    })
  );

  // Basic abuse protection for the API. Skipped under test so a suite's
  // sequential supertest requests never trip the limiter.
  app.use(
    '/api',
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      skip: () => config.isTest,
    })
  );

  app.use('/api', apiRoutes);

  // Single-origin deploy: when a built frontend is present (config.staticDir,
  // set by the Docker image), this same process serves the SPA — its hashed
  // assets plus an index.html history fallback for client-side routes — so the
  // whole app runs on one origin with no CORS. API-only setups (local dev, the
  // test suite) leave STATIC_DIR unset and skip this block entirely.
  if (config.staticDir) {
    const indexHtml = path.join(config.staticDir, 'index.html');
    // index:false so '/' is handled by the SPA fallback below (never cached),
    // while the content-hashed /assets files keep a long cache.
    app.use(express.static(config.staticDir, { index: false, maxAge: '1h' }));
    app.get('*', (req, res, next) => {
      // Unknown /api/* paths must still 404 as JSON, not return the SPA shell.
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(indexHtml, (err) => (err ? next(err) : undefined));
    });
  }

  app.use((req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
      return res.status(403).json({ error: 'CORS: origin not allowed' });
    }
    logger.error('[error]', err.stack || err.message);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
};

module.exports = { createApp, buildCorsOptions };
