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

## 📋 About This Repository
The back end (or server-side) of an application is the "brain" that lives behind the scenes, handling data processing, security, and communication with databases. Align-server to clearly distinguish this codebase from your frontend (client) repository. This project follows the **MVC (Model-View-Controller)** architecture, which is an industry-standard way to organize code so that it remains readable and scalable as you add features like Authentication and Databases.

---

## 🎯 Personal Project: Align
**Submission:** I’m currently developing ALIGN, a web application designed to help couples maintain emotional and mental synchronicity through structured check-ins.

I built this because while many apps focus on logistics or scheduling, there’s a gap in tools that facilitate intentional, consistent emotional alignment. From a technical standpoint, I built the frontend using React, focusing on a highly responsive UI that makes daily or weekly reflections feel frictionless.
I’ve implemented features like dynamic state management for tracking progress over time and a clean, 'alignment-focused' user journey. The project really pushed me to think about how to translate complex human needs into intuitive CRUD operations and a scalable architecture.
