const nodemailer = require('nodemailer');
const { logger } = require('../middleware/cybersecurity');
require('dotenv').config();

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } catch (e) {
    logger.warn('Email transporter init failed, using console fallback', { error: e.message });
    transporter = null;
  }
  return transporter;
}

async function sendEmail({ to, subject, template, data, html, text }) {
  try {
    const tx = getTransporter();
    const from = process.env.EMAIL_FROM || 'noreply@example.com';

    const bodyText = text || `Template: ${template}\nData: ${JSON.stringify(data || {})}`;
    const bodyHtml = html || `<p>${bodyText.replace(/\n/g, '<br/>')}</p>`;

    if (!tx) {
      logger.info('Email (console fallback)', { to, subject, bodyText });
      return { success: true, fallback: true };
    }

    await tx.sendMail({ from, to, subject, text: bodyText, html: bodyHtml });
    return { success: true };
  } catch (error) {
    logger.error('sendEmail failed', { error: error.message, to, subject });
    return { success: false, error: error.message };
  }
}

module.exports = { sendEmail };
