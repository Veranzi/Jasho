const { logger } = require('../middleware/cybersecurity');
require('dotenv').config();

async function sendSMS({ to, message }) {
  try {
    // Placeholder: integrate Twilio or other provider here
    if (process.env.SMS_PROVIDER === 'twilio') {
      // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      // await client.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to });
      logger.info('SMS (twilio stub)', { to, message: message.slice(0, 120) });
      return { success: true, provider: 'twilio' };
    }

    // Console fallback
    logger.info('SMS (console fallback)', { to, message });
    return { success: true, fallback: true };
  } catch (error) {
    logger.error('sendSMS failed', { error: error.message, to });
    return { success: false, error: error.message };
  }
}

module.exports = { sendSMS };
