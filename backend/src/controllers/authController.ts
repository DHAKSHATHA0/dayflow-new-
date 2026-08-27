import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { signupSchema, loginSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { createNotification, notifyAdmins } from '../services/notificationService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dayflow_super_secret_jwt_key_2025_hrms_flow';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (payload: { id: string; employeeId: string; email: string; role: string }) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: validated.email.toLowerCase() }, ...(validated.employeeId ? [{ employeeId: validated.employeeId }] : [])],
      },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: existingUser.email.toLowerCase() === validated.email.toLowerCase()
          ? 'An account with this email address already exists'
          : 'An employee with this ID already exists',
      });
      return;
    }

    // Generate unique employee ID if not provided
    const employeeId = validated.employeeId || `DF-${Math.floor(1000 + Math.random() * 9000)}`;
    const passwordHash = await bcrypt.hash(validated.password, 10);
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Determine initials & color
    const initials = validated.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const colors = ['#e58f78', '#9eb9a8', '#b7a0c9', '#d8b36a', '#84a7bb', '#c9949d', '#a7b78a', '#d1a77c'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const user = await prisma.user.create({
      data: {
        employeeId,
        name: validated.name,
        email: validated.email.toLowerCase(),
        passwordHash,
        role: validated.role,
        emailVerified: true, // auto-verify in dev/demo flow while generating token for verify-email API
        verificationToken,
        profile: {
          create: {
            employeeId,
            department: validated.role === 'admin' ? 'People' : 'Engineering',
            designation: validated.role === 'admin' ? 'People Operations Lead' : 'Team Member',
            joiningDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            initials,
            color,
            location: 'Remote',
          },
        },
        // Auto-create initial salary record
        ...(validated.role === 'employee' ? {} : {}),
      },
      include: {
        profile: true,
      },
    });

    // Default salary structure
    await prisma.salary.create({
      data: {
        employeeId,
        basicSalary: validated.role === 'admin' ? 120000 : 85000,
        allowances: validated.role === 'admin' ? 8000 : 5000,
        deductions: validated.role === 'admin' ? 15000 : 10000,
        netSalary: validated.role === 'admin' ? 113000 : 80000,
      },
    });

    await prisma.salaryHistory.create({
      data: {
        employeeId,
        basicSalary: validated.role === 'admin' ? 120000 : 85000,
        allowances: validated.role === 'admin' ? 8000 : 5000,
        deductions: validated.role === 'admin' ? 15000 : 10000,
        netSalary: validated.role === 'admin' ? 113000 : 80000,
        changeReason: 'Initial salary assignment',
      },
    });

    await createNotification({
      userId: user.id,
      title: 'Welcome to Dayflow',
      message: `Welcome to Dayflow, ${user.name}! Your workspace is now set up and ready.`,
      type: 'system',
      link: user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard',
    });

    await notifyAdmins('New User Registered', `${user.name} (${user.employeeId}) has registered as ${user.role}.`, 'system', '/admin/employees');

    const token = generateToken({
      id: user.id,
      employeeId: user.employeeId,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        user: {
          id: user.id,
          employeeId: user.employeeId,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          profile: user.profile,
        },
      },
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, message: err.errors[0]?.message || 'Validation error', errors: err.errors });
      return;
    }
    res.status(500).json({ success: false, message: err.message || 'Error creating account' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);
    const identifier = validated.email.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { employeeId: identifier.toUpperCase() },
          { employeeId: identifier },
        ],
      },
      include: {
        profile: true,
      },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials. Please check your email/ID and password.' });
      return;
    }

    const isValidPassword = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ success: false, message: 'Invalid credentials. Please check your email/ID and password.' });
      return;
    }

    const token = generateToken({
      id: user.id,
      employeeId: user.employeeId,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          employeeId: user.employeeId,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          profile: user.profile,
        },
      },
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, message: err.errors[0]?.message || 'Validation error' });
      return;
    }
    res.status(500).json({ success: false, message: err.message || 'Error during login' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: {
          include: {
            documents: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const salary = await prisma.salary.findUnique({
      where: { employeeId: user.employeeId },
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          employeeId: user.employeeId,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          profile: user.profile,
          salary,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch current user' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = verifyEmailSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.emailVerified) {
      res.status(200).json({ success: true, message: 'Email is already verified' });
      return;
    }

    if (user.verificationToken && user.verificationToken !== validated.token) {
      res.status(400).json({ success: false, message: 'Invalid verification token' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    });

    res.status(200).json({ success: true, message: 'Email successfully verified' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Failed to verify email' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (!user) {
      // Return 200 for security to prevent user enumeration
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset token has been generated.',
        data: { resetToken: '123456' },
      });
      return;
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    res.status(200).json({
      success: true,
      message: 'Password reset token generated successfully',
      data: { resetToken },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Failed to process request' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = resetPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (!user || !user.resetToken || user.resetToken !== validated.token) {
      res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
      return;
    }

    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      res.status(400).json({ success: false, message: 'Reset token has expired' });
      return;
    }

    const passwordHash = await bcrypt.hash(validated.newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.status(200).json({ success: true, message: 'Password has been reset successfully' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Failed to reset password' });
  }
};
