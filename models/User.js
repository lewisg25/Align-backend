const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, default: '', trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  emailVerified: { type: Boolean, default: false },
  emailVerifiedAt: { type: Date, default: null },
  password: {
    type: String,
    required() {
      return this.authProvider === 'local';
    },
    select: false
  },
  authProvider: {
    type: String,
    enum: ['local', 'email'],
    default: 'local'
  },
  avatarUrl: { type: String, default: '' },
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  partnerName: { type: String, default: '', trim: true },
  yearsTogether: { type: Number, default: 0 },
  yearsMarried: { type: Number, default: undefined },
  relationshipTier: {
    type: String,
    enum: ['1-3_years', '5-7_years', 'other'],
    default: 'other'
  },
  isPremium: { type: Boolean, default: false },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastCheckInDate: { type: Date, default: null },
  reminderEnabled: { type: Boolean, default: false },
  reminderTime: { type: String, default: '09:00' },
  reminderSent: { type: Date, default: null },
  timezone: { type: String, default: 'America/New_York' }
}, { timestamps: true });

userSchema.virtual('fullName').get(function getFullName() {
  return [this.firstName, this.lastName].filter(Boolean).join(' ');
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
