const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const CheckIns = require("../models/checkIns");
const {
  buildQuestionKey,
  dateKeyToUtcTime,
  getCurrentWeekIdentifier,
  getDailyQuestionsForUser,
  getDateKey,
} = require("../services/questionService");

function isMongoObjectId(value) {
  return Boolean(value && String(value).match(/^[a-f\d]{24}$/i));
}

function getQuestionObjectId(response) {
  const candidate =
    response.questionMongoId ||
    response.questionObjectId ||
    response._id ||
    response.id ||
    response.questionId;

  return isMongoObjectId(candidate) ? candidate : null;
}

function getResponseItems(body) {
  if (Array.isArray(body.responses) && body.responses.length) return body.responses;
  if (body.response && typeof body.response === "object") return [body.response];
  return [body];
}

function normalizeResponse(response) {
  const questionText =
    response.questionText || response.text || response.question;
  const answerText =
    response.answerText ||
    response.answer ||
    response.responseText ||
    response.learned;

  return {
    questionId: getQuestionObjectId(response),
    questionKey: buildQuestionKey(response),
    questionText,
    category: response.category || "Reflection",
    answerText,
    moodScale: Number(response.moodScale) || 3,
    answeredAt: response.answeredAt || new Date(),
  };
}

async function updateUserStreak(user) {
  const now = new Date();
  const timezone = user.timezone || "America/New_York";
  const todayKey = getDateKey(now, timezone);
  const lastKey = user.lastCheckInDate
    ? getDateKey(user.lastCheckInDate, timezone)
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
        (dateKeyToUtcTime(todayKey) - dateKeyToUtcTime(lastKey)) / 86400000
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

router.get("/questions", requireAuth, async (req, res) => {
  try {
    res.status(200).json(await getDailyQuestionsForUser(req.user));
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to retrieve questions: " + error.message });
  }
});

router.post("/submit", requireAuth, async (req, res) => {
  const { weekIdentifier = getCurrentWeekIdentifier() } = req.body;

  try {
    const normalizedResponses = getResponseItems(req.body)
      .map(normalizeResponse)
      .filter((response) => response.questionText && response.answerText);

    if (!normalizedResponses.length) {
      return res
        .status(400)
        .json({ error: "At least one answered question is required." });
    }

    const checkIn = await CheckIns.findOneAndUpdate(
      {
        weekIdentifier,
        user: req.user._id,
      },
      {
        weekIdentifier,
        user: req.user._id,
        partner: req.user.partnerId || null,
        responses: normalizedResponses,
        isCompleted: true,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    const streak = await updateUserStreak(req.user);

    res.status(200).json({
      message: "Check-in submitted successfully",
      checkIn,
      streak,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to submit check-in: " + error.message,
    });
  }
});

router.post("/response", requireAuth, async (req, res) => {
  const { weekIdentifier = getCurrentWeekIdentifier() } = req.body;
  const responsePayload = normalizeResponse(req.body);

  if (!responsePayload.questionText || !responsePayload.answerText) {
    return res
      .status(400)
      .json({ error: "Question text and answer text are required." });
  }

  try {
    let checkIn = await CheckIns.findOne({
      user: req.user._id,
      weekIdentifier,
    });

    if (!checkIn) {
      checkIn = new CheckIns({
        weekIdentifier,
        user: req.user._id,
        partner: req.user.partnerId || null,
        responses: [],
      });
    }

    const existingResponse = checkIn.responses.find(
      (response) => response.questionKey === responsePayload.questionKey
    );

    if (existingResponse) {
      Object.assign(existingResponse, responsePayload);
    } else {
      checkIn.responses.push(responsePayload);
    }

    checkIn.isCompleted = true;
    await checkIn.save();
    const streak = await updateUserStreak(req.user);

    return res.status(200).json({
      message: "Thank you for your response.",
      weekIdentifier,
      checkInId: checkIn._id,
      responses: checkIn.responses,
      streak,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to save response: " + error.message });
  }
});

module.exports = router;
