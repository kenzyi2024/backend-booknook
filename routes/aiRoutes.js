import { Router } from 'express';
import { generate } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Protected so only signed-in users can spend your AI quota.
router.post('/', requireAuth, generate);

export default router;
