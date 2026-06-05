const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: { type: Number, required: true, unique: true },
  text: { type: String, required: true },
  category: { 
    type: String, 
    enum: [
      'Emotional',
      'Communication',
      'Intimacy',
      'Future',
      'Finances',
      'Foundation & Discovery',
      'Future Planning',
      'Growth',
      'Habits & Traditions',
      'Connection',
      'Personal Growth',
      'Experiences',
      'Values',
      'Maintaining the Spark',
      'Trust'
    ], 
    required: true 
  },
  tier: { type: String, enum: ['1-3_years', '5-7_years', 'other'], required: true }
});

module.exports = mongoose.model('Question', questionSchema);
