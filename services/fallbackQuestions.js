const makeQuestion = (tier, questionId, text, category) => ({
  questionId,
  text,
  category,
  tier
});

const fallbackList = {
  '1-3_years': [
    makeQuestion(
      '1-3_years',
      1001,
      "What is something you've learned about your partner recently that made you feel closer?",
      'Foundation & Discovery'
    ),
    makeQuestion(
      '1-3_years',
      1002,
      'What is one tradition you would like to start together?',
      'Habits & Traditions'
    ),
    makeQuestion(
      '1-3_years',
      1003,
      'How can you both communicate more clearly this week?',
      'Communication'
    )
  ],
  '5-7_years': [
    makeQuestion(
      '5-7_years',
      5001,
      'What part of your relationship are you most proud of today?',
      'Growth'
    ),
    makeQuestion(
      '5-7_years',
      5002,
      'What helps you feel emotionally connected after all these years?',
      'Connection'
    ),
    makeQuestion(
      '5-7_years',
      5003,
      'What would make this next chapter of your relationship more fulfilling?',
      'Future Planning'
    )
  ],
  other: [
    makeQuestion(
      'other',
      9001,
      'What is one way you can make your partner feel seen and appreciated today?',
      'Emotional'
    ),
    makeQuestion(
      'other',
      9002,
      'What shared goal would help you feel more aligned right now?',
      'Future'
    ),
    makeQuestion(
      'other',
      9003,
      'What conversation have you been putting off that could bring you closer?',
      'Communication'
    )
  ]
};

module.exports = {
  fallbackList
};
