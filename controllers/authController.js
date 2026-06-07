const { loginUser, registerUser } = require('../services/localAuthService');
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

function getMe(req, res) {
  return res.json({ user: serializeUser(req.user) });
}

function logout(req, res) {
  return res.status(204).send();
}

module.exports = {
  getMe,
  login,
  logout,
  register,
  serializeUser
};
