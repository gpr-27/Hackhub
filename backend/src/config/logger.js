'use strict';

// Minimal leveled logger. Lives inside config/ so it may consume the validated
// config. Verbosity is controlled by LOG_LEVEL (validated in config/index.js):
// error < warn < info < debug. A higher level includes everything below it.
const config = require('./index');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const threshold = LEVELS[config.logLevel] ?? LEVELS.info;

/* eslint-disable no-console */
const emit = (level, method) => (...args) => {
  if (LEVELS[level] <= threshold) {
    console[method](`[${level}]`, ...args);
  }
};
/* eslint-enable no-console */

const logger = {
  error: emit('error', 'error'),
  warn: emit('warn', 'warn'),
  info: emit('info', 'log'),
  debug: emit('debug', 'log'),
};

module.exports = logger;
