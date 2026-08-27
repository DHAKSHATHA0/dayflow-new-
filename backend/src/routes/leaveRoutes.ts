import { Router } from 'express';
import {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
} from '../controllers/leaveController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticateUser, applyLeave);
router.get('/my', authenticateUser, getMyLeaves);
router.get('/', authenticateUser, requireAdmin, getAllLeaves);
router.put('/:id/approve', authenticateUser, requireAdmin, approveLeave);
router.put('/:id/reject', authenticateUser, requireAdmin, rejectLeave);

export default router;
