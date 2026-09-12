'use strict';

// Backend entry point: validate config, connect to MongoDB, build the app and
// start listening. Requiring ./src/config validates the environment and throws
// (printing a clear ❌ report) if anything required is missing — fail fast.
const config = require('./src/config');
const logger = require('./src/config/logger');
const { connectDatabase, disconnectDatabase } = require('./src/config/db');
const { createApp } = require('./src/app');

// Hard limit on graceful shutdown: stop accepting connections, drain in-flight
// requests and close the DB within this window, else force-exit. Keep it below
// the orchestrator's grace period (compose stop_grace_period / k8s
// terminationGracePeriodSeconds) so we exit cleanly before SIGKILL.
const SHUTDOWN_TIMEOUT_MS = 10000;

const start = async () => {
  logger.info(`[startup] booting backend (env: ${config.nodeEnv})`);

  const app = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(config.port, () => {
      config.logStartupConfig({ dbConnected: false });
      logger.info(`[startup] server listening on port ${config.port}`);
      if (!config.groq.isConfigured) {
        logger.warn('[startup] GROQ_API_KEY not configured — AI replies use built-in fallbacks.');
      }
      resolve(s);
    });
  });

  // Attempt database connection without blocking startup or crashing the server.
  // If unavailable at boot, background retries will continue connecting.
  connectDatabase()
    .then(() => {
      logger.info('[startup] database connected successfully');
    })
    .catch((err) => {
      logger.warn(
        `[startup] database initial connection failed: ${err.message}. Server is running; retrying in background...`
      );
    });

  return server;
};

// Wires process-level lifecycle handlers to an already-listening server. Called
// ONLY from the entry-point branch below — never when the app is imported by the
// test suite, so jest workers don't accumulate signal listeners across files.
const registerLifecycleHandlers = (server) => {
  let shuttingDown = false;

  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`[shutdown] received ${signal} — closing server`);

    const forceExit = setTimeout(() => {
      logger.error('[shutdown] timed out — forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    server.close(async () => {
      try {
        await disconnectDatabase();
        logger.info('[shutdown] closed cleanly');
        process.exit(0);
      } catch (err) {
        logger.error('[shutdown] error while closing:', err.message);
        process.exit(1);
      }
    });
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error('[fatal] unhandled promise rejection:', reason);
    shutdown('unhandledRejection');
  });
  process.on('uncaughtException', (err) => {
    logger.error('[fatal] uncaught exception:', err.stack || err.message);
    shutdown('uncaughtException');
  });

  return server;
};

if (require.main === module) {
  start()
    .then(registerLifecycleHandlers)
    .catch((err) => {
      logger.error('[startup] failed to start backend:', err.message);
      process.exit(1);
    });
}

module.exports = { start };
