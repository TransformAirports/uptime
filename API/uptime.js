// uptime.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const postmark = require('postmark');
const { DateTime } = require('luxon'); // Import Luxon for time zone management


// Define a 6-hour (21600 seconds) interval for email notifications
const EMAIL_INTERVAL_SECONDS = 21600;

/**
 * Sends an email notification using the Postmark Node.js SDK.
 * @param {string} deviceID - The ID of the device that went offline.
 * @param {string} type - The type of device (Elevator, Escalator, Moving Walkway).
 * @param {number} timestamp - The timestamp when the device went offline.
 * @param {string} apiKey - The API key identifying the Firestore collection containing recipient addresses.
 */
async function sendOutageEmail(deviceID, type, timestamp, apiKey) {
  try {
    // Retrieve Postmark API key from Firebase secret
    const postmarkApiKey = process.env.SECRET_POSTMARK_API;
    if (!postmarkApiKey) {
      console.error('Postmark API key not configured.');
      return;
    }

    // Create a Postmark client instance
    const postmarkClient = new postmark.ServerClient(postmarkApiKey);

    // Retrieve the list of alert email addresses from Firestore
    const emailsSnapshot = await admin.firestore().collection(apiKey).get();

    if (emailsSnapshot.empty) {
      console.log('No alert emails configured.');
      return;
    }

    // Join the email addresses into a comma-separated string
    const toEmails = emailsSnapshot.docs
      .map((doc) => doc.data().address)
      .filter(Boolean)
      .join(', ');

    if (!toEmails) {
      console.log('No valid email addresses found.');
      return;
    }

    // Convert timestamp to New York/EST time
    const estTime = DateTime.fromSeconds(timestamp).setZone('America/New_York').toLocaleString(DateTime.DATETIME_FULL);

    // Prepare the subject and body of the email
    const subject = `${type.charAt(0).toUpperCase() + type.slice(1)} Outage (${deviceID})`;
    const body = `${deviceID} was reported as being offline on ${estTime}.`;

    // Send the email using Postmark SDK
    await postmarkClient.sendEmail({
      From: 'Uptime <uptime@transformairports.com>',
      To: toEmails,
      Subject: subject,
      TextBody: body
    });

    console.log('Outage email sent for device:', deviceID);
  } catch (error) {
    console.error('Error sending outage email:', error);
  }
}

// Function to update device uptime
const uptime = functions
  .runWith({ secrets: ['SECRET_API_KEY', 'SECRET_POSTMARK_API'] })
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const { api_key, deviceID, type, power, alarm, device_name } = req.body;

    // Validate API key
    if (!api_key) {
      return res.status(400).send('Missing api_key');
    }

    if (api_key !== process.env.SECRET_API_KEY) {
      return res.status(401).send('Invalid API key');
    }

    // Validate the request body
    if (
      !deviceID ||
      !type ||
      typeof power !== 'boolean' ||
      typeof alarm !== 'boolean' ||
      typeof device_name !== 'string' ||
      device_name.trim() === ''
    ) {
      return res.status(400).send('Missing or incorrect required parameters');
    }

  const deviceRef = admin.database().ref(`/devices/${type}/${deviceID}`);
  const emailLogRef = admin.database().ref(`/emailLogs/${type}/${deviceID}`);

  try {
    // Get the current data of the device from Firebase
    const snapshot = await deviceRef.once('value');
    const currentData = snapshot.val();

    // Get the current timestamp in seconds
    const now = Math.floor(Date.now() / 1000);
    let updates = {
      last_statuscheck_timestamp: now,
      device_name,
    };

    let triggerEmail = false;

    if (currentData) {
      // Check if there was a change in the power or alarm status
      if (currentData.power !== power || currentData.alarm !== alarm) {
        updates.power = power;
        updates.alarm = alarm;
        updates.lastStatusChangeTimestamp = now;

        // If the device goes offline (power is false or alarm is true), prepare to send an email
        if (!power || alarm) {
          triggerEmail = true;
        }
      } else {
        // Update last_statuscheck_timestamp even if power and alarm haven't changed
        updates.power = power;
        updates.alarm = alarm;
      }
    } else {
      // If the device does not exist in Firebase, create a new entry
      updates = {
        power,
        alarm,
        last_statuscheck_timestamp: now,
        lastStatusChangeTimestamp: now,
        device_name,
      };

      // If the device is offline during its first entry, prepare to send an email
      if (!power || alarm) {
        triggerEmail = true;
      }
    }

    // Update the device's status in Firebase
    await deviceRef.update(updates);

    // Check if an email should be sent
    if (triggerEmail) {
      // Retrieve the timestamp of the last sent email from Firebase
      const emailLogSnapshot = await emailLogRef.once('value');
      const lastEmailTimestamp = emailLogSnapshot.val();

      // Only send an email if the last one was sent more than 6 hours ago
      if (!lastEmailTimestamp || (now - lastEmailTimestamp > EMAIL_INTERVAL_SECONDS)) {
        setTimeout(async () => {
          await sendOutageEmail(deviceID, type, now, api_key);
          // Log the timestamp of the sent email
          await emailLogRef.set(now);
        }, 30000); // 30 seconds delay
      } else {
        console.log(`Email not sent for ${deviceID} due to 6-hour cooldown period.`);
      }
    }

    res.status(200).send('Device status updated successfully');
  } catch (error) {
    console.error('Error updating device status:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Export the functions
module.exports = {
  uptime
};
