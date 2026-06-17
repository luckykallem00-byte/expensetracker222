const { admin } = require('../config/firebase');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      req.user = { uid: decodedToken.uid };
      next();
    })
    .catch((error) => {
      console.error('Firebase token verification failed:', error);
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    });
}

module.exports = authMiddleware;
