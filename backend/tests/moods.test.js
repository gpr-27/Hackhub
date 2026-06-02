'use strict';

const { startDb, stopDb, clearDb, makeApp, registerAndLogin, request } = require('./utils');

let app;

beforeAll(async () => {
  await startDb();
  app = makeApp();
});
afterAll(stopDb);
afterEach(clearDb);

describe('Mood entries', () => {
  test('rejects out-of-range mood values', async () => {
    const { auth } = await registerAndLogin(app);
    const res = await auth(
      request(app).post('/api/moods').send({ mood: 99, intensity: 5, date: '2026-05-30' })
    );
    expect(res.status).toBe(400);
  });

  test('requires mood, intensity, and date', async () => {
    const { auth } = await registerAndLogin(app);
    const res = await auth(request(app).post('/api/moods').send({ mood: 5 }));
    expect(res.status).toBe(400);
  });

  test('creates and lists a valid mood entry', async () => {
    const { auth } = await registerAndLogin(app);
    const created = await auth(
      request(app).post('/api/moods').send({
        mood: 8,
        intensity: 7,
        notes: 'Good day',
        emotionWords: ['grateful'],
        date: '2026-05-30',
      })
    );
    expect(created.status).toBe(200);
    expect(created.body.mood).toBe(8);

    const listed = await auth(request(app).get('/api/moods'));
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0].emotionWords).toContain('grateful');
  });
});
