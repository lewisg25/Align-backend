const { questionKey } = require('./questionKeys');

const DEFAULT_MOOD = 3;

function isMongoId(value) {
  return Boolean(value && /^[a-f\d]{24}$/i.test(String(value)));
}

function responseId(response) {
  const id =
    response.questionMongoId ||
    response.questionObjectId ||
    response._id ||
    response.id ||
    response.questionId;

  return isMongoId(id) ? id : null;
}

function responseItems(body) {
  if (Array.isArray(body.responses) && body.responses.length) {
    return body.responses;
  }
  if (body.response && typeof body.response === 'object') {
    return [body.response];
  }
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
    moodScale: Number(response.moodScale) || DEFAULT_MOOD,
    answeredAt: response.answeredAt || new Date()
  };
}

function usableResponse(response) {
  return response.questionText && response.answerText;
}

module.exports = {
  cleanResponse,
  responseItems,
  usableResponse
};
