const { getDailyQuestionsForUser } = require("../services/questionService");

async function getDashboard(req, res) {
  try {
    const dailyCheckIn = await getDailyQuestionsForUser(req.user);

    res.json({
      message: `Welcome, ${req.user.firstName}!`,
      user: {
        id: req.user._id.toString(),
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        fullName: req.user.fullName,
        email: req.user.email,
        avatarUrl: req.user.avatarUrl,
        isPremium: req.user.isPremium,
        yearsTogether: req.user.yearsTogether,
        relationshipTier: req.user.relationshipTier,
        currentStreak: req.user.currentStreak,
        longestStreak: req.user.longestStreak,
        lastCheckInDate: req.user.lastCheckInDate,
      },
      dailyCheckIn,
      questions: dailyCheckIn.questions,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to load dashboard: " + error.message });
  }
}

module.exports = {
  getDashboard,
};
