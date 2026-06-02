'use strict';

const mongoose = require('mongoose');

// An anonymous guest identity. The guest's actual data (moods, chats,
// medications, health records) lives in those collections keyed by userId ===
// guestId, exactly like a Clerk user. This record only tracks identity +
// activity so inactive guests can be auto-pruned.
const guestUserSchema = new mongoose.Schema({
  guestId: { type: String, required: true, unique: true, index: true },
  isGuest: { type: Boolean, default: true },
  displayName: { type: String, default: 'Guest User' },
  createdAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
});

// TTL: MongoDB deletes a guest 30 days after its last activity. lastActiveAt is
// bumped on every authenticated request (see middleware/auth.js), so active
// guests are never pruned.
guestUserSchema.index({ lastActiveAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('GuestUser', guestUserSchema);
