const { dateKey, utcTime } = require('./dateService');

const DAY_MS = 86400000;
const DEFAULT_TZ = 'America/New_York';

function snapshot(user) {
  return {
    currentStreak: user.currentStreak || 0,
    longestStreak: user.longestStreak || 0,
    lastCheckInDate: user.lastCheckInDate
  };
}

async function updateStreak(user) {
  const now = new Date();
  const timezone = user.timezone || DEFAULT_TZ;
  const today = dateKey(now, timezone);
  const last = user.lastCheckInDate
    ? dateKey(user.lastCheckInDate, timezone)
    : null;

  if (last === today) return snapshot(user);

  const gap = last ? Math.round((utcTime(today) - utcTime(last)) / DAY_MS) : 0;
  user.currentStreak = gap === 1 ? (user.currentStreak || 0) + 1 : 1;
  user.longestStreak = Math.max(user.longestStreak || 0, user.currentStreak);
  user.lastCheckInDate = now;
  await user.save();

  return snapshot(user);
}

module.exports = {
  updateStreak
};
