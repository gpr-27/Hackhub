'use strict';

// Single import point for every mongoose model. Clerk users and anonymous guest
// users both reference their data by a String userId (Clerk id or guestId).
const Medication = require('./Medication');
const Mood = require('./Mood');
const ChatSession = require('./ChatSession');
const GuestUser = require('./GuestUser');
const healthRecords = require('./healthRecords');

module.exports = {
  Medication,
  Mood,
  ChatSession,
  GuestUser,
  ...healthRecords,
};
