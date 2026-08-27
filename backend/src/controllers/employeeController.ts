import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/index.js';
import { createNotification, notifyAdmins } from '../services/notificationService.js';

export const getEmployees = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, department, status, role, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      const q = String(search).toLowerCase();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { employeeId: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { profile: { designation: { contains: q, mode: 'insensitive' } } },
        { profile: { department: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (department && department !== 'All departments') {
      where.profile = { ...where.profile, department: String(department) };
    }

    if (role) {
      where.role = String(role);
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          profile: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Fetch salaries for all employees
    const employeeIds = users.map((u) => u.employeeId);
    const salaries = await prisma.salary.findMany({
      where: { employeeId: { in: employeeIds } },
    });

    const salaryMap = new Map(salaries.map((s) => [s.employeeId, s]));

    const formatted = users.map((u) => {
      const sal = salaryMap.get(u.employeeId);
      return {
        id: u.employeeId,
        userId: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        title: u.profile?.designation || 'Team Member',
        department: u.profile?.department || 'General',
        location: u.profile?.location || 'Remote',
        joined: u.profile?.joiningDate || 'Recently',
        phone: u.profile?.phone || '',
        address: u.profile?.address || '',
        dateOfBirth: u.profile?.dateOfBirth || '',
        profilePicture: u.profile?.profilePicture || '',
        employmentType: u.profile?.employmentType || 'Full-time',
        manager: u.profile?.manager || '',
        initials: u.profile?.initials || 'DF',
        color: u.profile?.color || '#d47f68',
        salary: sal ? sal.basicSalary + sal.allowances : 75000,
        basicSalary: sal?.basicSalary || 75000,
        allowances: sal?.allowances || 0,
        deductions: sal?.deductions || 0,
        netSalary: sal?.netSalary || 75000,
        status: 'active',
      };
    });

    res.status(200).json({
      success: true,
      data: {
        employees: formatted,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch employees' });
  }
};

export const getEmployeeById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Normal employee can only view their own full profile
    if (req.user?.role !== 'admin' && req.user?.employeeId !== id && req.user?.id !== id) {
      res.status(403).json({ success: false, message: 'Forbidden: You can only view your own details' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ employeeId: id }, { id }],
      },
      include: {
        profile: {
          include: {
            documents: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    const salary = await prisma.salary.findUnique({
      where: { employeeId: user.employeeId },
    });

    const salaryHistory = await prisma.salaryHistory.findMany({
      where: { employeeId: user.employeeId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: {
        id: user.employeeId,
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.profile?.designation || 'Team Member',
        department: user.profile?.department || 'General',
        location: user.profile?.location || 'Remote',
        joined: user.profile?.joiningDate || 'Recently',
        phone: user.profile?.phone || '',
        address: user.profile?.address || '',
        dateOfBirth: user.profile?.dateOfBirth || '',
        profilePicture: user.profile?.profilePicture || '',
        employmentType: user.profile?.employmentType || 'Full-time',
        manager: user.profile?.manager || '',
        initials: user.profile?.initials || 'DF',
        color: user.profile?.color || '#d47f68',
        salary: salary ? salary.basicSalary + salary.allowances : 75000,
        salaryBreakdown: salary,
        salaryHistory,
        documents: user.profile?.documents || [],
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch employee details' });
  }
};

export const createEmployee = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validated = createEmployeeSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email already exists' });
      return;
    }

    const employeeId = `DF-${Math.floor(1000 + Math.random() * 9000)}`;
    const rawPassword = validated.password || 'Dayflow@123';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const initials = validated.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const colors = ['#e58f78', '#9eb9a8', '#b7a0c9', '#d8b36a', '#84a7bb', '#c9949d', '#a7b78a', '#d1a77c'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const joiningDate = validated.joiningDate || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    const user = await prisma.user.create({
      data: {
        employeeId,
        name: validated.name,
        email: validated.email.toLowerCase(),
        passwordHash,
        role: validated.role,
        emailVerified: true,
        profile: {
          create: {
            employeeId,
            department: validated.department,
            designation: validated.designation,
            employmentType: validated.employmentType || 'Full-time',
            joiningDate,
            location: validated.location || 'Office',
            manager: validated.manager || '',
            phone: validated.phone || '',
            address: validated.address || '',
            dateOfBirth: validated.dateOfBirth || '',
            initials,
            color,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const basicSalary = validated.basicSalary || 80000;
    const allowances = validated.allowances || 5000;
    const deductions = validated.deductions || 8000;
    const netSalary = basicSalary + allowances - deductions;

    await prisma.salary.create({
      data: {
        employeeId,
        basicSalary,
        allowances,
        deductions,
        netSalary,
      },
    });

    await prisma.salaryHistory.create({
      data: {
        employeeId,
        basicSalary,
        allowances,
        deductions,
        netSalary,
        changeReason: 'Initial onboarding salary package',
      },
    });

    await createNotification({
      userId: user.id,
      title: 'Welcome to Dayflow',
      message: `Hello ${user.name}, your employee profile has been created. Default password is: Dayflow@123`,
      type: 'system',
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        id: user.employeeId,
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.profile?.designation,
        department: user.profile?.department,
        salary: basicSalary + allowances,
      },
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, message: err.errors[0]?.message || 'Validation error' });
      return;
    }
    res.status(500).json({ success: false, message: err.message || 'Failed to create employee' });
  }
};

export const updateEmployee = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validated = updateEmployeeSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ employeeId: id }, { id }],
      },
      include: { profile: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    // Update User model fields
    if (validated.name || validated.email || validated.role) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(validated.name && { name: validated.name }),
          ...(validated.email && { email: validated.email.toLowerCase() }),
          ...(validated.role && { role: validated.role }),
        },
      });
    }

    // Update Profile fields
    if (user.profile) {
      await prisma.employeeProfile.update({
        where: { id: user.profile.id },
        data: {
          ...(validated.department !== undefined && { department: validated.department }),
          ...(validated.designation !== undefined && { designation: validated.designation }),
          ...(validated.employmentType !== undefined && { employmentType: validated.employmentType }),
          ...(validated.location !== undefined && { location: validated.location }),
          ...(validated.manager !== undefined && { manager: validated.manager }),
          ...(validated.phone !== undefined && { phone: validated.phone }),
          ...(validated.address !== undefined && { address: validated.address }),
          ...(validated.dateOfBirth !== undefined && { dateOfBirth: validated.dateOfBirth }),
        },
      });
    }

    // Update Salary if provided
    if (validated.basicSalary !== undefined || validated.allowances !== undefined || validated.deductions !== undefined) {
      const currentSal = await prisma.salary.findUnique({ where: { employeeId: user.employeeId } });
      const basic = validated.basicSalary !== undefined ? validated.basicSalary : (currentSal?.basicSalary || 0);
      const allow = validated.allowances !== undefined ? validated.allowances : (currentSal?.allowances || 0);
      const deduct = validated.deductions !== undefined ? validated.deductions : (currentSal?.deductions || 0);
      const net = basic + allow - deduct;

      await prisma.salary.upsert({
        where: { employeeId: user.employeeId },
        update: { basicSalary: basic, allowances: allow, deductions: deduct, netSalary: net },
        create: { employeeId: user.employeeId, basicSalary: basic, allowances: allow, deductions: deduct, netSalary: net },
      });

      await prisma.salaryHistory.create({
        data: {
          employeeId: user.employeeId,
          basicSalary: basic,
          allowances: allow,
          deductions: deduct,
          netSalary: net,
          changeReason: 'Admin updated employee compensation',
        },
      });

      await createNotification({
        userId: user.id,
        title: 'Salary Structure Updated',
        message: 'Your salary structure has been updated by People Operations.',
        type: 'payroll',
        link: '/employee/payroll',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, message: err.errors[0]?.message || 'Validation error' });
      return;
    }
    res.status(500).json({ success: false, message: err.message || 'Failed to update employee' });
  }
};

export const deleteEmployee = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ employeeId: id }, { id }],
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    // Do not allow deleting self
    if (user.id === req.user?.id) {
      res.status(400).json({ success: false, message: 'Cannot delete your own admin account' });
      return;
    }

    await prisma.user.delete({
      where: { id: user.id },
    });

    res.status(200).json({
      success: true,
      message: 'Employee record deleted successfully',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete employee' });
  }
};
