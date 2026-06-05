const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const {
  getQuestions,
  saveResponse,
  submitCheckIn
} = require('../controllers/checkInController');

router.get('/questions', requireAuth, getQuestions);
router.post('/submit', requireAuth, submitCheckIn);
router.post('/response', requireAuth, saveResponse);

module.exports = router;
