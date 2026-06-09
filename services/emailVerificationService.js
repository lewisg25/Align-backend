const crypto = require('crypto');
const EmailVerificationToken = require('../models/EmailVerificationToken');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/email');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function verificationTokenMinutes() {
  return Number(process.env.EMAIL_VERIFICATION_TOKEN_MINUTES) || 60 * 24;
}

function apiUrl() {
  return process.env.PUBLIC_API_URL ||
    process.env.API_URL ||
    `http://localhost:${process.env.PORT || 8080}`;
}

function verificationUrl(token) {
  const url = new URL('/auth/email-verification/verify', apiUrl());
  url.searchParams.set('token', token);
  return url.toString();
}

function verificationRedirect(status) {
  const url = new URL('/login', process.env.CLIENT_URL || 'http://localhost:5173');
  url.searchParams.set('emailVerified', status);
  return url.toString();
}

async function createVerificationToken(user) {
  const tokenMinutes = verificationTokenMinutes();
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + tokenMinutes * 60 * 1000);

  await EmailVerificationToken.updateMany(
    { userId: user._id, usedAt: null },
    { usedAt: new Date() }
  );

  await EmailVerificationToken.create({
    email: user.email,
    userId: user._id,
    tokenHash: hashToken(token),
    expiresAt
  });

  return token;
}

async function startEmailVerification(user) {
  if (!user || user.emailVerified) {
    return { sent: false, skipped: true };
  }

  const token = await createVerificationToken(user);
  const url = verificationUrl(token);

  return sendVerificationEmail({
    email: user.email,
    firstName: user.firstName,
    verificationUrl: url,
    tokenMinutes: verificationTokenMinutes()
  });
}

async function resendEmailVerification(body) {
  const email = normalizeEmail(body.email);

  if (!emailPattern.test(email)) {
    return { error: 'Please enter a valid email address.', status: 400 };
  }

  const user = await User.findOne({ email });
  if (!user || user.emailVerified) {
    return {
      message: 'If that account needs verification, a new link will be sent.'
    };
  }

  await startEmailVerification(user);

  return {
    message: 'If that account needs verification, a new link will be sent.'
  };
}

async function verifyEmailToken(token) {
  if (!token) {
    return { error: 'Verification token is required.', status: 400 };
  }

  const verificationToken = await EmailVerificationToken.findOne({
    tokenHash: hashToken(token),
    usedAt: null,
    expiresAt: { $gt: new Date() }
  });

  if (!verificationToken) {
    return { error: 'This verification link is invalid or expired.', status: 400 };
  }

  const user = await User.findById(verificationToken.userId);
  if (!user) {
    return { error: 'We could not find this account.', status: 404 };
  }

  verificationToken.usedAt = new Date();
  user.emailVerified = true;
  user.emailVerifiedAt = user.emailVerifiedAt || new Date();

  await Promise.all([verificationToken.save(), user.save()]);

  return { user };
}

module.exports = {
  resendEmailVerification,
  startEmailVerification,
  verificationRedirect,
  verifyEmailToken
};
