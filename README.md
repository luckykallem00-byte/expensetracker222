# ExpenseTracker222

This repository now contains a split React frontend and Node/Express backend with Firebase Realtime Database access through Firebase Admin.

## Architecture

- `/frontend` - React + Vite application for authentication and UI.
- `/backend` - Express REST API using Firebase Admin SDK.
- `database.rules.json` - Firebase Realtime Database security rules.
- `/legacy` - legacy static frontend and server files; not used by the new architecture.

## Backend setup

1. Open `backend/.env.example` and create `backend/.env`.
2. Set `FIREBASE_SERVICE_ACCOUNT_KEY` to the service account JSON or its base64-encoded JSON.
3. Set `FIREBASE_DATABASE_URL` to your Realtime Database URL.
4. Install dependencies:

```bash
cd backend
npm install
```

5. Start the backend:

```bash
npm run dev
```

The backend listens by default on `http://localhost:4000`.

## Frontend setup

1. Open `frontend/.env.example` and create `frontend/.env`.
2. Add your Firebase client config values and set `VITE_API_BASE_URL` to your backend URL (example below):

```
VITE_API_BASE_URL=https://expensetracker222-1.onrender.com
```
3. Install dependencies:

```bash
cd frontend
npm install
```

4. Start the frontend:

```bash
npm run dev
```

The frontend development server runs on `http://localhost:5173`.

## Firebase rules

The `database.rules.json` file enforces that users can only read and write their own data under `users/<uid>/`.

To deploy rules with Firebase CLI:

```bash
firebase deploy --only database
```

Or use the Firebase Console and paste the rules from `database.rules.json`.

## What changed

- Frontend is now a proper React/Vite app.
- Backend is now a Node/Express API protected by Firebase ID token verification.
- Expenses are stored in Realtime Database under `users/<uid>/expenses`.
- No frontend direct database access: all expense and category calls go through `/api/*`.

## Cleanup note

The `/legacy` folder and old vanilla `frontend/*.html` assets are still present for reference but are not part of the new React architecture.
