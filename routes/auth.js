const express = require('express');
const requireAuth = require('../middleware/auth');
const {
  finishGoogleLogin,
  startGoogleLogin
} = require('../controllers/googleAuthController');
const {
  getMe,
  login,
  logout,
  register
} = require('../controllers/authController');

const router = express.Router();

router.get('/google', startGoogleLogin);
router.get('/google/callback', finishGoogleLogin);
router.get('/oauth2/authorize/google', startGoogleLogin);
router.get('/oauth2/callback/google', finishGoogleLogin);
router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.post('/logout', logout);

module.exports = router;
