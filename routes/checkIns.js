const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const {
  deleteResponse,
  getReminder,
  getQuestions,
  getResponses,
  getSummary,
  saveResponse,
  submitCheckIn,
  updateResponse,
  updateReminder
} = require('../controllers/checkInController');

router.get('/questions', requireAuth, getQuestions);
router.get('/responses', requireAuth, getResponses);
router.get('/summary/:weekIdentifier', requireAuth, getSummary);
router.get('/reminder', requireAuth, getReminder);
router.put('/reminder', requireAuth, updateReminder);
router.post('/reminder', requireAuth, updateReminder);
router.post('/submit', requireAuth, submitCheckIn);
router.post('/response', requireAuth, saveResponse);
router.put('/response/:responseId', requireAuth, updateResponse);
router.delete('/response/:responseId', requireAuth, deleteResponse);

module.exports = router;
