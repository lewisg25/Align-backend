# ALIGN-backend

Beginner-friendly CommonJS backend for the ALIGN frontend using Express + MongoDB/Mongoose.

ALIGN is a relationship check-in app that helps couples stay connected through daily questions, emotional reflections, streaks, and weekly insights.

## Stack

- Node.js + Express
- MongoDB + Mongoose
- CommonJS
- JWT authentication
- Dotenv
- CORS
- Helmet
- Morgan

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

The backend sends a 6-digit code to the user. If SMTP is not configured, the code is printed in the server logs for local development.

Verify payload:

```json
{
  "email": "taylor@example.com",
  "code": "123456"
}
```

Successful verification returns a JWT `token`, a serialized `user`, and sets the `alignSession` HTTP-only cookie for browser sessions.

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
