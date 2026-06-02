'use strict';

const { startDb, stopDb, makeApp, request } = require('./utils');

let app;

beforeAll(async () => {
  await startDb();
  app = makeApp();
});
afterAll(stopDb);

describe('Health & readiness probes', () => {
  test('GET /api/health reports ok + db state and never leaks the API key', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.aiConfigured).toBe('boolean');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.db.readyState).toBe(1);
    expect(res.body.db.status).toBe('connected');
    expect(JSON.stringify(res.body)).not.toMatch(/api[_-]?key/i);
  });

  test('GET /api/ready returns 200 when the database is connected', async () => {
    const res = await request(app).get('/api/ready');
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
    expect(res.body.db.readyState).toBe(1);
  });
});
