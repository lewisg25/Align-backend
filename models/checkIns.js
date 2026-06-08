const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', default: null },
  questionKey: { type: String, required: true },
  questionText: { type: String, required: true },
  category: { type: String, default: 'Reflection' },
  answerText: { type: String, required: true },
  moodScale: { type: Number, min: 1, max: 5, default: 3 },
  responseDate: { type: String, default: '' },
  answeredAt: { type: Date, default: Date.now }
});

const checkInSchema = new mongoose.Schema({
  weekIdentifier: { type: String, required: true }, // e.g., "2026-W22"
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  responses: [responseSchema],
  isCompleted: { type: Boolean, default: false }
}, { timestamps: true });

checkInSchema.index({ user: 1, weekIdentifier: 1 }, { unique: true });

module.exports = mongoose.model('CheckIn', checkInSchema);
