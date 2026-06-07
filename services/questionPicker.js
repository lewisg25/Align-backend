const Question = require('../models/Questions');
const { fallbackList } = require('./fallbackQuestions');
const { dateKey, validDate } = require('./dateService');
const {
  questionKey,
  questionKeyFromQuestion
} = require('./questionKeys');

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

async function tierQuestions(relationshipTier) {
  const questions = await Question
    .find({ tier: relationshipTier })
    .sort({ questionId: 1 });

  return questions.length
    ? questions
    : fallbackList[relationshipTier] || fallbackList.other;
}

function todaysAnswer(responses = [], timezone, today) {
  return responses.find((response) => {
    return validDate(response.answeredAt) &&
      dateKey(response.answeredAt, timezone) === today;
  });
}

function answeredQuestion(response, relationshipTier) {
  return {
    questionId: questionKey(response),
    text: response.questionText,
    category: response.category || 'Reflection',
    tier: relationshipTier,
    answeredToday: true
  };
}

function openQuestion(questions, responses = []) {
  const answeredKeys = new Set(responses.map(questionKey).filter(Boolean));
  const openQuestions = questions.filter((question) => {
    return !answeredKeys.has(questionKeyFromQuestion(question));
  });

  return randomItem(openQuestions.length ? openQuestions : questions);
}

module.exports = {
  answeredQuestion,
  openQuestion,
  tierQuestions,
  todaysAnswer
};
