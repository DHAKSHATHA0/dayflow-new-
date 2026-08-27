import { Router } from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employeeController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateUser, getEmployees);
router.get('/:id', authenticateUser, getEmployeeById);
router.post('/', authenticateUser, requireAdmin, createEmployee);
router.put('/:id', authenticateUser, requireAdmin, updateEmployee);
router.delete('/:id', authenticateUser, requireAdmin, deleteEmployee);

export default router;
