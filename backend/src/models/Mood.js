'use strict';

const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema({
  mood: { type: Number, required: true, min: 1, max: 10 },
  intensity: { type: Number, required: true, min: 1, max: 10 },
  notes: { type: String, default: '' },
  emotionWords: { type: [String], default: [] },
  aiInsights: { type: String, default: '' },
  date: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  entryNumber: { type: Number, default: 1 },
  // Owner's Clerk user id (e.g. "user_xxx"). Identity is managed by Clerk.
  userId: {
    type: String,
    required: true,
    index: true,
  },
});

module.exports = mongoose.model('Mood', moodSchema);
