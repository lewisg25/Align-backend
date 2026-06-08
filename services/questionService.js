const CheckIn = require('../models/checkIns');
const { findTier } = require('./relationshipTier');
const { yearsForUser } = require('./relationshipYears');
const {
  currentWeek,
  dateKey,
  tomorrowKey,
  utcTime
} = require('./dateService');
const { questionKey } = require('./questionKeys');
const {
  answeredQuestion,
  openQuestion,
  tierQuestions,
  todaysAnswer
} = require('./questionPicker');

const DEFAULT_TZ = 'America/New_York';
const answeredTodayMessage = [
  "You already completed today's check-in.",
  'Come back tomorrow for your next question.'
].join(' ');

async function dailyQuestions(user) {
  const yearsTogether = yearsForUser(user);
  const relationshipTier = findTier(yearsTogether, user.relationshipTier);
  const timezone = user.timezone || DEFAULT_TZ;
  const today = dateKey(new Date(), timezone);
  const weekIdentifier = currentWeek();
  const checkIn = await CheckIn.findOne({ user: user._id, weekIdentifier });
  const questions = await tierQuestions(relationshipTier);
  const todaysResponse = todaysAnswer(checkIn?.responses, timezone, today);

  if (todaysResponse) {
    return {
      yearsTogether,
      yearsMarried: yearsTogether,
      relationshipTier,
      weekIdentifier,
      lockedUntil: tomorrowKey(timezone),
      answeredToday: true,
      message: answeredTodayMessage,
      questions: [answeredQuestion(todaysResponse, relationshipTier)]
    };
  }

  const dailyQuestion = openQuestion(questions, checkIn?.responses);

  return {
    yearsTogether,
    yearsMarried: yearsTogether,
    relationshipTier,
    weekIdentifier,
    answeredToday: false,
    questions: dailyQuestion ? [dailyQuestion] : []
  };
}

module.exports = {
  currentWeek,
  dailyQuestions,
  dateKey,
  questionKey,
  utcTime
};
