// index.js

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK only once
admin.initializeApp();

// Export functions from other files
exports.uptime = require('./uptime').uptime;
exports.calculateUptime = require('./uptime').calculateUptime;
