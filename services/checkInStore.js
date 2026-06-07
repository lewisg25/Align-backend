const CheckIn = require('../models/checkIns');
const { currentWeek } = require('./dateService');

function weekId(body) {
  return body.weekIdentifier || currentWeek();
}

function query(user, weekIdentifier) {
  return { user: user._id, weekIdentifier };
}

function partnerId(user) {
  return user.partnerId || null;
}

async function replaceCheckIn(user, weekIdentifier, responses) {
  return CheckIn.findOneAndUpdate(
    query(user, weekIdentifier),
    {
      weekIdentifier,
      user: user._id,
      partner: partnerId(user),
      responses,
      isCompleted: true
    },
    { new: true, upsert: true, runValidators: true }
  );
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

module.exports = {
  findOrCreate,
  replaceCheckIn,
  weekId
};
