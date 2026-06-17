const admin = require('firebase-admin');

function parseServiceAccount(rawValue) {
  if (!rawValue) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY value');
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    try {
      return JSON.parse(Buffer.from(rawValue, 'base64').toString('utf8'));
    } catch (base64Error) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY must be valid JSON or base64-encoded JSON');
    }
  }
}

function initFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const serviceAccount = parseServiceAccount(rawServiceAccount);
  const databaseURL = process.env.FIREBASE_DATABASE_URL;

  if (!databaseURL) {
    throw new Error('Missing FIREBASE_DATABASE_URL in environment');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL,
  });

  return admin.app();
}

module.exports = {
  initFirebaseAdmin,
  admin,
};
