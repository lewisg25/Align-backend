const CheckIn = require('../models/checkIns');
const {
  currentWeek,
  dailyQuestions,
  dateKey,
  questionKey,
  utcTime,
} = require('../services/questionService');

function isMongoId(value) {
  return Boolean(value && String(value).match(/^[a-f\d]{24}$/i));
}

function responseId(response) {
  const candidate =
    response.questionMongoId ||
    response.questionObjectId ||
    response._id ||
    response.id ||
    response.questionId;

  return isMongoId(candidate) ? candidate : null;
}

function responseItems(body) {
  if (Array.isArray(body.responses) && body.responses.length) return body.responses;
  if (body.response && typeof body.response === 'object') return [body.response];
  return [body];
}

function cleanResponse(response) {
  const questionText = response.questionText || response.text || response.question;
  const answerText =
    response.answerText ||
    response.answer ||
    response.responseText ||
    response.learned;

  return {
    questionId: responseId(response),
    questionKey: questionKey({ ...response, questionText }),
    questionText,
    category: response.category || 'Reflection',
    answerText,
    moodScale: Number(response.moodScale) || 3,
    answeredAt: response.answeredAt || new Date(),
  };
}

async function updateStreak(user) {
  const now = new Date();
  const timezone = user.timezone || 'America/New_York';
  const todayKey = dateKey(now, timezone);
  const lastKey = user.lastCheckInDate
    ? dateKey(user.lastCheckInDate, timezone)
    : null;

  if (lastKey === todayKey) {
    return {
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      lastCheckInDate: user.lastCheckInDate,
    };
  }

  const dayDifference = lastKey
    ? Math.round(
        (utcTime(todayKey) - utcTime(lastKey)) / 86400000
      )
    : null;
  const currentStreak = dayDifference === 1 ? (user.currentStreak || 0) + 1 : 1;

  user.currentStreak = currentStreak;
  user.longestStreak = Math.max(user.longestStreak || 0, currentStreak);
  user.lastCheckInDate = now;
  await user.save();

  return {
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastCheckInDate: user.lastCheckInDate,
  };
}

async function getQuestions(req, res) {
  try {
    res.status(200).json(await dailyQuestions(req.user));
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to retrieve questions: ' + error.message });
  }
}

async function submitCheckIn(req, res) {
  const { weekIdentifier: weekId = currentWeek() } = req.body;

  try {
    const responses = responseItems(req.body)
      .map(cleanResponse)
      .filter((response) => response.questionText && response.answerText);

    if (!responses.length) {
      return res
        .status(400)
        .json({ error: 'At least one answered question is required.' });
    }

    const checkIn = await CheckIn.findOneAndUpdate(
      {
        weekIdentifier: weekId,
        user: req.user._id,
      },
      {
        weekIdentifier: weekId,
        user: req.user._id,
        partner: req.user.partnerId || null,
        responses,
        isCompleted: true,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    const streak = await updateStreak(req.user);

    res.status(200).json({
      message: 'Check-in submitted successfully',
      checkIn,
      streak,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to submit check-in: ' + error.message,
    });
  }
}

async function saveResponse(req, res) {
  const { weekIdentifier: weekId = currentWeek() } = req.body;
  const response = cleanResponse(req.body);

  if (!response.questionText || !response.answerText) {
    return res
      .status(400)
      .json({ error: 'Question text and answer text are required.' });
  }

  try {
    let checkIn = await CheckIn.findOne({
      user: req.user._id,
      weekIdentifier: weekId,
    });

    if (!checkIn) {
      checkIn = new CheckIn({
        weekIdentifier: weekId,
        user: req.user._id,
        partner: req.user.partnerId || null,
        responses: [],
      });
    }

    const savedResponse = checkIn.responses.find(
      (item) => item.questionKey === response.questionKey
    );

    if (savedResponse) {
      Object.assign(savedResponse, response);
    } else {
      checkIn.responses.push(response);
    }

    checkIn.isCompleted = true;
    await checkIn.save();
    const streak = await updateStreak(req.user);

    return res.status(200).json({
      message: 'Thank you for your response.',
      weekIdentifier: weekId,
      checkInId: checkIn._id,
      responses: checkIn.responses,
      streak,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Failed to save response: ' + error.message });
  }
}

module.exports = {
  getQuestions,
  saveResponse,
  submitCheckIn
};
