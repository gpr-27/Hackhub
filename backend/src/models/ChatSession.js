'use strict';

const mongoose = require('mongoose');

// A single message within a chat session (embedded — no separate collection).
const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ['user', 'bot'], required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

// A saved conversation ("saved chat"). Title is a short summary of the first
// user message. Messages are embedded so the whole conversation loads, saves,
// renames and deletes as one document.
const chatSessionSchema = new mongoose.Schema({
  // Owner's Clerk user id. Identity is managed by Clerk.
  userId: { type: String, required: true, index: true },
  title: { type: String, default: 'New chat' },
  messages: { type: [messageSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
