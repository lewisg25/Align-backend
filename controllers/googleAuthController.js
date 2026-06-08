const {
  googleCredentialUser,
  googleUser,
  loginUrl
} = require('../services/googleOAuthService');
const { findOrCreateGoogleUser } = require('../services/googleUserService');
const { signToken } = require('../utils/token');
const { serializeUser } = require('../services/userSerializer');

function fail(res, status, message) {
  return res.status(status).json({ message });
}

function encodeState(data) {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

function decodeState(value) {
  if (!value) return {};

  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch (error) {
    return {};
  }
}

function safeRedirectPath(value) {
  if (typeof value !== 'string') return null;
  if (value.includes('\\')) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

function successUrl(token, redirectPath) {
  const baseUrl = process.env.GOOGLE_SUCCESS_URL ||
    `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`;
  const base = new URL(baseUrl);
  const targetUrl = redirectPath
    ? new URL(redirectPath, base).toString()
    : baseUrl;

  const separator = targetUrl.includes('?') ? '&' : '?';
  return `${targetUrl}${separator}token=${encodeURIComponent(token)}`;
}

function setSessionCookie(res, token) {
  res.cookie('alignSession', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7
  });
}

function startGoogleLogin(req, res) {
  try {
    const redirectPath = safeRedirectPath(req.query.redirect);
    const state = redirectPath ? encodeState({ redirect: redirectPath }) : undefined;

    return res.redirect(loginUrl(state));
  } catch (error) {
    return fail(res, 500, 'Google login is not configured yet.');
  }
}

async function finishGoogleLogin(req, res) {
  try {
    if (!req.query.code) {
      return fail(res, 400, 'Google login code is required.');
    }

    const profile = await googleUser(req.query.code);
    const user = await findOrCreateGoogleUser(profile);
    const token = signToken({ sub: user._id.toString(), email: user.email });
    const state = decodeState(req.query.state);

    setSessionCookie(res, token);
    return res.redirect(successUrl(token, safeRedirectPath(state.redirect)));
  } catch (error) {
    return fail(res, 500, 'Could not log in with Google right now.');
  }
}

async function loginWithGoogleCredential(req, res) {
  try {
    const profile = await googleCredentialUser(req.body.credential);
    const user = await findOrCreateGoogleUser(profile);
    const token = signToken({ sub: user._id.toString(), email: user.email });

    setSessionCookie(res, token);
    return res.json({ user: serializeUser(user) });
  } catch (error) {
    return fail(res, 400, 'Could not verify your Google login.');
  }
}

module.exports = {
  finishGoogleLogin,
  loginWithGoogleCredential,
  startGoogleLogin
};
