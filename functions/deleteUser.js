// deleteUser.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Function to delete a user
exports.deleteUser = functions.https.onCall(async (data, context) => {
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
      'Only admins can delete users.'
    );
  }

  const { uid: targetUid } = data;

  if (!targetUid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Target UID is required.'
    );
  }

  try {
    // Delete the user
    await admin.auth().deleteUser(targetUid);

    // Optionally, remove user data from database
    // For example:
    // await admin.database().ref(`/users/${targetUid}`).remove();

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error deleting user.'
    );
  }
});
