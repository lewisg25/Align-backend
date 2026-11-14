const { dailyQuestions } = require('./questionService');
const ServiceError = require('./serviceError');
const {
  cleanResponse,
  responsePayload,
  responseItems,
  usableResponse
} = require('./checkInResponses');
const {
  findOrCreate,
  upsertResponses,
  weekId
} = require('./checkInStore');
const { updateStreak } = require('./streakService');
const CheckIn = require('../models/checkIns');
const mongoose = require('mongoose');

function assertResponseId(responseId) {
  if (!mongoose.isValidObjectId(responseId)) {
    throw new ServiceError(404, 'Saved response was not found.');
  }
}

async function getQuestions(user) {
  return dailyQuestions(user);
}

async function submitCheckIn(user, body) {
  const currentWeekId = weekId(body);
  const responses = responseItems(body).map(cleanResponse).filter(usableResponse);

  if (!responses.length) {
    throw new ServiceError(400, 'At least one answered question is required.');
  }

  const checkIn = await findOrCreate(user, currentWeekId);
  upsertResponses(checkIn, responses);
  checkIn.isCompleted = true;
  await checkIn.save();

  return {
    message: 'Check-in submitted successfully',
    checkIn,
    streak: await updateStreak(user)
  };
}

async function saveResponse(user, body) {
  const currentWeekId = weekId(body);
  const response = cleanResponse(body);

  if (!usableResponse(response)) {
    throw new ServiceError(400, 'Question text and answer text are required.');
  }

  const checkIn = await findOrCreate(user, currentWeekId);
  const [saved] = upsertResponses(checkIn, [response]);

  checkIn.isCompleted = true;
  await checkIn.save();

  return {
    message: 'Thank you for your response.',
    weekIdentifier: currentWeekId,
    checkInId: checkIn._id,
    response: responsePayload(saved, currentWeekId),
    responses: checkIn.responses,
    streak: await updateStreak(user)
  };
}

async function getResponses(user) {
  const checkIns = await CheckIn.find({ user: user._id }).sort({ updatedAt: -1 });
  const responses = checkIns.flatMap((checkIn) =>
    checkIn.responses.map((response) => responsePayload(response, checkIn.weekIdentifier))
  );

  return {
    responses: responses.sort((first, second) => {
      return new Date(second.answeredAt) - new Date(first.answeredAt);
    })
  };
}

async function updateResponse(user, responseId, body) {
  assertResponseId(responseId);
  const checkIn = await CheckIn.findOne({ user: user._id, 'responses._id': responseId });
  const saved = checkIn?.responses.id(responseId);

  if (!saved) {
    throw new ServiceError(404, 'Saved response was not found.');
  }

  // Drop the response's own id fields so cleanResponse doesn't mistake them
  // for the question's id, and keep the original questionKey so the edit
  // stays linked to the same question.
  const { _id, id, ...existing } = saved.toObject();
  const { _id: bodyMongoId, id: bodyId, questionKey: bodyKey, ...changes } = body || {};
  const response = cleanResponse({ ...existing, ...changes, questionKey: existing.questionKey });

  if (!usableResponse(response)) {
    throw new ServiceError(400, 'Question text and answer text are required.');
  }

  Object.assign(saved, response);
  await checkIn.save();

  return {
    message: 'Your response was updated.',
    weekIdentifier: checkIn.weekIdentifier,
    checkInId: checkIn._id,
    response: responsePayload(saved, checkIn.weekIdentifier)
  };
}

async function deleteResponse(user, responseId) {
  assertResponseId(responseId);
  const checkIn = await CheckIn.findOne({ user: user._id, 'responses._id': responseId });
  const saved = checkIn?.responses.id(responseId);

  if (!saved) {
    throw new ServiceError(404, 'Saved response was not found.');
  }

  checkIn.responses.pull(responseId);
  checkIn.isCompleted = checkIn.responses.length > 0;
  await checkIn.save();

  return {
    message: 'Your response was deleted.',
    deletedResponseId: responseId,
    weekIdentifier: checkIn.weekIdentifier,
    checkInId: checkIn._id
  };
}

async function weeklySummary(user, requestedWeekId) {
  const currentWeekId = weekId({ weekIdentifier: requestedWeekId });
  const checkIn = await CheckIn.findOne({ user: user._id, weekIdentifier: currentWeekId });
  const insights = (checkIn?.responses || []).map((response) => ({
    category: response.category,
    questionText: response.questionText,
    learned: response.answerText,
    answeredAt: response.answeredAt
  }));

  return {
    message: insights.length
      ? `You saved ${insights.length} response${insights.length === 1 ? '' : 's'} this week.`
      : 'Save responses to build your weekly summary.',
    insights
  };
}

module.exports = {
  deleteResponse,
  getQuestions,
  getResponses,
  saveResponse,
  submitCheckIn,
  updateResponse,
  weeklySummary
};
