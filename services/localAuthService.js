const User = require('../models/User');
const { findTier } = require('./relationshipTier');
const { hashPassword, verifyPassword } = require('../utils/password');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

function splitName(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() || '',
    lastName: parts.join(' ')
  };
}

function registrationData(body) {
  const fallback = splitName(body.name);
  return {
    firstName: (body.firstName || fallback.firstName || '').trim(),
    lastName: (body.lastName || fallback.lastName || '').trim(),
    email: normalizeEmail(body.email || ''),
    password: body.password || '',
    yearsTogether: Number(body.yearsTogether) || 0,
    relationshipTier: body.relationshipTier
  };
}

function validateRegistration(data) {
  if (!data.firstName || !data.email || !data.password) {
    return 'Name, email, and password are required.';
  }
  if (!emailPattern.test(data.email)) {
    return 'Please enter a valid email address.';
  }
  if (data.password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  return null;
}

async function registerUser(body) {
  const data = registrationData(body);
  const error = validateRegistration(data);
  if (error) return { error, status: 400 };

  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    return { error: 'An account already exists with that email.', status: 409 };
  }

  const user = await User.create({
    ...data,
    password: hashPassword(data.password),
    authProvider: 'local',
    relationshipTier: findTier(data.yearsTogether, data.relationshipTier)
  });

  return { user };
}

async function loginUser(body) {
  const email = normalizeEmail(body.email || '');
  if (!email || !body.password) {
    return { error: 'Email and password are required.', status: 400 };
  }

  const user = await User.findOne({ email }).select('+password');
  const validPassword = user && verifyPassword(body.password, user.password);

  if (!validPassword) {
    return { error: 'Email or password is incorrect.', status: 401 };
  }

  return { user };
}

module.exports = {
  loginUser,
  registerUser
};
