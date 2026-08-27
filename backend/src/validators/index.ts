import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2, 'Full name must have at least 2 characters'),
  email: z.string().email('Please enter a valid work email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[0-9]/, 'Password must include a number')
    .regex(/[^A-Za-z0-9]/, 'Password must include a special character'),
  role: z.enum(['employee', 'admin']).default('employee'),
  employeeId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().min(1, 'Email or Employee ID is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const verifyEmailSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  token: z.string().min(1, 'Verification code or token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[0-9]/, 'Password must include a number')
    .regex(/[^A-Za-z0-9]/, 'Password must include a special character'),
});

export const createEmployeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['employee', 'admin']).default('employee'),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  employmentType: z.string().default('Full-time'),
  joiningDate: z.string().optional(),
  location: z.string().default('Office'),
  manager: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  basicSalary: z.number().nonnegative().optional().default(0),
  allowances: z.number().nonnegative().optional().default(0),
  deductions: z.number().nonnegative().optional().default(0),
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['employee', 'admin']).optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  employmentType: z.string().optional(),
  joiningDate: z.string().optional(),
  location: z.string().optional(),
  manager: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  basicSalary: z.number().nonnegative().optional(),
  allowances: z.number().nonnegative().optional(),
  deductions: z.number().nonnegative().optional(),
});

export const updateProfileSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  profilePicture: z.string().optional(),
});

export const checkInSchema = z.object({
  notes: z.string().optional(),
});

export const checkOutSchema = z.object({
  notes: z.string().optional(),
});

export const applyLeaveSchema = z.object({
  leaveType: z.enum(['Paid leave', 'Sick leave', 'Unpaid leave']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  remarks: z.string().min(1, 'Reason or remarks are required'),
});

export const reviewLeaveSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewComment: z.string().optional(),
});

export const updateSalarySchema = z.object({
  basicSalary: z.number().nonnegative('Basic salary must be non-negative'),
  allowances: z.number().nonnegative('Allowances must be non-negative'),
  deductions: z.number().nonnegative('Deductions must be non-negative'),
  changeReason: z.string().optional().default('Salary structure update'),
});

export const updateSettingSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
      category: z.string().optional(),
    })
  ),
});
