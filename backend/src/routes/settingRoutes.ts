import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateUser, getSettings);
router.put('/', authenticateUser, requireAdmin, updateSettings);

export default router;
