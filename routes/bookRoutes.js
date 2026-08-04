import { Router } from 'express';
import {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
} from '../controllers/bookController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Every /api/books route requires a valid session token.
router.use(requireAuth);

router.route('/').get(getBooks).post(createBook);
router.route('/:id').put(updateBook).delete(deleteBook);

export default router;
