const { dailyQuestions } = require('./questionService');
const ServiceError = require('./serviceError');
const {
  cleanResponse,
  responseItems,
  usableResponse
} = require('./checkInResponses');
const {
  findOrCreate,
  replaceCheckIn,
  weekId
} = require('./checkInStore');
const { updateStreak } = require('./streakService');

async function getQuestions(user) {
  try {
    return await dailyQuestions(user);
  } catch (error) {
    throw new ServiceError(500, 'Failed to retrieve questions: ' + error.message);
  }
}

async function submitCheckIn(user, body) {
  const currentWeekId = weekId(body);
  const responses = responseItems(body).map(cleanResponse).filter(usableResponse);

  if (!responses.length) {
    throw new ServiceError(400, 'At least one answered question is required.');
  }

  return {
    message: 'Check-in submitted successfully',
    checkIn: await replaceCheckIn(user, currentWeekId, responses),
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
  const saved = checkIn.responses.find((item) => {
    return item.questionKey === response.questionKey;
  });

  if (saved) Object.assign(saved, response);
  else checkIn.responses.push(response);

  checkIn.isCompleted = true;
  await checkIn.save();

  return {
    message: 'Thank you for your response.',
    weekIdentifier: currentWeekId,
    checkInId: checkIn._id,
    responses: checkIn.responses,
    streak: await updateStreak(user)
  };
}

module.exports = {
  getQuestions,
  saveResponse,
  submitCheckIn
};
