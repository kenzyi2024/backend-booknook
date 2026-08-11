import { Router } from 'express';
import { register, login, me, changePassword, googleLogin, updateProfile } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', requireAuth, me);
router.put('/profile', requireAuth, updateProfile);
router.post('/change-password', requireAuth, changePassword);

export default router;
