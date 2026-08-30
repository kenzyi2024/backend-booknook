import mongoose from 'mongoose';

// A single logged reading session (page-based or audiobook).
const sessionSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    endPage: { type: Number, default: 0 }, // page they reached this session
    pagesRead: { type: Number, default: 0 }, // pages covered this session
    percent: { type: Number, default: 0 }, // % of the whole book this session
    minutes: { type: Number, default: 0 }, // optional time spent
    format: { type: String, enum: ['page', 'pages', 'percent', 'audio'], default: 'page' },
  },
  { _id: true }
);

// A timestamped journal entry.
const journalSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    text: { type: String, default: '', maxlength: 20000 },
  },
  { _id: true }
);

// A saved quote / annotation tied to a page, with an optional note, tags, and a
// highlight color.
const quoteSchema = new mongoose.Schema(
  {
    page: { type: Number, default: 0 },
    text: { type: String, default: '', maxlength: 5000 },
    note: { type: String, default: '', maxlength: 5000 },
    tags: { type: [String], default: [] },
    color: { type: String, default: '' },
  },
  { _id: true }
);

// A persisted Socratic-seminar chat message.
const chatSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'ai'], default: 'user' },
    content: { type: String, default: '', maxlength: 12000 },
  },
  { _id: false }
);

// A logged "sighting" of a motif at a page, with the reader's note.
const sightingSchema = new mongoose.Schema(
  {
    _id: false,
    id: { type: String },
    page: { type: Number },
    note: { type: String, default: '' },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

// A tracked motif/symbol and everywhere the reader has spotted it.
const motifSchema = new mongoose.Schema(
  {
    _id: false,
    id: { type: String },
    name: { type: String, default: '' },
    sightings: [sightingSchema],
  },
  { _id: false }
);

// A character on the book's relationship map.
const characterSchema = new mongoose.Schema(
  {
    _id: false,
    id: { type: String },
    name: { type: String, default: '' },
    role: { type: String, default: '' },
    note: { type: String, default: '' },
    x: { type: Number },
    y: { type: Number },
  },
  { _id: false }
);

// A labeled relationship between two characters (by their ids).
const relationshipSchema = new mongoose.Schema(
  {
    _id: false,
    id: { type: String },
    from: { type: String },
    to: { type: String },
    label: { type: String, default: '' },
  },
  { _id: false }
);

// Spaced-repetition reflection state (retrieval practice on the reader's notes).
const reflectionSchema = new mongoose.Schema(
  {
    stage: { type: Number, default: 0 },
    dueAt: { type: Date },
    answers: [
      {
        _id: false,
        stage: { type: Number, default: 0 },
        text: { type: String, default: '' },
        date: { type: Date, default: Date.now },
        // Later thoughts the reader adds to this same answer (append-only).
        followUps: [
          {
            _id: false,
            text: { type: String, default: '' },
            date: { type: Date, default: Date.now },
          },
        ],
      },
    ],
  },
  { _id: false }
);

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
    moods: { type: [String], default: [] }, // reader "mood" tags — how the book felt
    // Opt-in content warnings, each graded by intensity.
    contentWarnings: {
      type: [
        {
          _id: false,
          name: { type: String, default: '' },
          level: { type: String, enum: ['minor', 'moderate', 'graphic'], default: 'moderate' },
        },
      ],
      default: [],
    },
    totalPages: { type: Number, required: true, min: 1 },

    // --- Presentation ---
    coverColor: { type: String, default: 'bg-amber-700' },
    coverUrl: { type: String, default: '' },
    spineColor: { type: String, default: '' }, // dominant color sampled from the cover, for spine tint

    // --- Reading state ---
    status: {
      type: String,
      enum: ['want_to_read', 'reading', 'read', 'dnf'],
      default: 'want_to_read',
    },
    currentPage: { type: Number, default: 0, min: 0 },
    rating: { type: Number, min: 0, max: 5 },
    notes: { type: String, default: '', maxlength: 20000 },
    // Series grouping + to-be-read priority
    series: { type: String, default: '', trim: true },
    seriesIndex: { type: Number, default: null },
    tbrRank: { type: Number, default: null },
    tbrMonth: { type: String, default: '' }, // 'YYYY-MM' reading-plan bucket ('' = unscheduled)
    finishedAt: { type: Date }, // set when the book is marked finished

    // --- Audiobook support ---
    isAudio: { type: Boolean, default: false },
    audioDurationSec: { type: Number, default: 0 }, // total audiobook length

    // --- Reading history & journal ---
    sessions: { type: [sessionSchema], validate: [(a) => a.length <= 5000, 'Too many sessions.'] },
    journalEntries: { type: [journalSchema], validate: [(a) => a.length <= 2000, 'Too many journal entries.'] },
    quotes: { type: [quoteSchema], validate: [(a) => a.length <= 2000, 'Too many quotes.'] },
    seminarChat: { type: [chatSchema], validate: [(a) => a.length <= 1000, 'Chat is too long.'] },
    reflection: { type: reflectionSchema, default: null },
    characters: { type: [characterSchema], validate: [(a) => a.length <= 300, 'Too many characters.'] },
    relationships: { type: [relationshipSchema], validate: [(a) => a.length <= 600, 'Too many relationships.'] },
    motifs: { type: [motifSchema], validate: [(a) => a.length <= 300, 'Too many motifs.'] },
    motifSynthesis: { type: String, default: '', maxlength: 20000 },

    // --- Cached AI content (avoids re-calling the model) ---
    aiAnalysis: { type: String, default: '', maxlength: 20000 },
    smartRecap: { type: String, default: '', maxlength: 20000 },
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
