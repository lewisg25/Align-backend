const crypto = require('crypto');

const hashMethod = 'sha256';
const hashRounds = 310000;
const hashLength = 32;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, hashRounds, hashLength, hashMethod)
    .toString('hex');

  return `pbkdf2_${hashMethod}$${hashRounds}$${salt}$${hash}`;
}

function verifyPassword(password, storedPassword) {
  if (!storedPassword) return false;

  const [methodName, roundValue, salt, savedHash] = storedPassword.split('$');
  const method = methodName.replace('pbkdf2_', '');
  const rounds = Number(roundValue);

  if (!method || !rounds || !salt || !savedHash) return false;

  const hash = crypto
    .pbkdf2Sync(password, salt, rounds, Buffer.from(savedHash, 'hex').length, method)
    .toString('hex');

  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(savedHash, 'hex'));
}

module.exports = {
  hashPassword,
  verifyPassword
};
