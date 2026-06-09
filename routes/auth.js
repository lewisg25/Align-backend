const express = require('express');
const requireAuth = require('../middleware/auth');
const {
  finishGoogleLogin,
  loginWithGoogleCredential,
  startGoogleLogin
} = require('../controllers/googleAuthController');
const {
  getMe,
  login,
  logout,
  register,
  resendEmailVerification,
  startEmailLogin,
  updateMe,
  verifyRegistrationEmail,
  verifyEmailLogin
} = require('../controllers/authController');

const router = express.Router();

router.get('/google', startGoogleLogin);
router.post('/google', loginWithGoogleCredential);
router.get('/google/callback', finishGoogleLogin);
router.get('/oauth2/authorize/google', startGoogleLogin);
router.get('/oauth2/callback/google', finishGoogleLogin);
router.post('/register', register);
router.post('/login', login);
router.post('/email-verification/start', resendEmailVerification);
router.post('/email-verification/verify', verifyRegistrationEmail);
router.get('/email-verification/verify', verifyRegistrationEmail);
router.post('/email/start', startEmailLogin);
router.post('/verify-email', verifyEmailLogin);
router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, updateMe);
router.post('/logout', logout);

module.exports = router;
