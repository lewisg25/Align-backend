const crypto = require('crypto');
const EmailLoginToken = require('../models/EmailLoginToken');
const User = require('../models/User');
const { relationshipData, yearsFromBody } = require('./relationshipYears');
const { partnerNameData } = require('./partnerName');
const { sendLoginCode } = require('../utils/email');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const codeMinutes = 10;

function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

function cleanText(value = '') {
  return String(value || '').trim();
}

function splitName(name = '') {
  const parts = cleanText(name).split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() || '',
    lastName: parts.join(' ')
  };
}

function nameFromEmail(email) {
  const [name = 'there'] = email.split('@');
  const firstName = name.split(/[._-]/).filter(Boolean)[0] || 'there';
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

function safeRedirectPath(value) {
  if (typeof value !== 'string') return '/dashboard';
  if (value.includes('\\') || !value.startsWith('/') || value.startsWith('//')) {
    return '/dashboard';
  }
  return value;
}

function loginCodeSecret() {
  return process.env.EMAIL_LOGIN_CODE_SECRET ||
    process.env.JWT_SECRET ||
    'align-development-login-code-secret';
}

function loginCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashCode(email, code) {
  return crypto
    .createHmac('sha256', loginCodeSecret())
    .update(`${normalizeEmail(email)}:${code}`)
    .digest('hex');
}

async function findEmailUser(email) {
  return User.findOne({ email });
}

function accountProfile(body, email) {
  const fallback = splitName(body.name || body.userName);
  const years = yearsFromBody(body);

  return {
    firstName: cleanText(body.firstName) || fallback.firstName || nameFromEmail(email),
    lastName: cleanText(body.lastName) || fallback.lastName,
    years,
    fields: {
      ...relationshipData(years),
      ...partnerNameData(body)
    }
  };
}

function validateAccountProfile(profile) {
  if (!profile.firstName) {
    return 'Your name is required.';
  }
  if (!profile.fields.partnerName) {
    return 'Partner name is required.';
  }
  if (profile.years === undefined) {
    return 'Please enter how long you have been married.';
  }
  return null;
}

async function findOrCreateEmailUser(email, body) {
  const existingUser = await findEmailUser(email);

  if (existingUser) {
    if (body.createAccount && !existingUser.emailVerified) {
      const profile = accountProfile(body, email);
      const error = validateAccountProfile(profile);
      if (error) return { error, status: 400 };

      Object.assign(existingUser, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        ...profile.fields
      });
      await existingUser.save();
    }

    return { user: existingUser, isNewUser: false };
  }

  if (!body.createAccount) {
    return {
      error: 'No account found for that email. Please create an account first.',
      status: 404
    };
  }

  const profile = accountProfile(body, email);
  const error = validateAccountProfile(profile);
  if (error) return { error, status: 400 };

  const user = await User.create({
    email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    authProvider: 'email',
    emailVerified: false,
    emailVerifiedAt: null,
    ...profile.fields
  });

  return { user, isNewUser: true };
}

async function startEmailLogin(body = {}) {
  const email = normalizeEmail(body.email);
  const redirect = safeRedirectPath(body.redirect);

  if (!emailPattern.test(email)) {
    return { error: 'Please enter a valid email address.', status: 400 };
  }

  const account = await findOrCreateEmailUser(email, body);
  if (account.error) {
    return account;
  }

  const code = loginCode();
  const expiresAt = new Date(Date.now() + codeMinutes * 60 * 1000);

  await EmailLoginToken.updateMany(
    { email, usedAt: null },
    { usedAt: new Date() }
  );

  await EmailLoginToken.create({
    email,
    userId: account.user._id,
    tokenHash: hashCode(email, code),
    redirect,
    expiresAt
  });

  await sendLoginCode({
    email,
    firstName: account.user.firstName,
    code,
    codeMinutes
  });

  return {
    message: 'Check your email for your sign-in code.',
    isNewUser: account.isNewUser
  };
}

async function verifyEmailLogin(body = {}) {
  const email = normalizeEmail(body.email);
  const code = String(body.code || '').trim();

  if (!emailPattern.test(email)) {
    return { error: 'Please enter a valid email address.', status: 400 };
  }

  if (!/^\d{6}$/.test(code)) {
    return { error: 'Please enter the 6-digit sign-in code.', status: 400 };
  }

  const loginToken = await EmailLoginToken.findOne({
    email,
    tokenHash: hashCode(email, code),
    usedAt: null,
    expiresAt: { $gt: new Date() }
  });

  if (!loginToken) {
    return { error: 'This sign-in code is invalid or expired.', status: 400 };
  }

  const user = await User.findById(loginToken.userId);
  if (!user) {
    return { error: 'We could not find this account.', status: 404 };
  }

  user.emailVerified = true;
  user.emailVerifiedAt = user.emailVerifiedAt || new Date();
  if (!['local', 'email'].includes(user.authProvider)) {
    user.authProvider = 'email';
  }
  loginToken.usedAt = new Date();
  await Promise.all([user.save(), loginToken.save()]);

  return { user, redirect: loginToken.redirect };
}

module.exports = {
  startEmailLogin,
  verifyEmailLogin
};
