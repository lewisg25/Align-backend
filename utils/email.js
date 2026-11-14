const resendUrl = 'https://api.resend.com/emails';

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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clientUrl() {
  return process.env.CLIENT_URL || 'http://localhost:5173';
}

function fromAddress() {
  return process.env.EMAIL_FROM ||
    process.env.RESEND_EMAIL ||
    'ALIGN <onboarding@resend.dev>';
}

async function sendEmail({ to, subject, text, html }) {
  const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_API;

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY must be set in production.');
    }
    return { sent: false, reason: 'Resend is not configured.' };
  }

  const response = await fetch(resendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromAddress(),
      to,
      subject,
      text,
      html
    })
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || `Resend returned ${response.status}.`);
  }

  return { sent: true, id: data.id };
}

async function sendOrLog(email, fallbackLog) {
  const result = await sendEmail(email);

  if (!result.sent) {
    console.log(fallbackLog);
  }

  return result;
}

async function sendLoginCode({ email, firstName, code, codeMinutes }) {
  const subject = 'Your ALIGN code';
  const text = [
    `Hi ${firstName || 'there'},`,
    '',
    'Use this one-time code to access your dashboard:',
    '',
    code,
    '',
    `This code expires in ${codeMinutes} minutes.`
  ].join('\n');
  const html = `
    <div style="${emailStyle}">
      <h2>Your sign-in code</h2>
      <p>Hi ${escapeHtml(firstName || 'there')}, use this code to access your dashboard.</p>
      <p style="font-size:28px;letter-spacing:4px;font-weight:bold;">${escapeHtml(code)}</p>
      <p>This code expires in ${codeMinutes} minutes.</p>
    </div>
  `;

  return sendOrLog(
    { to: email, subject, text, html },
    `ALIGN sign-in code for ${email}: ${code}`
  );
}

async function sendVerificationEmail({
  email,
  firstName,
  verificationUrl,
  tokenMinutes
}) {
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
      <p>Hi ${escapeHtml(firstName || 'there')}, please verify your email address to finish setting up your account.</p>
      <p><a href="${escapeHtml(verificationUrl)}" style="${buttonStyle}">Verify email</a></p>
      <p>This link expires in ${tokenMinutes} minutes.</p>
      <p>If the button does not work, copy and paste this link:</p>
      <p>${escapeHtml(verificationUrl)}</p>
    </div>
  `;

  return sendOrLog(
    { to: email, subject, text, html },
    `ALIGN verification link for ${email}: ${verificationUrl}`
  );
}

async function sendReminder(user) {
  const checkUrl = `${clientUrl()}/check-in`;
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
      <p>Hi ${escapeHtml(user.firstName)}, take a minute to stay aligned today.</p>
      <p><a href="${escapeHtml(checkUrl)}" style="${buttonStyle}">Start check-in</a></p>
      <p>If the button does not work, copy and paste this link:</p>
      <p>${escapeHtml(checkUrl)}</p>
    </div>
  `;

  return sendOrLog(
    { to: user.email, subject, text, html },
    `Daily check-in reminder for ${user.email}: ${checkUrl}`
  );
}

module.exports = {
  sendLoginCode,
  sendVerificationEmail,
  sendReminder
};
