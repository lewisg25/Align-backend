const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USER_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';
const SCOPES = 'openid email profile';
function env(name) {
  if (!process.env[name]) throw new Error(`${name} is required.`);
  return process.env[name];
}
function oauthConfig() {
  return [
    env('GOOGLE_CLIENT_ID'),
    env('GOOGLE_CLIENT_SECRET'),
    env('GOOGLE_REDIRECT_URI')
  ];
}
function clientId() {
  return env('GOOGLE_CLIENT_ID');
}
function loginUrl(state) {
  const [googleClientId, , redirectUri] = oauthConfig();
  const params = new URLSearchParams({
    client_id: googleClientId,
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
  const [googleClientId, clientSecret, redirectUri] = oauthConfig();
  const body = new URLSearchParams({
    code,
    client_id: googleClientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });
  const token = await googleJson(GOOGLE_TOKEN_URL, { method: 'POST', body });
  return googleJson(GOOGLE_USER_URL, {
    headers: { Authorization: `Bearer ${token.access_token}` }
  });
}

async function googleCredentialUser(credential) {
  if (!credential) throw new Error('Google credential is required.');

  const googleClientId = clientId();
  const params = new URLSearchParams({ id_token: credential });
  const profile = await googleJson(`${GOOGLE_TOKENINFO_URL}?${params.toString()}`);

  if (profile.aud !== googleClientId) {
    throw new Error('Google credential was issued for a different client.');
  }

  if (profile.iss !== 'accounts.google.com' && profile.iss !== 'https://accounts.google.com') {
    throw new Error('Google credential issuer is invalid.');
  }

  return {
    sub: profile.sub,
    email: profile.email,
    email_verified: profile.email_verified === 'true' || profile.email_verified === true,
    name: profile.name,
    given_name: profile.given_name,
    family_name: profile.family_name,
    picture: profile.picture
  };
}

module.exports = { googleCredentialUser, googleUser, loginUrl };
