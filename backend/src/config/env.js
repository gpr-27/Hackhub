'use strict';

// Backwards-compatible alias for the canonical config module (./index).
// Existing modules and tests import '../config/env'; new code should prefer
// '../config'. Both resolve to the exact same singleton config object.
module.exports = require('./index');
