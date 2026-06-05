const Question = require('../models/Questions');
const CheckIn = require('../models/checkIns');

const makeQuestion = (tier, questionId, text, category) => ({
  questionId,
  text,
  category,
  tier
});

const fallbackList = {
  '1-3_years': [
    makeQuestion('1-3_years', 1001, "What is something you've learned about your partner recently that made you feel closer?", 'Foundation & Discovery'),
    makeQuestion('1-3_years', 1002, 'What is one tradition you would like to start together?', 'Habits & Traditions'),
    makeQuestion('1-3_years', 1003, 'How can you both communicate more clearly this week?', 'Communication')
  ],
  '5-7_years': [
    makeQuestion('5-7_years', 5001, 'What part of your relationship are you most proud of today?', 'Growth'),
    makeQuestion('5-7_years', 5002, 'What helps you feel emotionally connected after all these years?', 'Connection'),
    makeQuestion('5-7_years', 5003, 'What would make this next chapter of your relationship more fulfilling?', 'Future Planning')
  ],
  other: [
    makeQuestion('other', 9001, 'What is one way you can make your partner feel seen and appreciated today?', 'Emotional'),
    makeQuestion('other', 9002, 'What shared goal would help you feel more aligned right now?', 'Future'),
    makeQuestion('other', 9003, 'What conversation have you been putting off that could bring you closer?', 'Communication')
  ]
};

function findTier(yearsTogether, savedTier) {
  if (savedTier && savedTier !== 'other') return savedTier;

  const years = Number(yearsTogether);
  if (years >= 1 && years <= 3) return '1-3_years';
  if (years >= 5 && years <= 7) return '5-7_years';

  return 'other';
}

function currentWeek() {
  const now = new Date();
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNumber = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);

  return `${date.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

function questionKey(response) {
  return String(
    response.questionKey ||
    response.questionIdNumber ||
    response.questionNumber ||
    response.questionId ||
    response._id ||
    response.id ||
    response.questionText ||
    response.text ||
    ''
  );
}

function getKey(question) {
  return String(question.questionId || question._id || question.text);
}

function dateKey(date, timeZone = 'America/New_York') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function validDate(value) {
  const date = value instanceof Date ? value : new Date(value);

  return !Number.isNaN(date.getTime());
}

function utcTime(dateValue) {
  const [year, month, day] = dateValue.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function tomorrowKey(timeZone = 'America/New_York') {
  const today = dateKey(new Date(), timeZone);
  const tomorrowTime = utcTime(today) + 86400000;

  return new Date(tomorrowTime).toISOString().slice(0, 10);
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

async function dailyQuestions(user) {
  const relationshipTier = findTier(user.yearsTogether, user.relationshipTier);
  let questions = await Question.find({ tier: relationshipTier }).sort({ questionId: 1 });
  const timezone = user.timezone || 'America/New_York';
  const today = dateKey(new Date(), timezone);
  const weekIdentifier = currentWeek();
  const checkIn = await CheckIn.findOne({ user: user._id, weekIdentifier });
  const todaysResponse = checkIn?.responses.find(
    (response) => validDate(response.answeredAt) && dateKey(response.answeredAt, timezone) === today
  );

  if (!questions.length) {
    questions = fallbackList[relationshipTier] || fallbackList.other;
  }

  if (todaysResponse) {
    const key = questionKey(todaysResponse);

    return {
      yearsTogether: user.yearsTogether,
      relationshipTier,
      weekIdentifier,
      lockedUntil: tomorrowKey(timezone),
      answeredToday: true,
      message: "You already completed today's check-in. Come back tomorrow for your next question.",
      questions: [{
        questionId: key,
        text: todaysResponse.questionText,
        category: todaysResponse.category || 'Reflection',
        tier: relationshipTier,
        answeredToday: true
      }]
    };
  }

  const answeredKeys = new Set((checkIn?.responses || []).map(questionKey).filter(Boolean));
  const openQuestions = questions.filter((question) => !answeredKeys.has(getKey(question)));
  const dailyQuestion = randomItem(openQuestions.length ? openQuestions : questions);

  return {
    yearsTogether: user.yearsTogether,
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
