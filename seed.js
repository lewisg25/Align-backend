require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("./models/Questions");

const STAGE_TIERS = Object.freeze({
  "1-3 Years": "1-3_years",
  "5-7 Years": "5-7_years",
});

const questions = [
  // 1-3 Years
  {
    relationshipStage: "1-3 Years",
    category: "Foundation & Discovery",
    question:
      "What is something you've learned about me in the past year that surprised you?",
  },
  {
    relationshipStage: "1-3 Years",
    category: "Foundation & Discovery",
    question:
      "What habit of ours do you think strengthens our relationship the most?",
  },
  {
    relationshipStage: "1-3 Years",
    category: "Foundation & Discovery",
    question: "What is one thing you wish we did more often together?",
  },
  {
    relationshipStage: "1-3 Years",
    category: "Foundation & Discovery",
    question: "How do you feel most supported by me?",
  },
  {
    relationshipStage: "1-3 Years",
    category: "Future Planning",
    question:
      "What are three goals you'd like us to accomplish as a couple in the next year?",
  },
  {
    relationshipStage: "1-3 Years",
    category: "Foundation & Discovery",
    question: "What first attracted you to me, and has that changed?",
  },
  {
    relationshipStage: "1-3 Years",
    category: "Growth",
    question:
      "What is a challenge we've overcome together that makes you proud?",
  },
  {
    relationshipStage: "1-3 Years",
    category: "Communication",
    question: "How do you prefer to handle disagreements?",
  },
  {
    relationshipStage: "1-3 Years",
    category: "Communication",
    question: "What does quality time mean to you?",
  },
  {
    relationshipStage: "1-3 Years",
    category: "Habits & Traditions",
    question: "What is one tradition you'd like us to start together?",
  },
  {
    relationshipStage: "1-3 Years",
    category: "Future Planning",
    question: "What are your biggest hopes for our future?",
  },
  {
    relationshipStage: "1-3 Years",
    category: "Connection",
    question: "What makes you feel most appreciated in our relationship?",
  },
  {
    relationshipStage: "1-3 Years",
    category: "Personal Growth",
    question:
      "What is something you're still learning about yourself through our relationship?",
  },
  {
    relationshipStage: "1-3 Years",
    category: "Future Planning",
    question: "What financial goal would you like us to work toward together?",
  },
  {
    relationshipStage: "1-3 Years",
    category: "Communication",
    question: "How can we improve our communication?",
  },
  {
    relationshipStage: "1-3 Years",
    category: "Experiences",
    question:
      "What adventure or experience would you like us to have together soon?",
  },
  {
    relationshipStage: "1-3 Years",
    category: "Connection",
    question: "What are your favorite memories from our relationship so far?",
  },
  {
    relationshipStage: "1-3 Years",
    category: "Personal Growth",
    question: "What personal goal can I support you with this year?",
  },
  {
    relationshipStage: "1-3 Years",
    category: "Values",
    question:
      "What values do you think are most important for our relationship?",
  },
  {
    relationshipStage: "1-3 Years",
    category: "Values",
    question: "What does a healthy long-term relationship look like to you?",
  },

  // 5-7 Years
  {
    relationshipStage: "5-7 Years",
    category: "Growth",
    question:
      "How do you think we've changed most as individuals since we met?",
  },
  {
    relationshipStage: "5-7 Years",
    category: "Growth",
    question: "What part of our relationship are you most proud of today?",
  },
  {
    relationshipStage: "5-7 Years",
    category: "Connection",
    question:
      "What helps you feel emotionally connected to me after all these years?",
  },
  {
    relationshipStage: "5-7 Years",
    category: "Growth",
    question: "What is one area where you'd like us to grow as a couple?",
  },
  {
    relationshipStage: "5-7 Years",
    category: "Maintaining the Spark",
    question:
      "How can we keep excitement and spontaneity alive in our relationship?",
  },
  {
    relationshipStage: "5-7 Years",
    category: "Future Planning",
    question: "What shared dream would you still like us to pursue together?",
  },
  {
    relationshipStage: "5-7 Years",
    category: "Growth",
    question: "What life lesson have you learned through our relationship?",
  },
  {
    relationshipStage: "5-7 Years",
    category: "Communication",
    question:
      "How do you think we handle stress differently now compared to earlier years?",
  },
  {
    relationshipStage: "5-7 Years",
    category: "Habits & Traditions",
    question: "What relationship habit should we strengthen moving forward?",
  },
  {
    relationshipStage: "5-7 Years",
    category: "Future Planning",
    question: "What does our ideal future look like five years from now?",
  },
  {
    relationshipStage: "5-7 Years",
    category: "Growth",
    question:
      "How have your priorities changed since the beginning of our relationship?",
  },
  {
    relationshipStage: "5-7 Years",
    category: "Connection",
    question: "What is something you miss that we used to do together?",
  },
  {
    relationshipStage: "5-7 Years",
    category: "Personal Growth",
    question: "How can we better support each other's personal growth?",
  },
  {
    relationshipStage: "5-7 Years",
    category: "Growth",
    question: "What challenge do you think made our relationship stronger?",
  },
  {
    relationshipStage: "5-7 Years",
    category: "Connection",
    question:
      "How can we continue showing appreciation for each other in meaningful ways?",
  },
  {
    relationshipStage: "5-7 Years",
    category: "Trust",
    question:
      "What role does trust play in our relationship today compared to earlier years?",
  },
  {
    relationshipStage: "5-7 Years",
    category: "Experiences",
    question: "What new experience would you like us to try together?",
  },
  {
    relationshipStage: "5-7 Years",
    category: "Future Planning",
    question:
      "How can we improve our balance between individual goals and shared goals?",
  },
  {
    relationshipStage: "5-7 Years",
    category: "Values",
    question: "What do you hope people would say about our relationship?",
  },
  {
    relationshipStage: "5-7 Years",
    category: "Future Planning",
    question:
      "What would make the next chapter of our relationship even more fulfilling?",
  },
];

function getTier(relationshipStage) {
  return STAGE_TIERS[relationshipStage] || "other";
}

function buildQuestionDocuments() {
  return questions.map((item, index) => ({
    questionId: index + 1,
    text: item.question,
    category: item.category,
    tier: getTier(item.relationshipStage),
  }));
}

async function seedQuestions() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required to seed questions.");
  }

  await mongoose.connect(process.env.MONGO_URI);

  try {
    const questionDocuments = buildQuestionDocuments();
    const operations = questionDocuments.map((question) => ({
      updateOne: {
        filter: { questionId: question.questionId },
        update: { $set: question },
        upsert: true,
      },
    }));

    const result = await Question.bulkWrite(operations);

    console.log("MongoDB question seed complete.");
    console.log(`Questions processed: ${questionDocuments.length}`);
    console.log(`Inserted: ${result.upsertedCount}`);
    console.log(`Updated: ${result.modifiedCount}`);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seedQuestions().catch((error) => {
    console.error(`Question seed failed: ${error.message}`);
    process.exit(1);
  });
}
