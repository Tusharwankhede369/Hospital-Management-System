const nodemailer = require('nodemailer');

// Create transporter from env (Gmail, SendGrid, etc.)
// Set in .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
const getTransporter = () => {
  const user = process.env.SMTP_USER || process.env.MAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.MAIL_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass }
  });
};

/**
 * Send an email. If SMTP is not configured, logs to console and returns true (for dev).
 */
const sendMail = async ({ to, subject, text, html }) => {
  const transporter = getTransporter();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@hms.com';

  if (!transporter) {
    console.log('[Email not configured] Would send:', { to, subject, text: text || (html && html.substring(0, 80)) });
    if (text) console.log('[Email body]', text);
    // Return false so callers know real email was NOT sent
    return false;
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text: text || (html ? html.replace(/<[^>]*>/g, '') : ''),
      html: html || undefined
    });
    return true;
  } catch (err) {
    console.error('Email send error:', err.message);
    return false;
  }
};

const sendOTPEmail = async (to, otp, purpose = 'password reset') => {
  const subject = purpose === 'verify' ? 'Verify your email - HMS' : 'Your password reset code - HMS';
  const text = purpose === 'verify'
    ? `Your email verification code is: ${otp}. It expires in 15 minutes.`
    : `Your password reset code is: ${otp}. It expires in 15 minutes. Do not share this code.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 400px;">
      <h2>${purpose === 'verify' ? 'Verify your email' : 'Password reset'}</h2>
      <p>Your code is: <strong style="font-size: 1.5rem; letter-spacing: 2px;">${otp}</strong></p>
      <p>It expires in 15 minutes.</p>
      <p>If you didn't request this, you can ignore this email.</p>
    </div>
  `;
  return sendMail({ to, subject, text, html });
};

module.exports = { sendMail, sendOTPEmail };
