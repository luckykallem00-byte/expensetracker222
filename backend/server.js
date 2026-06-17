const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { initFirebaseAdmin } = require('./config/firebase');
const authMiddleware = require('./middleware/authMiddleware');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');
const expensesRoutes = require('./routes/expensesRoutes');
const categoriesRoutes = require('./routes/categoriesRoutes');
const summaryRoutes = require('./routes/summaryRoutes');

dotenv.config({ path: path.resolve(__dirname, '.env') });
initFirebaseAdmin();

const app = express();
// Read port from env (Render sets this dynamically) and allow override
const port = process.env.PORT || process.env.RENDER_PORT || 4000;

// FRONTEND_URL can be a single origin or a comma-separated list of origins
const allowedOrigins = (process.env.FRONTEND_URL || process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS origin denied'));
      }
    },
    credentials: true,
  })
);

app.use('/api/expenses', authMiddleware, expensesRoutes);
app.use('/api/categories', authMiddleware, categoriesRoutes);
app.use('/api/summary', authMiddleware, summaryRoutes);

// health check for Render and other platforms
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Expense Tracker API is running' });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
