const crypto = require('crypto');

const HASH_ALGORITHM = 'sha256';
const ITERATIONS = 310000;
const KEY_LENGTH = 32;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, HASH_ALGORITHM)
    .toString('hex');

  return `pbkdf2_${HASH_ALGORITHM}$${ITERATIONS}$${salt}$${hash}`;
}

function verifyPassword(password, storedPassword) {
  if (!storedPassword) return false;

  const [algorithmName, iterationValue, salt, savedHash] = storedPassword.split('$');
  const algorithm = algorithmName.replace('pbkdf2_', '');
  const iterations = Number(iterationValue);

  if (!algorithm || !iterations || !salt || !savedHash) return false;

  const hash = crypto
    .pbkdf2Sync(password, salt, iterations, Buffer.from(savedHash, 'hex').length, algorithm)
    .toString('hex');

  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(savedHash, 'hex'));
}

module.exports = {
  hashPassword,
  verifyPassword
};
