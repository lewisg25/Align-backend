# ALIGN-backend

Beginner-friendly CommonJS backend for the ALIGN frontend using Express + MongoDB/Mongoose.

ALIGN is a relationship check-in app that helps couples stay connected through daily questions, emotional reflections, streaks, and weekly insights.

## Stack

- Node.js + Express
- MongoDB + Mongoose
- CommonJS
- JWT authentication
- Resend email delivery
- Dotenv
- CORS
- Helmet
- Morgan

## Setup

1. Create a MongoDB database (for example, a MongoDB Atlas cluster) and copy its connection string.
2. Copy `.env.example` to `.env` and set `MONGO_URI` to that connection string. Add a long, random `JWT_SECRET` and a separate `EMAIL_LOGIN_CODE_SECRET`.
3. In Resend, create an API key and verify the domain used in `EMAIL_FROM`. Set `RESEND_API_KEY` and `EMAIL_FROM` in `.env`.
4. Set `CLIENT_URL` to the frontend origin and `PUBLIC_API_URL` to the public backend URL when deploying.
5. Run `npm install`, then `npm run dev`.

The app connects to MongoDB before starting its HTTP server. User accounts, one-time sign-in codes, and verification tokens are stored in MongoDB.

## Passwordless Email Auth

The main auth flow sends a 6-digit code by email:

- `POST /auth/email/start`
- `POST /auth/email/verify`

The same routes are also mounted under `/api`. These clearer aliases are also available:

- `POST /auth/magic/request-code`
- `POST /auth/magic/verify-code`

Returning user start payload:

```json
{
  "email": "taylor@example.com"
}
```

First-time account start payload:

```json
{
  "email": "taylor@example.com",
  "createAccount": true,
  "firstName": "Taylor",
  "partnerName": "Jordan",
  "yearsMarried": 4
}
```

The backend sends a 6-digit code to the user through Resend. If Resend is not configured, the code is printed in the server logs only in development.

Verify payload:

```json
{
  "email": "taylor@example.com",
  "code": "123456"
}
```

Successful verification returns a JWT `token`, a serialized `user`, and sets the `alignSession` HTTP-only cookie for browser sessions.

Email delivery uses Resend. Add these to your backend `.env`:

```txt
RESEND_API_KEY="re_..."
EMAIL_FROM="ALIGN <hello@yourdomain.com>"
```

The backend also accepts `RESEND_API` for the API key and `RESEND_EMAIL` for the sender address. Your sender should use a domain you verified in Resend. In production, missing Resend configuration causes email sending to fail instead of pretending a sign-in code was delivered.

## Legacy Email + Password Auth

Classic account creation is available through:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`

The same routes are also mounted under `/api`, for example `POST /api/auth/register`.

Register payload:

```json
{
  "firstName": "Taylor",
  "lastName": "Smith",
  "email": "taylor@example.com",
  "password": "password123",
  "yearsMarried": 4
}
```

`yearsMarried` is required for account creation and may also be sent as `marriedYears`, `marriageYears`, `yearsBeenMarried`, `years_married`, `marriage_years`, `years_been_married`, `howLongMarried`, or `how_long_married`.

Login payload:

```json
{
  "email": "taylor@example.com",
  "password": "password123"
}
```

Successful register and login responses include a JWT `token`, a serialized `user`, and set the `alignSession` HTTP-only cookie for browser sessions.

## Project Structure

```txt
.
├── app.js
├── package.json
├── package-lock.json
├── controllers/
├── db/
├── middleware/
├── models/
├── routes/
├── scripts/
└── services/
