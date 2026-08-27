import { Router } from 'express';
import {
  getMyPayroll,
  getAllPayroll,
  updateSalaryStructure,
  getSalaryHistory,
} from '../controllers/payrollController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/my', authenticateUser, getMyPayroll);
router.get('/', authenticateUser, requireAdmin, getAllPayroll);
router.put('/:employeeId', authenticateUser, requireAdmin, updateSalaryStructure);
router.get('/:employeeId/history', authenticateUser, getSalaryHistory);

export default router;
