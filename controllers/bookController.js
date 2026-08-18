import Book from '../models/Book.js';

/**
 * Fields a client is allowed to set/change. Anything else in req.body
 * (e.g. `owner`, `_id`, `createdAt`) is ignored — this prevents a user from
 * reassigning ownership or injecting unexpected fields.
 */
const ALLOWED_FIELDS = [
  'title',
  'author',
  'genre',
  'moods',
  'contentWarnings',
  'totalPages',
  'coverColor',
  'coverUrl',
  'spineColor',
  'status',
  'currentPage',
  'rating',
  'notes',
  'series',
  'seriesIndex',
  'tbrRank',
  'tbrMonth',
  'finishedAt',
  'isAudio',
  'audioDurationSec',
  'sessions',
  'journalEntries',
  'quotes',
  'seminarChat',
  'reflection',
  'characters',
  'relationships',
  'motifs',
  'motifSynthesis',
  'aiAnalysis',
  'smartRecap',
  'recapPage',
];

const pick = (source = {}, keys) =>
  keys.reduce((acc, key) => {
    if (source[key] !== undefined) acc[key] = source[key];
    return acc;
  }, {});

// GET /api/books  → only the signed-in user's books
export const getBooks = async (req, res, next) => {
  try {
    const books = await Book.find({ owner: req.userId })
      .sort({ createdAt: -1 })
      .lean(); // plain objects: faster and lighter for read-only responses
    res.status(200).json(books);
  } catch (err) {
    next(err);
  }
};

// POST /api/books  → create a book owned by the signed-in user
export const createBook = async (req, res, next) => {
  try {
    const data = pick(req.body, ALLOWED_FIELDS);
    const book = await Book.create({ ...data, owner: req.userId });
    res.status(201).json(book);
  } catch (err) {
    next(err); // duplicate title (11000) and validation errors handled centrally
  }
};

// PUT /api/books/:id  → update, but only if the book belongs to the user
export const updateBook = async (req, res, next) => {
  try {
    const updates = pick(req.body, ALLOWED_FIELDS);
    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId }, // ownership enforced in the query
      updates,
      { new: true, runValidators: true }
    );

    if (!book) return res.status(404).json({ message: 'Book not found.' });
    res.status(200).json(book);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/books/:id  → delete, but only if the book belongs to the user
export const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!book) return res.status(404).json({ message: 'Book not found.' });
    res.status(200).json({ message: 'Book deleted successfully.', id: book._id });
  } catch (err) {
    next(err);
  }
};
