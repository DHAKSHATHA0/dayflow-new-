import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  getAttendanceByEmployeeId,
} from '../controllers/attendanceController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/check-in', authenticateUser, checkIn);
router.post('/check-out', authenticateUser, checkOut);
router.get('/my', authenticateUser, getMyAttendance);
router.get('/', authenticateUser, requireAdmin, getAllAttendance);
router.get('/:employeeId', authenticateUser, getAttendanceByEmployeeId);

export default router;
