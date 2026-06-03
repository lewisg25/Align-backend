# Align-backend

## Google sign-in setup

Add these values to `.env`:

```env
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```

The frontend should use the Google client ID only. Never expose the client secret in frontend code. Send the Google ID credential from the frontend to `POST /api/auth/google`; the backend verifies the token audience against `GOOGLE_CLIENT_ID` and marks Google accounts as email verified when Google returns `email_verified=true`.

For password-based signup verification emails, configure SMTP separately:

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=ALIGN <no-reply@example.com>
CLIENT_URL=http://localhost:3000
```
