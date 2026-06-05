const nodemailer = require('nodemailer');

function clientUrl() {
  return process.env.CLIENT_URL || 'http://localhost:3000';
}

function mailer() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendVerificationEmail({ user, verificationToken }) {
  const verifyUrl = `${clientUrl()}/verify-email?token=${verificationToken}`;
  const from = process.env.EMAIL_FROM || 'Align <no-reply@align.local>';
  const subject = 'Verify your Align account';
  const text = [
    `Hi ${user.firstName},`,
    '',
    'Thank you for signing up. Stay aligned.',
    '',
    `Verify your email here: ${verifyUrl}`
  ].join('\n');
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #17211c;">
      <h2>Thank you for signing up.</h2>
      <p>Stay aligned.</p>
      <p>Hi ${user.firstName}, please verify your email to finish setting up your Align account.</p>
      <p><a href="${verifyUrl}" style="background:#1f6d3f;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;">Verify email</a></p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p>${verifyUrl}</p>
    </div>
  `;

  const transporter = mailer();

  if (!transporter) {
    console.log(`Email verification link for ${user.email}: ${verifyUrl}`);
    return { sent: false, reason: 'SMTP is not configured.' };
  }

  await transporter.sendMail({
    from,
    to: user.email,
    subject,
    text,
    html
  });

  return { sent: true };
}

module.exports = {
  sendVerificationEmail
};
