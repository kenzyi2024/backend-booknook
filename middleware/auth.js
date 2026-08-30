import jwt from 'jsonwebtoken';

/**
 * Auth guard. Reads a JWT from the `Authorization: Bearer <token>` header,
 * verifies it, and attaches the user id to the request as `req.userId`.
 * Responds 401 if the token is missing, invalid, or expired.
 */
export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session.' });
  }
};
