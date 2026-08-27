import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { updateSalarySchema } from '../validators/index.js';
import { createNotification } from '../services/notificationService.js';

export const getMyPayroll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const salary = await prisma.salary.findUnique({
      where: { employeeId: req.user.employeeId },
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true },
    });

    const history = await prisma.salaryHistory.findMany({
      where: { employeeId: req.user.employeeId },
      orderBy: { createdAt: 'desc' },
    });

    const basicSalary = salary?.basicSalary || 85000;
    const allowances = salary?.allowances || 5000;
    const deductions = salary?.deductions || 10000;
    const netSalary = basicSalary + allowances - deductions;

    const monthlyGross = (basicSalary + allowances) / 12;
    const monthlyNet = netSalary / 12;
    const monthlyDeductions = deductions / 12;

    const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    res.status(200).json({
      success: true,
      data: {
        employee: {
          id: user?.employeeId,
          name: user?.name,
          email: user?.email,
          department: user?.profile?.department || 'General',
          designation: user?.profile?.designation || 'Team Member',
          joiningDate: user?.profile?.joiningDate || '2023',
        },
        salaryStructure: {
          basicSalary,
          allowances,
          deductions,
          netSalary,
          monthlyGross,
          monthlyNet,
          monthlyDeductions,
          bonusTarget: 8500,
          benefitsAllowance: 2400,
        },
        slip: {
          payPeriod: currentMonthName,
          payDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          earnings: [
            { label: 'Basic Salary', amount: (basicSalary / 12).toFixed(2) },
            { label: 'House Rent Allowance (HRA)', amount: ((allowances * 0.6) / 12).toFixed(2) },
            { label: 'Special Allowance', amount: ((allowances * 0.4) / 12).toFixed(2) },
          ],
          deductions: [
            { label: 'Income Tax / TDS', amount: ((deductions * 0.75) / 12).toFixed(2) },
            { label: 'Health Insurance & PF', amount: ((deductions * 0.25) / 12).toFixed(2) },
          ],
          grossTotal: monthlyGross.toFixed(2),
          deductionsTotal: monthlyDeductions.toFixed(2),
          netPay: monthlyNet.toFixed(2),
        },
        history,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch payroll information' });
  }
};

export const getAllPayroll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { department, search } = req.query;

    const users = await prisma.user.findMany({
      where: {
        ...(department && department !== 'All departments' ? { profile: { department: String(department) } } : {}),
      },
      include: { profile: true },
      orderBy: { createdAt: 'asc' },
    });

    const empIds = users.map((u) => u.employeeId);
    const salaries = await prisma.salary.findMany({
      where: { employeeId: { in: empIds } },
    });

    const salaryMap = new Map(salaries.map((s) => [s.employeeId, s]));

    const payrollList = users.map((u) => {
      const sal = salaryMap.get(u.employeeId);
      const basic = sal?.basicSalary || 85000;
      const allow = sal?.allowances || 5000;
      const deduct = sal?.deductions || 10000;
      const net = basic + allow - deduct;

      return {
        id: u.employeeId,
        userId: u.id,
        name: u.name,
        email: u.email,
        title: u.profile?.designation || 'Team Member',
        department: u.profile?.department || 'General',
        initials: u.profile?.initials || 'DF',
        color: u.profile?.color || '#d47f68',
        basicSalary: basic,
        allowances: allow,
        deductions: deduct,
        netSalary: net,
        annualBase: basic + allow,
        monthlyGross: (basic + allow) / 12,
        monthlyNet: net / 12,
      };
    });

    const filtered = search
      ? payrollList.filter(
          (p) =>
            p.name.toLowerCase().includes(String(search).toLowerCase()) ||
            p.id.toLowerCase().includes(String(search).toLowerCase()) ||
            p.department.toLowerCase().includes(String(search).toLowerCase())
        )
      : payrollList;

    const totalAnnualPayroll = filtered.reduce((sum, p) => sum + p.annualBase, 0);
    const totalMonthlyGross = filtered.reduce((sum, p) => sum + p.monthlyGross, 0);
    const totalMonthlyNet = filtered.reduce((sum, p) => sum + p.monthlyNet, 0);

    res.status(200).json({
      success: true,
      data: {
        payrolls: filtered,
        summary: {
          totalEmployees: filtered.length,
          totalAnnualPayroll,
          totalMonthlyGross,
          totalMonthlyNet,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch payroll records' });
  }
};

export const updateSalaryStructure = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const validated = updateSalarySchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ employeeId }, { id: employeeId }],
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    const netSalary = validated.basicSalary + validated.allowances - validated.deductions;

    const updatedSalary = await prisma.salary.upsert({
      where: { employeeId: user.employeeId },
      update: {
        basicSalary: validated.basicSalary,
        allowances: validated.allowances,
        deductions: validated.deductions,
        netSalary,
        effectiveFrom: new Date(),
      },
      create: {
        employeeId: user.employeeId,
        basicSalary: validated.basicSalary,
        allowances: validated.allowances,
        deductions: validated.deductions,
        netSalary,
        effectiveFrom: new Date(),
      },
    });

    // Maintain historical audit log
    await prisma.salaryHistory.create({
      data: {
        employeeId: user.employeeId,
        basicSalary: validated.basicSalary,
        allowances: validated.allowances,
        deductions: validated.deductions,
        netSalary,
        changeReason: validated.changeReason || 'Salary structure revised by Admin',
      },
    });

    // Notify employee
    await createNotification({
      userId: user.id,
      title: 'Salary Structure Updated',
      message: `Your compensation package has been updated. New net annual salary: $${netSalary.toLocaleString()}.`,
      type: 'payroll',
      link: '/employee/payroll',
    });

    res.status(200).json({
      success: true,
      message: 'Salary structure updated successfully',
      data: updatedSalary,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, message: err.errors[0]?.message || 'Validation error' });
      return;
    }
    res.status(500).json({ success: false, message: err.message || 'Failed to update salary' });
  }
};

export const getSalaryHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;

    if (req.user?.role !== 'admin' && req.user?.employeeId !== employeeId) {
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    const history = await prisma.salaryHistory.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: { history },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch salary history' });
  }
};
