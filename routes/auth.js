const express = require('express');
const requireAuth = require('../middleware/auth');
const {
  getMe,
  login,
  logout,
  register,
  verifyEmail
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.get('/verify-email', verifyEmail);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.post('/logout', logout);

module.exports = router;
