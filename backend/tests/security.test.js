'use strict';

const { startDb, stopDb, makeApp, request } = require('./utils');

let app;

beforeAll(async () => {
  await startDb();
  app = makeApp();
});
afterAll(stopDb);

describe('Security: legacy debug endpoints are removed', () => {
  test('GET /api/users no longer exists', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(404);
  });

  test('GET /api/users/:id no longer exists', async () => {
    const res = await request(app).get('/api/users/64b7f0000000000000000000');
    expect(res.status).toBe(404);
  });

  test('GET /api/db-info no longer exists', async () => {
    const res = await request(app).get('/api/db-info');
    expect(res.status).toBe(404);
  });

  test('GET /api/health works and never leaks the API key', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.aiConfigured).toBe('boolean');
    expect(JSON.stringify(res.body)).not.toMatch(/api[_-]?key/i);
  });
});
