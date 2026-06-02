const Question = require('../models/Questions');
const CheckIns = require('../models/checkIns');

const fallbackQuestions = {
  '1-3_years': [
    {
      questionId: 1001,
      text: "What is something you've learned about your partner recently that made you feel closer?",
      category: 'Foundation & Discovery',
      tier: '1-3_years'
    },
    {
      questionId: 1002,
      text: 'What is one tradition you would like to start together?',
      category: 'Habits & Traditions',
      tier: '1-3_years'
    },
    {
      questionId: 1003,
      text: 'How can you both communicate more clearly this week?',
      category: 'Communication',
      tier: '1-3_years'
    }
  ],
  '5-7_years': [
    {
      questionId: 5001,
      text: 'What part of your relationship are you most proud of today?',
      category: 'Growth',
      tier: '5-7_years'
    },
    {
      questionId: 5002,
      text: 'What helps you feel emotionally connected after all these years?',
      category: 'Connection',
      tier: '5-7_years'
    },
    {
      questionId: 5003,
      text: 'What would make this next chapter of your relationship more fulfilling?',
      category: 'Future Planning',
      tier: '5-7_years'
    }
  ],
  other: [
    {
      questionId: 9001,
      text: 'What is one way you can make your partner feel seen and appreciated today?',
      category: 'Emotional',
      tier: 'other'
    },
    {
      questionId: 9002,
      text: 'What shared goal would help you feel more aligned right now?',
      category: 'Future',
      tier: 'other'
    },
    {
      questionId: 9003,
      text: 'What conversation have you been putting off that could bring you closer?',
      category: 'Communication',
      tier: 'other'
    }
  ]
};

function tierFromYears(yearsTogether, savedTier) {
  if (savedTier && savedTier !== 'other') return savedTier;

  const years = Number(yearsTogether);
  if (years >= 1 && years <= 3) return '1-3_years';
  if (years >= 5 && years <= 7) return '5-7_years';

  return 'other';
}

function getCurrentWeekIdentifier() {
  const now = new Date();
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNumber = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);

  return `${date.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

function buildQuestionKey(response) {
  return String(response.questionId || response.questionKey || response.questionIdNumber || response.questionText || '');
}

function getQuestionKey(question) {
  return String(question._id || question.questionId || question.text);
}

function getDateKey(date, timeZone = 'America/New_York') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function dateKeyToUtcTime(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function getTomorrowDateKey(timeZone = 'America/New_York') {
  const todayKey = getDateKey(new Date(), timeZone);
  const tomorrowTime = dateKeyToUtcTime(todayKey) + 86400000;

  return new Date(tomorrowTime).toISOString().slice(0, 10);
}

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

async function getDailyQuestionsForUser(user) {
  const relationshipTier = tierFromYears(user.yearsTogether, user.relationshipTier);
  let questions = await Question.find({ tier: relationshipTier }).sort({ questionId: 1 });
  const timezone = user.timezone || 'America/New_York';
  const todayKey = getDateKey(new Date(), timezone);
  const weekIdentifier = getCurrentWeekIdentifier();
  const checkIn = await CheckIns.findOne({ user: user._id, weekIdentifier });
  const todaysResponse = checkIn?.responses.find(
    (response) => getDateKey(response.answeredAt, timezone) === todayKey
  );

  if (!questions.length) {
    questions = fallbackQuestions[relationshipTier] || fallbackQuestions.other;
  }

  if (todaysResponse) {
    return {
      yearsTogether: user.yearsTogether,
      relationshipTier,
      weekIdentifier,
      lockedUntil: getTomorrowDateKey(timezone),
      answeredToday: true,
      message: "You already completed today's check-in. Come back tomorrow for your next question.",
      questions: [{
        questionId: todaysResponse.questionKey,
        text: todaysResponse.questionText,
        category: todaysResponse.category,
        tier: relationshipTier,
        answeredToday: true
      }]
    };
  }

  const answeredKeys = new Set((checkIn?.responses || []).map((response) => response.questionKey));
  const unansweredQuestions = questions.filter((question) => !answeredKeys.has(getQuestionKey(question)));
  const dailyQuestion = getRandomItem(unansweredQuestions.length ? unansweredQuestions : questions);

  return {
    yearsTogether: user.yearsTogether,
    relationshipTier,
    weekIdentifier,
    answeredToday: false,
    questions: dailyQuestion ? [dailyQuestion] : []
  };
}

module.exports = {
  buildQuestionKey,
  dateKeyToUtcTime,
  getCurrentWeekIdentifier,
  getDailyQuestionsForUser,
  getDateKey
};
