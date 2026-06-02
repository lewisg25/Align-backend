const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
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

function buildWeeklyInsights(checkIn) {
  return checkIn.responses.map((response) => ({
    category: response.category,
    questionText: response.questionText,
    learned: response.answerText,
    moodScale: response.moodScale,
    answeredAt: response.answeredAt
  }));
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

async function updateUserStreak(user) {
  const now = new Date();
  const timezone = user.timezone || 'America/New_York';
  const todayKey = getDateKey(now, timezone);
  const lastKey = user.lastCheckInDate ? getDateKey(user.lastCheckInDate, timezone) : null;

  if (lastKey === todayKey) {
    return {
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      lastCheckInDate: user.lastCheckInDate
    };
  }

  const dayDifference = lastKey
    ? Math.round((dateKeyToUtcTime(todayKey) - dateKeyToUtcTime(lastKey)) / 86400000)
    : null;
  const currentStreak = dayDifference === 1 ? (user.currentStreak || 0) + 1 : 1;

  user.currentStreak = currentStreak;
  user.longestStreak = Math.max(user.longestStreak || 0, currentStreak);
  user.lastCheckInDate = now;
  await user.save();

  return {
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastCheckInDate: user.lastCheckInDate
  };
}

function getTomorrowDateKey(timeZone = 'America/New_York') {
  const todayKey = getDateKey(new Date(), timeZone);
  const tomorrowTime = dateKeyToUtcTime(todayKey) + 86400000;

  return new Date(tomorrowTime).toISOString().slice(0, 10);
}

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

// ==========================================
// ROUTE 1: Fetch questions matching user tier
// ==========================================
router.get('/questions', requireAuth, async (req, res) => {
  try {
    const relationshipTier = tierFromYears(req.user.yearsTogether, req.user.relationshipTier);
    let questions = await Question.find({ tier: relationshipTier }).sort({ questionId: 1 });
    const timezone = req.user.timezone || 'America/New_York';
    const todayKey = getDateKey(new Date(), timezone);
    const weekIdentifier = getCurrentWeekIdentifier();
    const checkIn = await CheckIns.findOne({ user: req.user._id, weekIdentifier });
    const todaysResponse = checkIn?.responses.find(
      (response) => getDateKey(response.answeredAt, timezone) === todayKey
    );

    if (!questions.length) {
      questions = fallbackQuestions[relationshipTier] || fallbackQuestions.other;
    }

    if (todaysResponse) {
      return res.status(200).json({
        yearsTogether: req.user.yearsTogether,
        relationshipTier,
        weekIdentifier,
        lockedUntil: getTomorrowDateKey(timezone),
        answeredToday: true,
        message: 'You already completed today’s check-in. Come back tomorrow for your next question.',
        questions: [{
          questionId: todaysResponse.questionKey,
          text: todaysResponse.questionText,
          category: todaysResponse.category,
          tier: relationshipTier,
          answeredToday: true
        }]
      });
    }

    const answeredKeys = new Set((checkIn?.responses || []).map((response) => response.questionKey));
    const unansweredQuestions = questions.filter((question) => !answeredKeys.has(getQuestionKey(question)));
    const dailyQuestion = getRandomItem(unansweredQuestions.length ? unansweredQuestions : questions);

    res.status(200).json({
      yearsTogether: req.user.yearsTogether,
      relationshipTier,
      weekIdentifier,
      answeredToday: false,
      questions: dailyQuestion ? [dailyQuestion] : []
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve questions: ' + error.message });
  }
});

// ==========================================
// ROUTE 2: Submit a completed weekly check-in
// ==========================================
router.post('/submit', requireAuth, async (req, res) => {
  const { weekIdentifier = getCurrentWeekIdentifier(), responses = [] } = req.body;

  try {
    const normalizedResponses = responses.map((response) => ({
      questionId: response.questionId && String(response.questionId).match(/^[a-f\d]{24}$/i)
        ? response.questionId
        : null,
      questionKey: buildQuestionKey(response),
      questionText: response.questionText,
      category: response.category || 'Reflection',
      answerText: response.answerText,
      moodScale: Number(response.moodScale) || 3,
      answeredAt: response.answeredAt || new Date()
    }));

    const checkIn = await CheckIns.findOneAndUpdate({
      weekIdentifier,
      user: req.user._id
    }, {
      weekIdentifier,
      user: req.user._id,
      partner: req.user.partnerId || null,
      responses: normalizedResponses,
      isCompleted: true
    }, {
      new: true,
      upsert: true,
      runValidators: true
    });
    
    const streak = await updateUserStreak(req.user);

    res.status(201).json({
      message: 'Thank you for your response.',
      checkInId: checkIn._id,
      streak
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save check-in: ' + error.message });
  }
});

router.post('/response', requireAuth, async (req, res) => {
  const {
    weekIdentifier = getCurrentWeekIdentifier(),
    questionId,
    questionKey,
    questionIdNumber,
    questionText,
    category,
    answerText,
    moodScale = 3
  } = req.body;

  if (!questionText || !answerText) {
    return res.status(400).json({ error: 'Question text and answer text are required.' });
  }

  const normalizedQuestionKey = buildQuestionKey({
    questionId,
    questionKey,
    questionIdNumber,
    questionText
  });

  try {
    let checkIn = await CheckIns.findOne({ user: req.user._id, weekIdentifier });

    if (!checkIn) {
      checkIn = new CheckIns({
        weekIdentifier,
        user: req.user._id,
        partner: req.user.partnerId || null,
        responses: []
      });
    }

    const existingResponse = checkIn.responses.find(
      (response) => response.questionKey === normalizedQuestionKey
    );
    const responsePayload = {
      questionId: questionId && String(questionId).match(/^[a-f\d]{24}$/i) ? questionId : null,
      questionKey: normalizedQuestionKey,
      questionText,
      category: category || 'Reflection',
      answerText,
      moodScale: Number(moodScale) || 3,
      answeredAt: new Date()
    };

    if (existingResponse) {
      Object.assign(existingResponse, responsePayload);
    } else {
      checkIn.responses.push(responsePayload);
    }

    await checkIn.save();
    const streak = await updateUserStreak(req.user);

    return res.status(200).json({
      message: 'Thank you for your response.',
      weekIdentifier,
      checkInId: checkIn._id,
      responses: checkIn.responses,
      streak
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save response: ' + error.message });
  }
});

// ==========================================
// ROUTE 3: Get side-by-side comparative summary
// ==========================================
router.get('/summary/:weekIdentifier', requireAuth, async (req, res) => {
  const { weekIdentifier } = req.params;

  try {
    // Fetch both the logged-in user's answers AND their partner's answers for this specific week
    const userAnswers = await CheckIns.findOne({ user: req.user._id, weekIdentifier });

    if (!userAnswers || !userAnswers.responses.length) {
      return res.status(200).json({
        status: 'Pending',
        message: 'Answer a few prompts this week to unlock your weekly summary.',
        insights: []
      });
    }

    if (!req.user.partnerId) {
      return res.status(200).json({
        status: 'Unlocked',
        mode: 'solo',
        message: 'Here is what your reflections captured this week.',
        insights: buildWeeklyInsights(userAnswers)
      });
    }

    const partnerAnswers = await CheckIns.findOne({ user: req.user.partnerId, weekIdentifier });

    // If either partner hasn't finished, don't show the summary yet! Keep it a surprise.
    if (!partnerAnswers || !partnerAnswers.responses.length) {
      return res.status(200).json({ 
        status: "Pending", 
        message: "Waiting for your partner to submit entries before revealing this week's comparison.",
        insights: buildWeeklyInsights(userAnswers)
      });
    }

    // Match the questions up side-by-side so the frontend can display them easily
    const comparisonReport = userAnswers.responses.map(uResp => {
      const matchingPartnerResp = partnerAnswers.responses.find(
        pResp => pResp.questionKey === uResp.questionKey
      );

      return {
        questionText: uResp.questionText,
        category: uResp.category,
        yourAnswer: uResp.answerText,
        yourMood: uResp.moodScale,
        partnerAnswer: matchingPartnerResp ? matchingPartnerResp.answerText : "No data registered",
        partnerMood: matchingPartnerResp ? matchingPartnerResp.moodScale : null
      };
    });

    res.status(200).json({ status: "Unlocked", report: comparisonReport });
  } catch (error) {
    res.status(500).json({ error: 'Failed to build summary: ' + error.message });
  }
});

module.exports = router;
