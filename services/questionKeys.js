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

function questionKeyFromQuestion(question) {
  return String(question.questionId || question._id || question.text);
}

module.exports = {
  questionKey,
  questionKeyFromQuestion
};
