'use strict';

// Backend entry point: validate config, connect to MongoDB, build the app and
// start listening. Requiring ./src/config validates the environment and throws
// (printing a clear ❌ report) if anything required is missing — fail fast.
const config = require('./src/config');
const logger = require('./src/config/logger');
const { connectDatabase } = require('./src/config/db');
const { createApp } = require('./src/app');

const start = async () => {
  logger.info(`[startup] booting backend (env: ${config.nodeEnv})`);
  await connectDatabase();

  const app = createApp();
  return new Promise((resolve) => {
    const server = app.listen(config.port, () => {
      config.logStartupConfig({ dbConnected: true });
      logger.info(`[startup] server listening on port ${config.port}`);
      if (!config.groq.isConfigured) {
        logger.warn('[startup] GROQ_API_KEY not configured — AI replies use built-in fallbacks.');
      }
      resolve(server);
    });
  });
};

if (require.main === module) {
  start().catch((err) => {
    logger.error('[startup] failed to start backend:', err.message);
    process.exit(1);
  });
}

module.exports = { start };
