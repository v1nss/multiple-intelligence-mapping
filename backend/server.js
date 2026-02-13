import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import authRoutes from './src/routes/authRoutes.js';
import assessmentRoutes from './src/routes/assessmentRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import { initializeDatabase } from './src/utils/initDb.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ──────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many submissions. Please try again later.' },
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Please try again later.' },
});

app.use(globalLimiter);

// ──────────────────────────────────────────
// Routes
// ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api/assessments/:id/submit', submissionLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ──────────────────────────────────────────
// Start
// ──────────────────────────────────────────
async function start() {
  try {
    await initializeDatabase();
    console.log('Database initialized with Sequelize.');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
