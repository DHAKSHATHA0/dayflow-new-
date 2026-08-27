import { Router } from 'express';
import { getProfile, updateProfile, uploadAvatar, uploadDocument } from '../controllers/profileController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateUser, getProfile);
router.put('/', authenticateUser, updateProfile);
router.post('/avatar', authenticateUser, uploadAvatar);
router.post('/documents', authenticateUser, uploadDocument);

export default router;
