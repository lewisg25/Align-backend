const { loginUser, registerUser } = require('../services/localAuthService');
const {
  startEmailLogin: startEmailLoginService,
  verifyEmailLogin: verifyEmailLoginService
} = require('../services/emailLoginService');
const { serializeUser } = require('../services/userSerializer');
const { signToken } = require('../utils/token');

function fail(res, status, message) {
  return res.status(status).json({ message });
}

function authResponse(user, extras = {}) {
  return {
    token: signToken({ sub: user._id.toString(), email: user.email }),
    user: serializeUser(user),
    ...extras
  };
}

function setSessionCookie(res, token) {
  res.cookie('alignSession', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7
  });
}

async function register(req, res) {
  try {
    const result = await registerUser(req.body);

    if (result.error) {
      return fail(res, result.status, result.error);
    }

    return res.status(201).json(authResponse(result.user, {
      message: 'Thank you for signing up. Stay aligned.'
    }));
  } catch (error) {
    if (error.code === 11000) {
      return fail(res, 409, 'An account already exists with that email.');
    }
    return fail(res, 500, 'Could not create your account right now.');
  }
}

async function login(req, res) {
  try {
    const result = await loginUser(req.body);

    if (result.error) {
      return fail(res, result.status, result.error);
    }

    return res.json(authResponse(result.user));
  } catch (error) {
    return fail(res, 500, 'Could not log you in right now.');
  }
}

async function startEmailLogin(req, res) {
  try {
    const result = await startEmailLoginService(req.body);

    if (result.error) {
      return fail(res, result.status, result.error);
    }

    return res.json(result);
  } catch (error) {
    return fail(res, 500, 'Could not send your sign-in link right now.');
  }
}

async function verifyEmailLogin(req, res) {
  try {
    const result = await verifyEmailLoginService(req.body.token);

    if (result.error) {
      return fail(res, result.status, result.error);
    }

    const token = signToken({ sub: result.user._id.toString(), email: result.user.email });
    setSessionCookie(res, token);

    return res.json({
      user: serializeUser(result.user),
      redirect: result.redirect,
      message: 'Your email has been verified.'
    });
  } catch (error) {
    return fail(res, 500, 'Could not verify your email right now.');
  }
}

function getMe(req, res) {
  return res.json({ user: serializeUser(req.user) });
}

function logout(req, res) {
  res.clearCookie('alignSession', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  return res.status(204).send();
}

module.exports = {
  getMe,
  login,
  logout,
  register,
  startEmailLogin,
  verifyEmailLogin,
  serializeUser
};
