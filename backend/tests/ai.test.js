'use strict';

const { startDb, stopDb, clearDb, makeApp, registerAndLogin, request } = require('./utils');
const config = require('../src/config/env');

let app;

beforeAll(async () => {
  await startDb();
  app = makeApp();
});
afterAll(stopDb);
afterEach(clearDb);

describe('AI chat endpoint', () => {
  test('requires authentication', async () => {
    const res = await request(app).post('/api/ai/chat').send({ message: 'hi' });
    expect(res.status).toBe(401);
  });

  test('returns a fallback reply when no API key is configured', async () => {
    const { auth } = await registerAndLogin(app);
    const res = await auth(
      request(app).post('/api/ai/chat').send({ message: 'I feel anxious', mode: 'therapy' })
    );
    expect(res.status).toBe(200);
    expect(typeof res.body.text).toBe('string');
    expect(res.body.text.length).toBeGreaterThan(0);
    expect(res.body.fallback).toBe(true);
  });

  test('validates mood requests', async () => {
    const { auth } = await registerAndLogin(app);
    const res = await auth(request(app).post('/api/ai/chat').send({ mode: 'mood' }));
    expect(res.status).toBe(400);
  });

  test('calls the configured Groq API and returns the model text', async () => {
    const { auth } = await registerAndLogin(app);

    // Temporarily mark the AI as configured and stub the network call.
    const originalConfigured = config.groq.isConfigured;
    const originalKey = config.groq.apiKey;
    const originalFetch = global.fetch;
    config.groq.isConfigured = true;
    config.groq.apiKey = 'test-key-1234567890';
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Groq says hello' } }] }),
    }));

    try {
      const res = await auth(
        request(app).post('/api/ai/chat').send({ message: 'hello', mode: 'wellness' })
      );
      expect(res.status).toBe(200);
      expect(res.body.text).toBe('Groq says hello');
      expect(res.body.fallback).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url] = global.fetch.mock.calls[0];
      expect(url).toContain('/chat/completions');
    } finally {
      config.groq.isConfigured = originalConfigured;
      config.groq.apiKey = originalKey;
      global.fetch = originalFetch;
    }
  });
});
