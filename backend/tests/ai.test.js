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

  describe('model fallback', () => {
    const originalConfigured = config.groq.isConfigured;
    const originalKey = config.groq.apiKey;
    const originalFetch = global.fetch;

    beforeEach(() => {
      config.groq.isConfigured = true;
      config.groq.apiKey = 'test-key-1234567890';
    });
    afterEach(() => {
      config.groq.isConfigured = originalConfigured;
      config.groq.apiKey = originalKey;
      global.fetch = originalFetch;
    });

    const ok = (content) => ({ ok: true, json: async () => ({ choices: [{ message: { content } }] }) });
    const fail = (status) => ({ ok: false, status, text: async () => 'boom' });
    const modelsCalled = () => global.fetch.mock.calls.map(([, init]) => JSON.parse(init.body).model);
    const chat = async (body = {}) => {
      const { auth } = await registerAndLogin(app);
      return auth(request(app).post('/api/ai/chat').send({ message: 'hello', mode: 'therapy', ...body }));
    };

    test('uses DEFAULT_MODEL first and does not touch the fallback when it succeeds', async () => {
      global.fetch = jest.fn(async () => ok('primary reply'));
      const res = await chat();
      expect(res.body).toMatchObject({ text: 'primary reply', fallback: false, model: 'test-model-a' });
      expect(modelsCalled()).toEqual(['test-model-a']);
    });

    test('retries on FALLBACK_MODEL when the primary model errors', async () => {
      global.fetch = jest.fn(async (_url, init) =>
        JSON.parse(init.body).model === 'test-model-a' ? fail(429) : ok('fallback model reply')
      );
      const res = await chat();
      expect(res.body).toMatchObject({ text: 'fallback model reply', fallback: false, model: 'test-model-b' });
      expect(modelsCalled()).toEqual(['test-model-a', 'test-model-b']);
    });

    test('treats an empty reply as a failure and moves to the fallback model', async () => {
      global.fetch = jest.fn(async (_url, init) =>
        JSON.parse(init.body).model === 'test-model-a' ? ok('   ') : ok('second try')
      );
      const res = await chat();
      expect(res.body).toMatchObject({ text: 'second try', model: 'test-model-b' });
    });

    test('falls back to DEFAULT_MODEL when the user selected the fallback model', async () => {
      global.fetch = jest.fn(async (_url, init) =>
        JSON.parse(init.body).model === 'test-model-b' ? fail(503) : ok('default saved it')
      );
      const res = await chat({ model: 'test-model-b' });
      expect(res.body).toMatchObject({ text: 'default saved it', model: 'test-model-a' });
      expect(modelsCalled()).toEqual(['test-model-b', 'test-model-a']);
    });

    test('returns the canned reply only after every model has failed', async () => {
      global.fetch = jest.fn(async () => fail(500));
      const res = await chat();
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ fallback: true, model: null });
      expect(modelsCalled()).toEqual(['test-model-a', 'test-model-b']);
    });
  });
});
