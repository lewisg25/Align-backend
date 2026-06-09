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

## Google OAuth2


```txt
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback
GOOGLE_SUCCESS_URL=http://localhost:5173/dashboard
```

Start Google login from:

```txt
GET /auth/google
GET /auth/oauth2/authorize/google
```

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
