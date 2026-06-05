const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, default: '', trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: {
    type: String,
    required() {
      return this.authProvider === 'local';
    },
    select: false
  },
  authProvider: {
    type: String,
    enum: ['local'],
    default: 'local'
  },
  avatarUrl: { type: String, default: '' },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  yearsTogether: { type: Number, default: 0 },
  relationshipTier: { 
    type: String, 
    enum: ['1-3_years', '5-7_years', 'other'],
    default: 'other'
  },
  isPremium: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, default: null, select: false },
  emailVerificationExpires: { type: Date, default: null, select: false },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastCheckInDate: { type: Date, default: null },
  timezone: { type: String, default: 'America/New_York' } 
}, { timestamps: true });

UserSchema.virtual('fullName').get(function getFullName() {
  return [this.firstName, this.lastName].filter(Boolean).join(' ');
});

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);
