// index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK only once
admin.initializeApp();

// Export functions from other files
exports.updateUptime = require('./updateUptime').updateUptime;
exports.calculateUptime = require('./updateUptime').calculateUptime;
exports.restrictEmailDomain = require('./emailCheck').restrictEmailDomain;
exports.createUser = require('./createUser').createUser;
exports.deleteUser = require('./deleteUser').deleteUser;
exports.listUsers = require('./listUsers').listUsers;
