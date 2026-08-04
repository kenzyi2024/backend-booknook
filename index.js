import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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

// --- Core middleware ---
// In dev, allow any origin. In prod, set CLIENT_URL (comma-separated) to lock it down.
app.use(
  cors(
    process.env.CLIENT_URL
      ? { origin: process.env.CLIENT_URL.split(',').map((s) => s.trim()) }
      : {}
  )
);
app.use(express.json());

// --- Routes ---
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
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
