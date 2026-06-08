const mongoose = require('mongoose');

const emailLoginTokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true
  },
  redirect: {
    type: String,
    default: '/dashboard'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }
  },
  usedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('EmailLoginToken', emailLoginTokenSchema);
