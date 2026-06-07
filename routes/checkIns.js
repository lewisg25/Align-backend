const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const {
  getReminder,
  getQuestions,
  saveResponse,
  submitCheckIn,
  updateReminder
} = require('../controllers/checkInController');

router.get('/questions', requireAuth, getQuestions);
router.get('/reminder', requireAuth, getReminder);
router.put('/reminder', requireAuth, updateReminder);
router.post('/reminder', requireAuth, updateReminder);
router.post('/submit', requireAuth, submitCheckIn);
router.post('/response', requireAuth, saveResponse);

module.exports = router;
