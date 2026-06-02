'use strict';

/* eslint-disable no-console */
// End-to-end check: boots the REAL Express app against the REAL Atlas DB and
// drives it over HTTP via supertest. Clerk verification is stubbed (exactly like
// the Jest suite) so we can authenticate as a throwaway user — this exercises the
// full HTTP → route → mongoose → Atlas path. AI is forced into fallback mode so
// no real provider call is made. All test data is cleaned up afterwards.

// Force AI fallback (deterministic, no external call) before config loads.
process.env.GROQ_API_KEY = '';

// Stub @clerk/express by injecting a fake module into require.cache BEFORE the
// app (and its auth middleware) require it. The real package has getter-only
// exports, so we replace the whole module rather than reassigning properties.
const clerkPath = require.resolve('@clerk/express');
require.cache[clerkPath] = {
  id: clerkPath,
  filename: clerkPath,
  loaded: true,
  exports: {
    clerkMiddleware: () => (req, res, next) => next(),
    getAuth: (req) => ({ userId: (req.headers && req.headers['x-test-user']) || null }),
    requireAuth: () => (req, res, next) => next(),
  },
};

const request = require('supertest');
const { connectDatabase, disconnectDatabase } = require('../src/config/db');
const { createApp } = require('../src/app');
const models = require('../src/models');

const UID = `__e2e__${process.pid}`;
const authd = (r) => r.set('x-test-user', UID);
const results = [];
const check = (name, ok, extra = '') => {
  results.push(ok);
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? `  (${extra})` : ''}`);
};

(async () => {
  await connectDatabase();
  const app = createApp();
  console.log('\n=== End-to-end HTTP → Atlas ===');

  let r = await request(app).get('/api/health');
  check('GET /api/health (public) → 200', r.status === 200 && r.body.status === 'ok');

  r = await request(app).get('/api/ai/models');
  check('GET /api/ai/models (public) → model list', r.status === 200 && Array.isArray(r.body.models) && r.body.models.length > 0, `${r.body.models?.length} models`);

  r = await request(app).get('/api/moods');
  check('GET /api/moods without auth → 401', r.status === 401);

  r = await authd(request(app).post('/api/moods').send({ mood: 7, intensity: 5, date: '2026-06-01', notes: 'e2e' }));
  const moodId = r.body && r.body._id;
  check('POST /api/moods (authed) → saved to Atlas', r.status === 200 && !!moodId, `id=${moodId}`);

  r = await authd(request(app).get('/api/moods'));
  check('GET /api/moods → returns saved entry', r.status === 200 && r.body.some((m) => m._id === moodId));

  r = await authd(request(app).post('/api/medications').send({ name: 'E2E Med', time: '08:00', dosage: '1 tab' }));
  const medId = r.body && r.body._id;
  check('POST /api/medications (authed) → saved', r.status === 200 && !!medId, `id=${medId}`);

  r = await authd(request(app).post('/api/chat/sessions').send({}));
  const sid = r.body && r.body._id;
  check('POST /api/chat/sessions (authed) → created', r.status === 200 && !!sid, `id=${sid}`);

  r = await authd(request(app).put(`/api/chat/sessions/${sid}`).send({
    autoTitle: true,
    messages: [{ sender: 'user', message: 'e2e hello there' }, { sender: 'bot', message: 'hi' }],
  }));
  check('PUT /api/chat/sessions/:id → messages saved + auto-title', r.status === 200 && r.body.messages.length === 2 && r.body.title !== 'New chat', `title="${r.body.title}"`);

  r = await authd(request(app).get('/api/chat/sessions'));
  check('GET /api/chat/sessions → lists saved chat', r.status === 200 && r.body.some((s) => s._id === sid));

  r = await authd(request(app).delete(`/api/chat/sessions/${sid}`));
  check('DELETE /api/chat/sessions/:id → removed', r.status === 200);

  r = await authd(request(app).post('/api/ai/chat').send({ message: 'I feel anxious', mode: 'therapy' }));
  check('POST /api/ai/chat (authed) → reply text', r.status === 200 && typeof r.body.text === 'string' && r.body.text.length > 0);

  r = await authd(request(app).post('/api/health-profile').send({ gender: 'other', dateOfBirth: '2000-01-01' }));
  check('POST /api/health-profile (authed) → upserted', r.status === 200, `status=${r.status}`);

  r = await request(app).delete(`/api/moods/${moodId}`).set('x-test-user', `${UID}_other`);
  check("DELETE another user's mood → 404 (ownership enforced)", r.status === 404);

  // --- Guest flow ---
  r = await request(app).post('/api/guest').send({});
  const guestId = r.body && r.body.guestId;
  check('POST /api/guest → creates anonymous guest', r.status === 200 && /^guest_/.test(guestId || ''), guestId);

  r = await request(app).post('/api/moods').set('x-guest-id', guestId).send({ mood: 6, intensity: 5, date: '2026-06-02', notes: 'guest' });
  const guestMoodId = r.body && r.body._id;
  check('guest (x-guest-id) POST /api/moods → saved to Atlas', r.status === 200 && !!guestMoodId);

  r = await request(app).get('/api/moods').set('x-guest-id', guestId);
  check('guest GET /api/moods → returns own entry', r.status === 200 && r.body.some((m) => m._id === guestMoodId));

  r = await request(app).post('/api/moods').send({ mood: 5, intensity: 5, date: '2026-06-02' });
  check('guest data NOT accessible without the guest id → 401', r.status === 401);

  r = await request(app).get(`/api/guest/${guestId}`);
  check('GET /api/guest/:id → restores guest session', r.status === 200 && r.body.guestId === guestId);

  r = await authd(request(app).post('/api/guest/migrate').send({ guestId }));
  check('POST /api/guest/migrate → migrates guest data to Clerk user', r.status === 200 && r.body.success === true);

  r = await authd(request(app).get('/api/moods'));
  check('migrated mood now belongs to the Clerk user', r.status === 200 && r.body.some((m) => m._id === guestMoodId));

  r = await request(app).get(`/api/guest/${guestId}`);
  check('guest record removed after migration → 404', r.status === 404);

  // Cleanup every collection touched.
  await Promise.all([
    models.Mood.deleteMany({ userId: UID }),
    models.Medication.deleteMany({ userId: UID }),
    models.ChatSession.deleteMany({ userId: UID }),
    models.HealthProfile.deleteMany({ userId: UID }),
    models.GuestUser.deleteMany({ guestId }).catch(() => {}),
  ]);
  console.log('  (cleaned up all __e2e__ documents)');

  const failed = results.filter((x) => !x).length;
  console.log(`\nE2E result: ${results.length - failed} passed, ${failed} failed.`);
  await disconnectDatabase();
  process.exit(failed ? 1 : 0);
})().catch(async (err) => {
  console.error('\nE2E could not complete:', err.message);
  try { await disconnectDatabase(); } catch (_) { /* ignore */ }
  process.exit(2);
});
