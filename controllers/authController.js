const { loginUser, registerUser } = require('../services/localAuthService');
const {
  resendEmailVerification: resendEmailVerificationService,
  startEmailVerification,
  verificationRedirect,
  verifyEmailToken
} = require('../services/emailVerificationService');
const {
  startEmailLogin: startEmailLoginService,
  verifyEmailLogin: verifyEmailLoginService
} = require('../services/emailLoginService');
const { partnerNameFromBody } = require('../services/partnerName');
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

function sendAuthResponse(res, user, extras = {}, status = 200) {
  const response = authResponse(user, extras);
  setSessionCookie(res, response.token);
  return res.status(status).json(response);
}

async function register(req, res) {
  try {
    const result = await registerUser(req.body);

    if (result.error) {
      return fail(res, result.status, result.error);
    }

    let verificationEmail = { sent: false };
    try {
      verificationEmail = await startEmailVerification(result.user);
    } catch (emailError) {
      console.error('Could not send verification email:', emailError.message);
    }

    return sendAuthResponse(res, result.user, {
      message: 'Thank you for signing up. Please verify your email address.',
      requiresEmailVerification: !result.user.emailVerified,
      verificationEmailSent: Boolean(verificationEmail.sent)
    }, 201);
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

    return sendAuthResponse(res, result.user);
  } catch (error) {
    return fail(res, 500, 'Could not log you in right now.');
  }
}

async function resendEmailVerification(req, res) {
  try {
    const result = await resendEmailVerificationService(req.body || {});

    if (result.error) {
      return fail(res, result.status, result.error);
    }

    return res.json(result);
  } catch (error) {
    return fail(res, 500, 'Could not send your verification link right now.');
  }
}

async function verifyRegistrationEmail(req, res) {
  try {
    const result = await verifyEmailToken((req.body && req.body.token) || req.query.token);

    if (result.error) {
      if (req.method === 'GET') {
        return res.redirect(verificationRedirect('failed'));
      }
      return fail(res, result.status, result.error);
    }

    const token = signToken({ sub: result.user._id.toString(), email: result.user.email });
    setSessionCookie(res, token);

    if (req.method === 'GET') {
      return res.redirect(verificationRedirect('success'));
    }

    return res.json(authResponse(result.user, {
      message: 'Your email has been verified.'
    }));
  } catch (error) {
    if (req.method === 'GET') {
      return res.redirect(verificationRedirect('failed'));
    }
    return fail(res, 500, 'Could not verify your email right now.');
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
    return fail(res, 500, 'Could not send your sign-in code right now.');
  }
}

async function verifyEmailLogin(req, res) {
  try {
    const result = await verifyEmailLoginService(req.body);

    if (result.error) {
      return fail(res, result.status, result.error);
    }

    return sendAuthResponse(res, result.user, {
      redirect: result.redirect,
      message: 'You are signed in.'
    });
  } catch (error) {
    return fail(res, 500, 'Could not verify your sign-in code right now.');
  }
}

function getMe(req, res) {
  return res.json({ user: serializeUser(req.user) });
}

async function updateMe(req, res) {
  try {
    const partnerName = partnerNameFromBody(req.body);

    if (partnerName === undefined) {
      return fail(res, 400, 'Partner name is required.');
    }

    req.user.partnerName = partnerName;
    await req.user.save();

    return res.json({ user: serializeUser(req.user) });
  } catch (error) {
    return fail(res, 500, 'Could not update your profile right now.');
  }
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
  resendEmailVerification,
  startEmailLogin,
  verifyRegistrationEmail,
  verifyEmailLogin,
  updateMe,
  serializeUser
};
