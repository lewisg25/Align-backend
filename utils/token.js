const crypto = require('crypto');

const DEFAULT_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production.');
  }

  return 'align-development-secret-change-me';
}

function base64UrlEncode(value) {
  const input = typeof value === 'string' ? value : JSON.stringify(value);
  return Buffer.from(input).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signToken(payload, expiresInSeconds = DEFAULT_EXPIRES_IN_SECONDS) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };
  const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(tokenPayload)}`;
  const signature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(unsignedToken)
    .digest('base64url');

  return `${unsignedToken}.${signature}`;
}

function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format.');
  }

  const [header, payload, signature] = parts;
  const unsignedToken = `${header}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(unsignedToken)
    .digest('base64url');

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  ) {
    throw new Error('Invalid token signature.');
  }

  const decodedPayload = JSON.parse(base64UrlDecode(payload));
  if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token has expired.');
  }

  return decodedPayload;
}

module.exports = {
  signToken,
  verifyToken
};
