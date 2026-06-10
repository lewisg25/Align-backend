const User = require('../models/User');
const {
  relationshipData,
  yearsFromBody
} = require('./relationshipYears');
const { partnerNameData } = require('./partnerName');

function names(profile) {
  const [firstName, ...rest] = (profile.name || '').split(' ');

  return {
    firstName: profile.given_name || firstName || 'Google',
    lastName: profile.family_name || rest.join(' ')
  };
}

async function findOrCreateGoogleUser(profile, options = {}) {
  if (!profile.email_verified) {
    throw new Error('Google email is not verified.');
  }

  return User.findOneAndUpdate(
    { email: profile.email.toLowerCase() },
    {
      ...names(profile),
      email: profile.email.toLowerCase(),
      authProvider: 'google',
      googleId: profile.sub,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      avatarUrl: profile.picture || '',
      ...relationshipData(yearsFromBody(options)),
      ...partnerNameData(options)
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

module.exports = {
  findOrCreateGoogleUser
};
