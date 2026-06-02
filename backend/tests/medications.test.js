'use strict';

const { startDb, stopDb, clearDb, makeApp, registerAndLogin, request } = require('./utils');

let app;

beforeAll(async () => {
  await startDb();
  app = makeApp();
});
afterAll(stopDb);
afterEach(clearDb);

const sampleMed = { name: 'Vitamin D', time: '08:00', dosage: '1 tablet', tillDate: '2099-01-01' };

describe('Medications CRUD', () => {
  test('requires authentication', async () => {
    const res = await request(app).get('/api/medications');
    expect(res.status).toBe(401);
  });

  test('creates, lists, updates, and deletes a medication', async () => {
    const { auth } = await registerAndLogin(app);

    const created = await auth(request(app).post('/api/medications').send(sampleMed));
    expect(created.status).toBe(200);
    expect(created.body.name).toBe('Vitamin D');
    const id = created.body._id;

    const listed = await auth(request(app).get('/api/medications'));
    expect(listed.body).toHaveLength(1);

    const updated = await auth(
      request(app).put(`/api/medications/${id}`).send({ ...sampleMed, dosage: '2 tablets' })
    );
    expect(updated.body.dosage).toBe('2 tablets');

    const deleted = await auth(request(app).delete(`/api/medications/${id}`));
    expect(deleted.body.success).toBe(true);

    const empty = await auth(request(app).get('/api/medications'));
    expect(empty.body).toHaveLength(0);
  });

  test("a user cannot delete another user's medication", async () => {
    const alice = await registerAndLogin(app, {
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password1',
    });
    const created = await alice.auth(request(app).post('/api/medications').send(sampleMed));
    const id = created.body._id;

    const bob = await registerAndLogin(app, {
      name: 'Bob',
      email: 'bob@example.com',
      password: 'password1',
    });
    const res = await bob.auth(request(app).delete(`/api/medications/${id}`));
    expect(res.status).toBe(404);
  });
});
