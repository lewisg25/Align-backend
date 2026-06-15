const { normalizeYears, yearsForUser } = require('./relationshipYears');

const DEFAULT_TIME = '09:00';

function serializeUser(user) {
  const fallbackYears = yearsForUser(user);
  const yearsTogether = normalizeYears(user.yearsTogether) ?? fallbackYears;
  const yearsMarried = normalizeYears(user.yearsMarried) ?? fallbackYears;

  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    emailVerifiedAt: user.emailVerifiedAt,
    avatarUrl: user.avatarUrl,
    partnerId: user.partnerId,
    partnerName: user.partnerName || '',
    yearsTogether,
    yearsMarried,
    relationshipTier: user.relationshipTier,
    isPremium: user.isPremium,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastCheckInDate: user.lastCheckInDate,
    reminderEnabled: Boolean(user.reminderEnabled),
    reminderTime: user.reminderTime || DEFAULT_TIME,
    timezone: user.timezone
  };
}

module.exports = {
  serializeUser
};
