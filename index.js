import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not set in your .env file. Auth will not work.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5001;

// Behind Cloud Run's proxy — trust the first hop so rate limiting keys on the
// real client IP (from X-Forwarded-For) rather than the proxy.
app.set('trust proxy', 1);

// --- Core middleware ---
// Security headers. This is a JSON API (no served HTML), so CSP/COEP aren't needed.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
// In dev, allow any origin. In prod, set CLIENT_URL (comma-separated) to lock it down.
app.use(
  cors(
    process.env.CLIENT_URL
      ? { origin: process.env.CLIENT_URL.split(',').map((s) => s.trim()) }
      : {}
  )
);
app.use(express.json());

// --- Rate limiters ---
// Sign-in / sign-up: throttle to blunt brute-force and credential stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait a few minutes and try again.' },
});
// AI proxy: cap per-user/IP bursts so no one can run up provider costs.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'You are sending requests too quickly — please slow down.' },
});

// --- Routes ---
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/google', authLimiter);
app.use('/api/ai', aiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/ai', aiRoutes);

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

// --- Start server only after the DB is connected ---
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
