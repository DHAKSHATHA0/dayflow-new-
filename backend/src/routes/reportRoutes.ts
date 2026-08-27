import { Router } from 'express';
import {
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  getAnalytics,
} from '../controllers/reportController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/attendance', authenticateUser, requireAdmin, getAttendanceReport);
router.get('/leave', authenticateUser, requireAdmin, getLeaveReport);
router.get('/payroll', authenticateUser, requireAdmin, getPayrollReport);
router.get('/analytics', authenticateUser, requireAdmin, getAnalytics);

export default router;
