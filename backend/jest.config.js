'use strict';

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  // Neutralise the Groq key before any module loads so tests use AI fallbacks
  // (deterministic, no live API calls) regardless of the developer's .env.
  setupFiles: ['<rootDir>/tests/setEnv.js'],
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  // First run may download the in-memory MongoDB binary.
  testTimeout: 120000,
};
