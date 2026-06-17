const nodemailer = require('nodemailer');

const buttonStyle = [
  'background:#1f6d3f',
  'color:#fff',
  'padding:12px 18px',
  'border-radius:6px',
  'text-decoration:none'
].join(';');

const emailStyle = [
  'font-family: Arial, sans-serif',
  'line-height: 1.6',
  'color: #17211c'
].join(';');

function clientUrl() {
  return process.env.CLIENT_URL || 'http://localhost:5173';
}

function mailer() {
  const missingConfig =
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS;

  if (missingConfig) {
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

async function sendLoginCode({ email, firstName, code, codeMinutes }) {
  const transporter = mailer();
  const from = process.env.EMAIL_FROM || 'Align <no-reply@align.local>';
  const subject = 'Sign in to ALIGN';
  const text = [
    `Hi ${firstName || 'there'},`,
    '',
    'Use this code to sign in to your ALIGN dashboard:',
    '',
    code,
    '',
    `This code expires in ${codeMinutes} minutes.`
  ].join('\n');
  const html = `
    <div style="${emailStyle}">
      <h2>Sign in to ALIGN</h2>
      <p>Hi ${firstName || 'there'}, use this code to access your dashboard.</p>
      <p style="font-size:28px;letter-spacing:4px;font-weight:bold;">${code}</p>
      <p>This code expires in ${codeMinutes} minutes.</p>
    </div>
  `;

  if (!transporter) {
    console.log(`ALIGN sign-in code for ${email}: ${code}`);
    return { sent: false, reason: 'Email is not configured.' };
  }

  await transporter.sendMail({
    from,
    to: email,
    subject,
    text,
    html
  });

  return { sent: true };
}

async function sendVerificationEmail({
  email,
  firstName,
  verificationUrl,
  tokenMinutes
}) {
  const transporter = mailer();
  const from = process.env.EMAIL_FROM || 'Align <no-reply@align.local>';
  const subject = 'Verify your ALIGN email';
  const text = [
    `Hi ${firstName || 'there'},`,
    '',
    'Please verify your email address to finish setting up your ALIGN account.',
    '',
    verificationUrl,
    '',
    `This link expires in ${tokenMinutes} minutes.`
  ].join('\n');
  const html = `
    <div style="${emailStyle}">
      <h2>Verify your ALIGN email</h2>
      <p>Hi ${firstName || 'there'}, please verify your email address to finish setting up your account.</p>
      <p><a href="${verificationUrl}" style="${buttonStyle}">Verify email</a></p>
      <p>This link expires in ${tokenMinutes} minutes.</p>
      <p>If the button does not work, copy and paste this link:</p>
      <p>${verificationUrl}</p>
    </div>
  `;

  if (!transporter) {
    console.log(`ALIGN verification link for ${email}: ${verificationUrl}`);
    return { sent: false, reason: 'Email is not configured.' };
  }

  await transporter.sendMail({
    from,
    to: email,
    subject,
    text,
    html
  });

  return { sent: true };
}

async function sendReminder(user) {
  const checkUrl = `${clientUrl()}/check-in`;
  const from = process.env.EMAIL_FROM || 'Align <no-reply@align.local>';
  const subject = 'Your daily Align check-in';
  const text = [
    `Hi ${user.firstName},`,
    '',
    'Your daily check-in is ready.',
    '',
    `Start here: ${checkUrl}`
  ].join('\n');
  const html = `
    <div style="${emailStyle}">
      <h2>Your daily check-in is ready.</h2>
      <p>Hi ${user.firstName}, take a minute to stay aligned today.</p>
      <p><a href="${checkUrl}" style="${buttonStyle}">Start check-in</a></p>
      <p>If the button does not work, copy and paste this link:</p>
      <p>${checkUrl}</p>
    </div>
  `;

  const transporter = mailer();

  if (!transporter) {
    console.log(`Daily check-in reminder for ${user.email}: ${checkUrl}`);
    return { sent: false, reason: 'Email is not configured.' };
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
  sendLoginCode,
  sendVerificationEmail,
  sendReminder
};
