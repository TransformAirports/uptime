// createUser.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Function to create a new user
exports.createUser = functions.https.onCall(async (data, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Request had invalid credentials.'
    );
  }

  const uid = context.auth.uid;

  // Check if requester is an admin
  const adminSnapshot = await admin.database().ref(`/admins/${uid}`).once('value');
  if (!adminSnapshot.exists()) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can create new users.'
    );
  }

  const { email, password } = data;

  // Enforce email domain restriction
  const emailDomain = email.substring(email.lastIndexOf('@') + 1).toLowerCase();
  if (emailDomain !== 'mwaa.com') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Email domain must be mwaa.com.'
    );
  }

  try {
    // Create the user
    const userRecord = await admin.auth().createUser({ email, password });

    // Optionally, send a welcome email using Postmark
    // Note: Ensure postmarkClient is initialized and configured

    /*
    const postmark = require('postmark');
    const postmarkApiKey = functions.config().postmark.api_key;
    const postmarkClient = new postmark.ServerClient(postmarkApiKey);

    await postmarkClient.sendEmail({
      From: 'StratOps Uptime <uptime@transformairports.com>',
      To: email,
      Subject: 'Welcome to EEMW Uptime Dashboard',
      TextBody: `Hello,

    Your account has been created by an administrator.

    Best regards,
    StratOps Uptime Team`,
    });
    */

    return { uid: userRecord.uid };
  } catch (error) {
    console.error('Error creating new user:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error creating new user.'
    );
  }
});
