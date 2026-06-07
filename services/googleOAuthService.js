const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USER_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const SCOPES = 'openid email profile';
function env(name) {
  if (!process.env[name]) throw new Error(`${name} is required.`);
  return process.env[name];
}
function config() {
  return [
    env('GOOGLE_CLIENT_ID'),
    env('GOOGLE_CLIENT_SECRET'),
    env('GOOGLE_REDIRECT_URI')
  ];
}
function loginUrl(state) {
  const [clientId, , redirectUri] = config();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    prompt: 'select_account'
  });
  if (state) params.set('state', state);

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}
async function googleJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error('Google OAuth request failed.');
  return response.json();
}
async function googleUser(code) {
  const [clientId, clientSecret, redirectUri] = config();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });
  const token = await googleJson(GOOGLE_TOKEN_URL, { method: 'POST', body });
  return googleJson(GOOGLE_USER_URL, {
    headers: { Authorization: `Bearer ${token.access_token}` }
  });
}
module.exports = { googleUser, loginUrl };
