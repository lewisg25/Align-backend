const DEFAULT_TIME = '09:00';

function serializeUser(user) {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    partnerId: user.partnerId,
    yearsTogether: user.yearsTogether,
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
