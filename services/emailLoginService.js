const crypto = require('crypto');
const EmailLoginToken = require('../models/EmailLoginToken');
const User = require('../models/User');
const {
  relationshipData,
  yearsFromBody
} = require('./relationshipYears');
const { sendMagicLink } = require('../utils/email');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const tokenMinutes = 30;

function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

function safeRedirectPath(value) {
  if (typeof value !== 'string') return '/dashboard';
  if (value.includes('\\') || !value.startsWith('/') || value.startsWith('//')) {
    return '/dashboard';
  }
  return value;
}

function nameFromEmail(email) {
  const [name = 'there'] = email.split('@');
  const firstName = name.split(/[._-]/).filter(Boolean)[0] || 'there';
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function magicLinkUrl(token, redirect) {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const url = new URL('/verify-email', baseUrl);
  url.searchParams.set('token', token);
  url.searchParams.set('redirect', redirect);
  return url.toString();
}

async function findOrCreateEmailUser(email, yearsTogether) {
  const relationship = relationshipData(yearsTogether);
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (Object.keys(relationship).length) {
      Object.assign(existingUser, relationship);
      await existingUser.save();
    }
    return existingUser;
  }

  return User.create({
    email,
    firstName: nameFromEmail(email),
    authProvider: 'email',
    ...relationship
  });
}

async function startEmailLogin(body) {
  const email = normalizeEmail(body.email);
  const redirect = safeRedirectPath(body.redirect);

  if (!emailPattern.test(email)) {
    return { error: 'Please enter a valid email address.', status: 400 };
  }

  const user = await findOrCreateEmailUser(email, yearsFromBody(body));
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + tokenMinutes * 60 * 1000);

  await EmailLoginToken.create({
    email,
    userId: user._id,
    tokenHash: hashToken(token),
    redirect,
    expiresAt
  });

  await sendMagicLink({
    email,
    firstName: user.firstName,
    signInUrl: magicLinkUrl(token, redirect),
    tokenMinutes
  });

  return { message: 'Check your email for your sign-in link.' };
}

async function verifyEmailLogin(token) {
  if (!token) {
    return { error: 'Verification token is required.', status: 400 };
  }

  const loginToken = await EmailLoginToken.findOne({
    tokenHash: hashToken(token),
    usedAt: null,
    expiresAt: { $gt: new Date() }
  });

  if (!loginToken) {
    return { error: 'This sign-in link is invalid or expired.', status: 400 };
  }

  const user = await User.findById(loginToken.userId);
  if (!user) {
    return { error: 'We could not find this account.', status: 404 };
  }

  loginToken.usedAt = new Date();
  await loginToken.save();

  return { user, redirect: loginToken.redirect };
}

module.exports = {
  startEmailLogin,
  verifyEmailLogin
};
