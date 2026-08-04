import mongoose from 'mongoose';

/**
 * A Book belongs to exactly one user.
 *
 * `owner` references the User who created it. Every query in the controllers is
 * scoped by this field, which is what keeps each account's library private.
 */
const bookSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // fast per-user lookups
    },

    // --- Core metadata ---
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    genre: { type: String, default: 'Fiction', trim: true },
    totalPages: { type: Number, required: true, min: 1 },

    // --- Presentation ---
    coverColor: { type: String, default: 'bg-amber-700' },
    coverUrl: { type: String, default: '' },

    // --- Reading state ---
    status: {
      type: String,
      enum: ['want_to_read', 'reading', 'read', 'dnf'],
      default: 'want_to_read',
    },
    currentPage: { type: Number, default: 0, min: 0 },
    rating: { type: Number, min: 0, max: 5 },
    notes: { type: String, default: '' },

    // --- Cached AI content (avoids re-calling Gemini) ---
    aiAnalysis: { type: String, default: '' },
    smartRecap: { type: String, default: '' },
    recapPage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/**
 * Compound indexes.
 *
 * 1. { owner, title } unique + case-insensitive collation: the database itself
 *    now guarantees a user can't add the same title twice. This replaces the
 *    fragile client-side duplicate check and prevents race conditions.
 * 2. { owner, createdAt } powers the default "newest first" shelf sort without
 *    an in-memory sort over every document.
 */
bookSchema.index(
  { owner: 1, title: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);
bookSchema.index({ owner: 1, createdAt: -1 });

export default mongoose.model('Book', bookSchema);
