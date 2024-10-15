// index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK only once
admin.initializeApp();

// Export functions from other files
exports.updateUptime = require('./updateUptime').updateUptime;
exports.calculateUptime = require('./updateUptime').calculateUptime; // Assuming calculateUptime is in updateUptime.js
exports.restrictEmailDomain = require('./emailCheck').restrictEmailDomain;
