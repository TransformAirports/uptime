// index.js

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK only once
admin.initializeApp();

// Export functions from other files
exports.updateUptime = require('./updateUptime').updateUptime;
exports.calculateUptime = require('./updateUptime').calculateUptime;
