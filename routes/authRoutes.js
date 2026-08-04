import { Router } from 'express';
import { register, login, me, changePassword } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me); // protected: returns the current user
router.post('/change-password', requireAuth, changePassword); // protected

export default router;
