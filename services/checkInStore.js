const CheckIn = require('../models/checkIns');
const ServiceError = require('./serviceError');
const { currentWeek } = require('./dateService');

const WEEK_ID_RE = /^\d{4}-W\d{2}$/;

function weekId(body = {}) {
  const requested = body.weekIdentifier;
  if (requested === undefined || requested === null || requested === '') {
    return currentWeek();
  }
  if (typeof requested !== 'string' || !WEEK_ID_RE.test(requested)) {
    throw new ServiceError(400, 'Week identifier must look like 2026-W22.');
  }
  return requested;
}

function query(user, weekIdentifier) {
  return { user: user._id, weekIdentifier };
}

function partnerId(user) {
  return user.partnerId || null;
}

async function findOrCreate(user, weekIdentifier) {
  const checkIn = await CheckIn.findOne(query(user, weekIdentifier));

  if (checkIn) return checkIn;

  return new CheckIn({
    ...query(user, weekIdentifier),
    partner: partnerId(user),
    responses: []
  });
}

// Adds each response to the check-in, replacing any earlier answer to the
// same question, and leaves answers to other questions untouched.
function upsertResponses(checkIn, responses) {
  return responses.map((response) => {
    const saved = checkIn.responses.find((item) => {
      return item.questionKey === response.questionKey;
    });

    if (saved) {
      Object.assign(saved, response);
      return saved;
    }

    checkIn.responses.push(response);
    return checkIn.responses[checkIn.responses.length - 1];
  });
}

module.exports = {
  findOrCreate,
  upsertResponses,
  weekId
};
