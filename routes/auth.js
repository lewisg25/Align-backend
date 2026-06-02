const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');
const { sendVerificationEmail } = require('../utils/email');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signToken } = require('../utils/token');

const router = express.Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_TIERS = new Set(['1-3_years', '5-7_years', 'other']);

function getRelationshipTier(yearsTogether, submittedTier) {
  if (VALID_TIERS.has(submittedTier)) return submittedTier;

  const years = Number(yearsTogether);
  if (years >= 1 && years <= 3) return '1-3_years';
  if (years >= 5 && years <= 7) return '5-7_years';

  return 'other';
}

function splitName(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || '';
  const lastName = parts.join(' ');

  return { firstName, lastName };
}

function serializeUser(user) {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    partnerId: user.partnerId,
    yearsTogether: user.yearsTogether,
    relationshipTier: user.relationshipTier,
    isPremium: user.isPremium,
    isEmailVerified: user.isEmailVerified,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastCheckInDate: user.lastCheckInDate,
    timezone: user.timezone
  };
}

function buildAuthResponse(user, extras = {}) {
  return {
    token: signToken({ sub: user._id.toString(), email: user.email }),
    user: serializeUser(user),
    ...extras
  };
}

function createVerificationToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

  return { token, tokenHash, expires };
}

async function verifyGoogleCredential(credential) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('Google OAuth is not configured on the server.');
  }

  const params = new URLSearchParams({ id_token: credential });
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?${params.toString()}`);
  const profile = await response.json();

  if (!response.ok) {
    throw new Error(profile.error_description || 'Google could not verify this login.');
  }

  if (profile.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new Error('Google login was issued for a different client.');
  }

  if (profile.email_verified !== 'true') {
    throw new Error('Google account email is not verified.');
  }

  return profile;
}

router.post('/register', async (req, res) => {
  const {
    firstName,
    lastName = '',
    name,
    email,
    password,
    yearsTogether = 0,
    relationshipTier
  } = req.body;
  const fallbackName = splitName(name);
  const trimmedFirstName = (firstName || fallbackName.firstName || '').trim();
  const trimmedLastName = (lastName || fallbackName.lastName || '').trim();
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!trimmedFirstName || !normalizedEmail || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }

  try {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'An account already exists with that email.' });
    }

    const verification = createVerificationToken();
    const user = await User.create({
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      email: normalizedEmail,
      password: hashPassword(password),
      authProvider: 'local',
      isEmailVerified: false,
      emailVerificationToken: verification.tokenHash,
      emailVerificationExpires: verification.expires,
      yearsTogether: Number(yearsTogether) || 0,
      relationshipTier: getRelationshipTier(yearsTogether, relationshipTier)
    });

    let emailResult = { sent: false };
    try {
      emailResult = await sendVerificationEmail({
        user,
        verificationToken: verification.token
      });
    } catch (error) {
      console.error(`Verification email failed for ${user.email}: ${error.message}`);
    }

    return res.status(201).json(buildAuthResponse(user, {
      emailVerificationSent: emailResult.sent,
      message: 'Thank you for signing up. Stay aligned.'
    }));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account already exists with that email.' });
    }

    return res.status(500).json({ message: 'Could not create your account right now.' });
  }
});

router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Verification token is required.' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      emailVerificationToken: tokenHash,
      emailVerificationExpires: { $gt: new Date() }
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({ message: 'Verification link is invalid or expired.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    return res.json({
      message: 'Email verified. Thank you for signing up. Stay aligned.',
      user: serializeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Could not verify your email right now.' });
  }
});

router.post('/login', async (req, res) => {
  const normalizedEmail = (req.body.email || '').trim().toLowerCase();
  const { password } = req.body;

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }

    return res.json(buildAuthResponse(user));
  } catch (error) {
    return res.status(500).json({ message: 'Could not log you in right now.' });
  }
});

router.post('/google', async (req, res) => {
  const { credential, yearsTogether = 0, relationshipTier } = req.body;

  if (!credential) {
    return res.status(400).json({ message: 'Google credential is required.' });
  }

  try {
    const profile = await verifyGoogleCredential(credential);
    const profileName = splitName(profile.name);
    const normalizedEmail = profile.email.toLowerCase();
    let user = await User.findOne({
      $or: [{ googleId: profile.sub }, { email: normalizedEmail }]
    });

    if (user) {
      user.googleId = user.googleId || profile.sub;
      user.avatarUrl = profile.picture || user.avatarUrl;
      user.firstName = user.firstName || profile.given_name || profileName.firstName || 'Align';
      user.lastName = user.lastName || profile.family_name || profileName.lastName || '';
      await user.save();
    } else {
      user = await User.create({
        firstName: profile.given_name || profileName.firstName || 'Align',
        lastName: profile.family_name || profileName.lastName || '',
        email: normalizedEmail,
        authProvider: 'google',
        googleId: profile.sub,
        avatarUrl: profile.picture || '',
        isEmailVerified: true,
        yearsTogether: Number(yearsTogether) || 0,
        relationshipTier: getRelationshipTier(yearsTogether, relationshipTier)
      });
    }

    return res.json(buildAuthResponse(user));
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Google login failed.' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: serializeUser(req.user) });
});

router.post('/logout', (req, res) => {
  return res.status(204).send();
});

module.exports = router;
