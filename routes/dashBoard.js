const express = require('express');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  res.json({
    message: `Welcome, ${req.user.firstName}!`,
    user: {
      id: req.user._id.toString(),
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      fullName: req.user.fullName,
      email: req.user.email,
      avatarUrl: req.user.avatarUrl,
      isPremium: req.user.isPremium,
      yearsTogether: req.user.yearsTogether,
      relationshipTier: req.user.relationshipTier,
      currentStreak: req.user.currentStreak,
      longestStreak: req.user.longestStreak,
      lastCheckInDate: req.user.lastCheckInDate
    }
  });
});

module.exports = router;
