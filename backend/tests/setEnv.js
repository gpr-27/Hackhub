'use strict';

// Runs in each worker BEFORE any module (incl. config/index) is required, so the
// centralized config validates against these values instead of the developer's
// .env. dotenv.config() never overrides an already-set variable, so everything
// here "sticks". The empty GROQ_API_KEY forces the AI layer into its offline
// "fallback" mode, keeping the suite deterministic and free of real API calls.
// @clerk/express is auto-mocked (see backend/__mocks__), so the Clerk keys below
// are placeholders that are never sent to Clerk.
const set = (key, value) => {
  if (process.env[key] === undefined) process.env[key] = value;
};

// Force test mode and an empty key (these must win over any local .env).
process.env.NODE_ENV = 'test';
process.env.GROQ_API_KEY = '';

// Provide every other required variable (placeholder values; not real models/
// hosts/keys). MONGODB_URI here is never dialed — tests connect to the shared
// in-memory MongoDB started in globalSetup.js via MONGO_URI.
set('PORT', '0');
set('CLIENT_URL', 'http://localhost:5173');
set('MONGODB_URI', 'mongodb://127.0.0.1:27017/aura-test');
set('CLERK_SECRET_KEY', 'sk_test_placeholder_value_for_tests');
set('CLERK_PUBLISHABLE_KEY', 'pk_test_placeholder_value_for_tests');
set('LOG_LEVEL', 'error');
set('LLM_PROVIDER', 'groq');
set('GROQ_BASE_URL', 'https://api.groq.com/openai/v1');
set('DEFAULT_MODEL', 'test-model-a');
set('AVAILABLE_MODELS', 'test-model-a:Test Model A,test-model-b:Test Model B');
