const express = require('express');
const requireAuth = require('../middleware/auth');
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

router.post('/register', register);
router.post('/login', login);
router.post('/email-verification/start', resendEmailVerification);
router.post('/email-verification/verify', verifyRegistrationEmail);
router.get('/email-verification/verify', verifyRegistrationEmail);
router.post('/email/start', startEmailLogin);
router.post('/email/verify', verifyEmailLogin);
router.post('/magic/request-code', startEmailLogin);
router.post('/magic/verify-code', verifyEmailLogin);
router.post('/verify-email', verifyEmailLogin);
router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, updateMe);
router.post('/logout', logout);

module.exports = router;
