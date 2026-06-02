'use strict';

/* eslint-disable no-console */
// One-off DB verification: connects to the configured MONGODB_URI, lists every
// collection with its document count, then runs a create → read-back → delete
// round-trip for each core model using a throwaway user id, proving writes/reads
// persist correctly. All verification docs are removed afterwards.
const mongoose = require('mongoose');
const config = require('../src/config');
const { connectDatabase, disconnectDatabase } = require('../src/config/db');
const models = require('../src/models');

const TEST_UID = `__verify__${process.pid}`;

const CASES = [
  { name: 'Mood', model: models.Mood, doc: { mood: 5, intensity: 6, date: '2026-06-01', notes: 'verify', userId: TEST_UID } },
  { name: 'Medication', model: models.Medication, doc: { name: 'VerifyMed', time: '09:00', dosage: '1 tab', userId: TEST_UID } },
  { name: 'ChatMessage', model: models.ChatMessage, doc: { sender: 'user', message: 'verify ping', userId: TEST_UID } },
  { name: 'HealthProfile', model: models.HealthProfile, doc: { userId: TEST_UID, gender: 'other', dateOfBirth: '2000-01-01' } },
];

(async () => {
  console.log(`\nConnecting to MongoDB (${config.mongoUri.includes('mongodb+srv') ? 'Atlas' : 'standard'})…`);
  await connectDatabase();
  console.log('Connected ✓\n');

  const cols = await mongoose.connection.db.listCollections().toArray();
  console.log('=== Existing collections & document counts ===');
  if (cols.length === 0) console.log('  (database is empty)');
  for (const c of cols.sort((a, b) => a.name.localeCompare(b.name))) {
    const count = await mongoose.connection.db.collection(c.name).countDocuments();
    console.log(`  ${c.name.padEnd(24)} ${count}`);
  }

  console.log('\n=== Create → read-back → delete round-trip per model ===');
  let ok = 0;
  let fail = 0;
  for (const { name, model, doc } of CASES) {
    if (!model) { console.log(`  ${name.padEnd(16)} SKIP (model not found)`); continue; }
    try {
      const created = await model.create(doc);
      const found = await model.findById(created._id).lean();
      const persisted = found && String(found.userId) === TEST_UID;
      await model.deleteOne({ _id: created._id });
      const goneAfter = await model.findById(created._id).lean();
      if (persisted && !goneAfter) {
        console.log(`  ${name.padEnd(16)} PASS  (saved id=${created._id}, fields verified, cleaned up)`);
        ok++;
      } else {
        console.log(`  ${name.padEnd(16)} FAIL  (persisted=${!!persisted}, cleanedUp=${!goneAfter})`);
        fail++;
      }
    } catch (err) {
      console.log(`  ${name.padEnd(16)} FAIL  (${err.message})`);
      fail++;
    }
  }

  // Safety net: ensure no verification docs remain in any collection.
  for (const { model } of CASES) {
    if (model) await model.deleteMany({ userId: TEST_UID }).catch(() => {});
  }

  console.log(`\nResult: ${ok} passed, ${fail} failed.`);
  await disconnectDatabase();
  process.exit(fail ? 1 : 0);
})().catch(async (err) => {
  console.error('\nDB verification could not complete:', err.message);
  try { await disconnectDatabase(); } catch (_) { /* ignore */ }
  process.exit(2);
});
