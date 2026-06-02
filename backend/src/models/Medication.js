'use strict';

const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  name: String,
  time: String,
  dosage: String,
  tillDate: String,
  // Owner's Clerk user id (e.g. "user_xxx"). Identity is managed by Clerk.
  userId: {
    type: String,
    required: true,
    index: true,
  },
});

module.exports = mongoose.model('Medication', medicationSchema);
