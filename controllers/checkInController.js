const {
  deleteResponse: deleteCheckInResponse,
  getQuestions: loadQuestions,
  getResponses: loadResponses,
  reminderPayload,
  saveResponse: saveCheckInResponse,
  submitCheckIn: submitUserCheckIn,
  updateReminder: saveReminder,
  updateResponse: updateCheckInResponse,
  weeklySummary: loadWeeklySummary
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

async function getResponses(req, res) {
  try {
    return res.json(await loadResponses(req.user));
  } catch (error) {
    return fail(res, error, 'Failed to retrieve responses.');
  }
}

async function getSummary(req, res) {
  try {
    return res.json(await loadWeeklySummary(req.user, req.params.weekIdentifier));
  } catch (error) {
    return fail(res, error, 'Failed to retrieve summary.');
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

async function updateResponse(req, res) {
  try {
    return res.json(await updateCheckInResponse(req.user, req.params.responseId, req.body));
  } catch (error) {
    return fail(res, error, 'Failed to update response.');
  }
}

async function deleteResponse(req, res) {
  try {
    return res.json(await deleteCheckInResponse(req.user, req.params.responseId, req.body));
  } catch (error) {
    return fail(res, error, 'Failed to delete response.');
  }
}

module.exports = {
  deleteResponse,
  getReminder,
  getQuestions,
  getResponses,
  getSummary,
  saveResponse,
  submitCheckIn,
  updateResponse,
  updateReminder
};
