const User = require('../models/User');

function names(profile) {
  const [firstName, ...rest] = (profile.name || '').split(' ');

  return {
    firstName: profile.given_name || firstName || 'Google',
    lastName: profile.family_name || rest.join(' ')
  };
}

async function findOrCreateGoogleUser(profile) {
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
      avatarUrl: profile.picture || ''
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

module.exports = {
  findOrCreateGoogleUser
};
