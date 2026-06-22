const User = require('../models/User');
const { verifyToken } = require('../utils/token');

function cookieValue(cookieHeader, name) {
  return (cookieHeader || '')
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  const sessionToken = scheme === 'Bearer' && token
    ? token
    : cookieValue(req.headers.cookie, 'alignSession');

  try {
    const payload = verifyToken(sessionToken);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({
        message: 'Your session is no longer valid.'
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      message: 'Your session has expired. Please log in again.'
    });
  }
}

module.exports = requireAuth;
