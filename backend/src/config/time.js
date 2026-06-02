'use strict';

// The app records timestamps in IST (UTC+5:30) to match the original behaviour.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const istNow = () => new Date(Date.now() + IST_OFFSET_MS);

module.exports = { istNow };
