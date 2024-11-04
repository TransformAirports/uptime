// listUsers.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Function to list users
exports.listUsers = functions.https.onCall(async (data, context) => {
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
      'Only admins can list users.'
    );
  }

  try {
    const listUsersResult = await admin.auth().listUsers(1000); // Adjust as needed

    const users = listUsersResult.users.map((userRecord) => ({
      uid: userRecord.uid,
      email: userRecord.email,
    }));

    return { users };
  } catch (error) {
    console.error('Error listing users:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error listing users.'
    );
  }
});
