const { dailyQuestions } = require('../services/questionService');
const { serializeUser } = require('../services/userSerializer');

async function getDashboard(req, res) {
  try {
    const dailyCheckIn = await dailyQuestions(req.user);
    const user = serializeUser(req.user);
    delete user.partnerId;
    delete user.timezone;

    res.json({
      message: `Welcome, ${req.user.firstName}!`,
      user,
      dailyCheckIn,
      questions: dailyCheckIn.questions,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to load dashboard: ' + error.message });
  }
}

module.exports = {
  getDashboard
};
