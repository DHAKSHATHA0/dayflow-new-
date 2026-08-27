import { Router } from 'express';
import { signup, login, getMe, verifyEmail, forgotPassword, resetPassword } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticateUser, getMe);

export default router;
