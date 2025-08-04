// updateUptime.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const postmark = require('postmark');
const { DateTime } = require('luxon'); // Import Luxon for time zone management

// Get Postmark API key from Firebase functions config
const postmarkApiKey = functions.config().postmark.api_key;

// Create a Postmark client instance
const postmarkClient = new postmark.ServerClient(postmarkApiKey);

// Define a 6-hour (21600 seconds) interval for email notifications
const EMAIL_INTERVAL_SECONDS = 21600;

/**
 * Sends an email notification using the Postmark Node.js SDK.
 * @param {string} deviceID - The ID of the device that went offline.
 * @param {string} type - The type of device (Elevator, Escalator, Moving Walkway).
 * @param {number} timestamp - The timestamp when the device went offline.
 */
async function sendOutageEmail(deviceID, type, timestamp) {
  try {
    // Retrieve the list of global alert email addresses
    const emailSnapshot = await admin.database().ref(`/alertEmails`).once('value');
    const emails = emailSnapshot.val();

    if (!emails) {
      console.log('No alert emails configured.');
      return;
    }

    // Join the email addresses into a comma-separated string
    const toEmails = Object.values(emails).join(', ');

    // Convert timestamp to New York/EST time
    const estTime = DateTime.fromSeconds(timestamp).setZone('America/New_York').toLocaleString(DateTime.DATETIME_FULL);

    // Prepare the subject and body of the email
    const subject = `${type.charAt(0).toUpperCase() + type.slice(1)} Outage (${deviceID})`;
    const body = `${deviceID} was reported as being offline on ${estTime}.`;

    // Send the email using Postmark SDK
    await postmarkClient.sendEmail({
      From: 'StratOps Uptime <uptime@transformairports.com>',
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
const updateUptime = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { deviceID, type, power, alarm } = req.body;

  // Validate the request body
  if (!deviceID || !type || typeof power !== 'boolean' || typeof alarm !== 'boolean') {
    return res.status(400).send('Missing or incorrect required parameters');
  }

  const deviceRef = admin.database().ref(`/devices/${type}/${deviceID}`);
  const outageLogsRef = admin.database().ref(`/outageLogs/${type}/${deviceID}/outages`);
  const emailLogRef = admin.database().ref(`/emailLogs/${type}/${deviceID}`);

  try {
    // Get the current data of the device from Firebase
    const snapshot = await deviceRef.once('value');
    const currentData = snapshot.val();

    // Get the current timestamp in seconds
    const now = Math.floor(Date.now() / 1000);
    let updates = {
      last_statuscheck_timestamp: now,
    };

    let triggerEmail = false;

    if (currentData) {
      // Check if there was a change in the power or alarm status
      if (currentData.power !== power || currentData.alarm !== alarm) {
        updates.power = power;
        updates.alarm = alarm;
        updates.lastStatusChangeTimestamp = now;

        // If the device goes offline (power is false or alarm is true), log the outage and prepare to send an email
        if (!power || alarm) {
          triggerEmail = true;
          const newOutageRef = outageLogsRef.push();
          await newOutageRef.set({
            start: now,
            end: null
          });
        } else {
          // If the device comes back online, mark the ongoing outage as ended
          const ongoingOutageQuery = outageLogsRef.orderByChild('end').equalTo(null);
          const ongoingOutageSnapshot = await ongoingOutageQuery.once('value');
          ongoingOutageSnapshot.forEach(outageSnapshot => {
            outageSnapshot.ref.update({ end: now });
          });
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
      };

      // If the device is offline during its first entry, log the outage and prepare to send an email
      if (!power || alarm) {
        triggerEmail = true;
        const newOutageRef = outageLogsRef.push();
        await newOutageRef.set({
          start: now,
          end: null
        });
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
          await sendOutageEmail(deviceID, type, now);
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

// Function to calculate and update uptime for all devices
const calculateUptime = functions.pubsub.topic("calculate-uptime").onPublish(async (message) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startOfMonth = new Date(year, month - 1, 1).getTime() / 1000;
  const currentTime = Math.floor(now.getTime() / 1000);
  const totalSecondsInMonth = currentTime - startOfMonth;
  const totalHoursInMonth = totalSecondsInMonth / 3600;

  console.log(`Calculating uptime for month: ${month}, year: ${year}`);
  console.log(`Start of month: ${startOfMonth}, Current time: ${currentTime}`);
  console.log(`Total hours in month so far: ${totalHoursInMonth}`);

  const devicesSnapshot = await admin.database().ref('/devices').once('value');
  const devices = devicesSnapshot.val();

  for (const type in devices) {
    for (const deviceID in devices[type]) {
      console.log(`Processing device: ${deviceID}, type: ${type}`);

      const outageLogsRef = admin.database().ref(`/outageLogs/${type}/${deviceID}/outages`);
      const outageLogsSnapshot = await outageLogsRef.once('value');

        let totalOutageTime = 0;

        outageLogsSnapshot.forEach(outageSnapshot => {
          const outage = outageSnapshot.val();
          const outageStart = Math.max(outage.start, startOfMonth);
          const outageEnd = outage.end === null ? currentTime : Math.min(outage.end, currentTime);
          console.log(`Evaluating outage: start=${outage.start}, end=${outage.end}, adjustedStart=${outageStart}, adjustedEnd=${outageEnd}`);
          if (outageEnd >= outageStart) {
            const outageDuration = outageEnd - outageStart;
            totalOutageTime += outageDuration;
            console.log(`Outage duration: ${outageDuration} seconds, Total outage time so far: ${totalOutageTime} seconds`);
          } else {
            console.log(`Invalid outage duration for outage start: ${outage.start}, end: ${outage.end}`);
          }
        });

        const totalOutageHours = totalOutageTime / 3600;
        const uptimeHours = totalHoursInMonth - totalOutageHours;
        const uptimePercentage = (uptimeHours / totalHoursInMonth) * 100;

        console.log(`Total outage hours: ${totalOutageHours}, Uptime hours: ${uptimeHours}, Uptime percentage: ${uptimePercentage}`);

        const updates = {
          currentMonthUptime: {
            totalHours: parseFloat(totalHoursInMonth.toFixed(2)),
            totalOfflineHours: parseFloat(totalOutageHours.toFixed(2)),
            uptimeHours: parseFloat(uptimeHours.toFixed(2)),
            uptimePercentage: parseFloat(uptimePercentage.toFixed(2))
          }
        };

        const deviceRef = admin.database().ref(`/devices/${type}/${deviceID}`);
        await deviceRef.update(updates);

        const uptimeRef = admin.database().ref(`/uptimeLogs/${type}/${deviceID}/${year}-${month}`);
        await uptimeRef.set({
          totalHours: parseFloat(totalHoursInMonth.toFixed(2)),
          totalOfflineHours: parseFloat(totalOutageHours.toFixed(2)),
          uptimeHours: parseFloat(uptimeHours.toFixed(2)),
          uptimePercentage: parseFloat(uptimePercentage.toFixed(2)),
          calculatedAt: currentTime
        });
      }
    }

  return null;
});

// Export the functions
module.exports = {
  updateUptime,
  calculateUptime
};
