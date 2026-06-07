const {
  getQuestions: loadQuestions,
  reminderPayload,
  saveResponse: saveCheckInResponse,
  submitCheckIn: submitUserCheckIn,
  updateReminder: saveReminder
} = require('../services/checkInService');

function fail(res, error, fallback) {
  const status = error.status || 500;
  const key = error.key || 'error';
  const message = error.status ? error.message : fallback;

  return res.status(status).json({ [key]: message });
}

function getReminder(req, res) {
  return res.json(reminderPayload(req.user));
}

async function updateReminder(req, res) {
  try {
    return res.json(await saveReminder(req.user, req.body));
  } catch (error) {
    return fail(res, error, 'Could not update reminder right now.');
  }
}

async function getQuestions(req, res) {
  try {
    return res.json(await loadQuestions(req.user));
  } catch (error) {
    return fail(res, error, 'Failed to retrieve questions.');
  }
}

async function submitCheckIn(req, res) {
  try {
    return res.json(await submitUserCheckIn(req.user, req.body));
  } catch (error) {
    return fail(res, error, 'Failed to submit check-in.');
  }
}

async function saveResponse(req, res) {
  try {
    return res.json(await saveCheckInResponse(req.user, req.body));
  } catch (error) {
    return fail(res, error, 'Failed to save response.');
  }
}

module.exports = {
  getReminder,
  getQuestions,
  saveResponse,
  submitCheckIn,
  updateReminder
};
