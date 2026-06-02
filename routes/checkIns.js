// const express = require('express');
// const router = express.Router();
// const requireAuth = require('../middleware/auth');
// const CheckIns = require('../models/checkIns');
// const {
//   buildQuestionKey,
//   dateKeyToUtcTime,
//   getCurrentWeekIdentifier,
//   getDailyQuestionsForUser,
//   getDateKey
// } = require('../services/questionService');

// function buildWeeklyInsights(checkIn) {
//   return checkIn.responses.map((response) => ({
//     category: response.category,
//     questionText: response.questionText,
//     learned: response.answerText,
//     moodScale: response.moodScale,
//     answeredAt: response.answeredAt
//   }));
// }

// async function updateUserStreak(user) {
//   const now = new Date();
//   const timezone = user.timezone || 'America/New_York';
//   const todayKey = getDateKey(now, timezone);
//   const lastKey = user.lastCheckInDate ? getDateKey(user.lastCheckInDate, timezone) : null;

//   if (lastKey === todayKey) {
//     return {
//       currentStreak: user.currentStreak || 0,
//       longestStreak: user.longestStreak || 0,
//       lastCheckInDate: user.lastCheckInDate
//     };
//   }

//   const dayDifference = lastKey
//     ? Math.round((dateKeyToUtcTime(todayKey) - dateKeyToUtcTime(lastKey)) / 86400000)
//     : null;
//   const currentStreak = dayDifference === 1 ? (user.currentStreak || 0) + 1 : 1;

//   user.currentStreak = currentStreak;
//   user.longestStreak = Math.max(user.longestStreak || 0, currentStreak);
//   user.lastCheckInDate = now;
//   await user.save();

//   return {
//     currentStreak: user.currentStreak,
//     longestStreak: user.longestStreak,
//     lastCheckInDate: user.lastCheckInDate
//   };
// }

// // ==========================================
// // ROUTE 1: Fetch questions matching user tier
// // ==========================================
// router.get('/questions', requireAuth, async (req, res) => {
//   try {
//     res.status(200).json(await getDailyQuestionsForUser(req.user));
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to retrieve questions: ' + error.message });
//   }
// });

// // ==========================================
// // ROUTE 2: Submit a completed weekly check-in
// // ==========================================
// router.post('/submit', requireAuth, async (req, res) => {
//   const { weekIdentifier = getCurrentWeekIdentifier(), responses = [] } = req.body;

//   try {
//     const normalizedResponses = responses.map((response) => ({
//       questionId: response.questionId && String(response.questionId).match(/^[a-f\d]{24}$/i)
//         ? response.questionId
//         : null,
//       questionKey: buildQuestionKey(response),
//       questionText: response.questionText,
//       category: response.category || 'Reflection',
//       answerText: response.answerText,
//       moodScale: Number(response.moodScale) || 3,
//       answeredAt: response.answeredAt || new Date()
//     }));

//     const checkIn = await CheckIns.findOneAndUpdate({
//       weekIdentifier,
//       user: req.user._id
//     }, {
//       weekIdentifier,
//       user: req.user._id,
//       partner: req.user.partnerId || null,
//       responses: normalizedResponses,
//       isCompleted: true
//     }, {
//       new: true,
//       upsert: true,
//       runValidators: true
//     });
    
//     const streak = await updateUserStreak(req.user);

//     res.status(201).json({
//       message: 'Thank you for your response.',
//       checkInId: checkIn._id,
//       streak
//     });
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to save check-in: ' + error.message });
//   }
// });

// router.post('/response', requireAuth, async (req, res) => {
//   const {
//     weekIdentifier = getCurrentWeekIdentifier(),
//     questionId,
//     questionKey,
//     questionIdNumber,
//     questionText,
//     category,
//     answerText,
//     moodScale = 3
//   } = req.body;

//   if (!questionText || !answerText) {
//     return res.status(400).json({ error: 'Question text and answer text are required.' });
//   }

//   const normalizedQuestionKey = buildQuestionKey({
//     questionId,
//     questionKey,
//     questionIdNumber,
//     questionText
//   });

//   try {
//     let checkIn = await CheckIns.findOne({ user: req.user._id, weekIdentifier });

//     if (!checkIn) {
//       checkIn = new CheckIns({
//         weekIdentifier,
//         user: req.user._id,
//         partner: req.user.partnerId || null,
//         responses: []
//       });
//     }

//     const existingResponse = checkIn.responses.find(
//       (response) => response.questionKey === normalizedQuestionKey
//     );
//     const responsePayload = {
//       questionId: questionId && String(questionId).match(/^[a-f\d]{24}$/i) ? questionId : null,
//       questionKey: normalizedQuestionKey,
//       questionText,
//       category: category || 'Reflection',
//       answerText,
//       moodScale: Number(moodScale) || 3,
//       answeredAt: new Date()
//     };

//     if (existingResponse) {
//       Object.assign(existingResponse, responsePayload);
//     } else {
//       checkIn.responses.push(responsePayload);
//     }

//     await checkIn.save();
//     const streak = await updateUserStreak(req.user);

//     return res.status(200).json({
//       message: 'Thank you for your response.',
//       weekIdentifier,
//       checkInId: checkIn._id,
//       responses: checkIn.responses,
//       streak
//     });
//   } catch (error) {
//     return res.status(500).json({ error: 'Failed to save response: ' + error.message });
//   }
// });

// // ==========================================
// // ROUTE 3: Get side-by-side comparative summary
// // ==========================================
// router.get('/summary/:weekIdentifier', requireAuth, async (req, res) => {
//   const { weekIdentifier } = req.params;

//   try {
//     // Fetch both the logged-in user's answers AND their partner's answers for this specific week
//     const userAnswers = await CheckIns.findOne({ user: req.user._id, weekIdentifier });

//     if (!userAnswers || !userAnswers.responses.length) {
//       return res.status(200).json({
//         status: 'Pending',
//         message: 'Answer a few prompts this week to unlock your weekly summary.',
//         insights: []
//       });
//     }

//     if (!req.user.partnerId) {
//       return res.status(200).json({
//         status: 'Unlocked',
//         mode: 'solo',
//         message: 'Here is what your reflections captured this week.',
//         insights: buildWeeklyInsights(userAnswers)
//       });
//     }

//     const partnerAnswers = await CheckIns.findOne({ user: req.user.partnerId, weekIdentifier });

//     // If either partner hasn't finished, don't show the summary yet! Keep it a surprise.
//     if (!partnerAnswers || !partnerAnswers.responses.length) {
//       return res.status(200).json({ 
//         status: "Pending", 
//         message: "Waiting for your partner to submit entries before revealing this week's comparison.",
//         insights: buildWeeklyInsights(userAnswers)
//       });
//     }

//     // Match the questions up side-by-side so the frontend can display them easily
//     const comparisonReport = userAnswers.responses.map(uResp => {
//       const matchingPartnerResp = partnerAnswers.responses.find(
//         pResp => pResp.questionKey === uResp.questionKey
//       );

//       return {
//         questionText: uResp.questionText,
//         category: uResp.category,
//         yourAnswer: uResp.answerText,
//         yourMood: uResp.moodScale,
//         partnerAnswer: matchingPartnerResp ? matchingPartnerResp.answerText : "No data registered",
//         partnerMood: matchingPartnerResp ? matchingPartnerResp.moodScale : null
//       };
//     });

//     res.status(200).json({ status: "Unlocked", report: comparisonReport });
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to build summary: ' + error.message });
//   }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const CheckIns = require('../models/checkIns');
const {
  buildQuestionKey,
  dateKeyToUtcTime,
  getCurrentWeekIdentifier,
  getDailyQuestionsForUser,
  getDateKey
} = require('../services/questionService');

function buildWeeklyInsights(checkIn) {
  return checkIn.responses.map((response) => ({
    category: response.category,
    questionText: response.questionText,
    learned: response.answerText,
    moodScale: response.moodScale,
    answeredAt: response.answeredAt
  }));
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

// ==========================================
// ROUTE 1: Fetch questions matching user tier
// ==========================================
router.get('/questions', requireAuth, async (req, res) => {
  try {
    res.status(200).json(await getDailyQuestionsForUser(req.user));
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

    const checkIn = await CheckIns.findOneAndUpdate(
      {
        weekIdentifier,
        user: req.user._id
      },
      {
        weekIdentifier,
        user: req.user._id,
        partner: req.user.partnerId || null,
        responses: normalizedResponses,
        isCompleted: true
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    const streak = await updateUserStreak(req.user);

    res.status(200).json({
      message: 'Check-in submitted successfully',
      checkIn,
      streak
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to submit check-in: ' + error.message
    });
  }
});

    module.exports = router;