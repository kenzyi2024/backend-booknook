// 404 for unmatched routes
export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

/**
 * Central error handler. Turns common Mongoose/Clerk errors into clean,
 * predictable HTTP responses instead of leaking stack traces or 500s.
 */
export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  // Invalid ObjectId in the URL (e.g. /api/books/undefined)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid book id.' });
  }

  // Duplicate key from the { owner, title } unique index
  if (err.code === 11000) {
    return res
      .status(409)
      .json({ message: 'You already have this book in your library.' });
  }

  // Schema validation failures (missing title, bad status enum, etc.)
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Validation failed.', details });
  }

  // JWT auth errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid or expired session.' });
  }

  res.status(err.status || 500).json({ message: err.message || 'Server error.' });
};
