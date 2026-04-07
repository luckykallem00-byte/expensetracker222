# ExpenseTracker222

A minimal expense tracker using Firebase Authentication and Firebase Realtime Database.

## Project structure

- `/frontend` - Static HTML, CSS, and JavaScript files for authentication and dashboard
- `.env` - Local environment variables for Firebase settings (client config)

## Features

- Google sign-in via Firebase Authentication
- Firebase Realtime Database storage for user expenses
- Frontend dashboard dynamically loads user expenses
- Local budget, reminder, and alert support on the frontend

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from `.env.example` and fill in your Firebase client config values.

3. Start the server:

```bash
npm start
```

4. Open the app in your browser:

```text
http://localhost:3000
```

## Firebase setup

- Enable Google Authentication in Firebase Authentication.
- Create a Realtime Database and set its rules to allow authenticated reads and writes.

## Notes

- The frontend fetches Firebase client config from `/api/config`.
- The server reads the Firebase config from `.env` and does not hardcode keys in `auth.js`.
