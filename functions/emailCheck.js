// emailCheck.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const postmark = require('postmark');

// Do not initialize admin again; it's already initialized in index.js

// Get Postmark API key from Firebase functions config
const postmarkApiKey = functions.config().postmark.api_key;

// Create a Postmark client instance
const postmarkClient = new postmark.ServerClient(postmarkApiKey);

// Email addresses to CC
const ccEmails = ['christian.kessler@mwaa.com', 'patrick.skelton@mwaa.com'];

const restrictEmailDomain = functions.auth.user().onCreate(async (user) => {
  const email = user.email || '';
  const emailDomain = email.substring(email.lastIndexOf('@') + 1).toLowerCase();

  if (emailDomain !== 'mwaa.com') {
    // Disable the user
    try {
      await admin.auth().updateUser(user.uid, { disabled: true });
      console.log('Disabled user with email:', email);

      // Optionally, send an email to notify about the disabled account
      await postmarkClient.sendEmail({
        From: 'StratOps Uptime <uptime@transformairports.com>',
        To: email,
        Cc: ccEmails.join(', '),
        Subject: 'Account Disabled - Unauthorized Email Domain',
        TextBody: `Hello,

Your account has been disabled because it does not use an authorized email domain (mwaa.com).

If you believe this is an error, please contact support.

Best regards,
StratOps Uptime Team`,
      });
      console.log('Disabled account notification email sent to:', email);
    } catch (error) {
      console.error('Error disabling user or sending email:', error);
    }
    return null;
  }

  // Send welcome email to the user and CC Christian and Pat
  try {
    await postmarkClient.sendEmail({
      From: 'StratOps Uptime <uptime@transformairports.com>',
      To: email,
      Cc: ccEmails.join(', '),
      Subject: 'Welcome to EEMW Uptime Dashboard',
      TextBody: `Hello,

Welcome to the EEMW Uptime Dashboard. Your account has been successfully created.

You can now log in and start using the dashboard.

Best regards,
StratOps Innovation Team`,
    });

    console.log('Welcome email sent to:', email);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }

  return null;
});

// Export the restrictEmailDomain function
module.exports = { restrictEmailDomain };
