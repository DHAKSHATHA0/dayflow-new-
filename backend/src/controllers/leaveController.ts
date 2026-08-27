import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { applyLeaveSchema, reviewLeaveSchema } from '../validators/index.js';
import { createNotification, notifyAdmins } from '../services/notificationService.js';

const calculateDays = (startStr: string, endStr: string): number => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
};

export const applyLeave = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const validated = applyLeaveSchema.parse(req.body);

    if (new Date(validated.startDate) > new Date(validated.endDate)) {
      res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
      return;
    }

    // Check for overlapping approved/pending leaves
    const existing = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: req.user.employeeId,
        status: { in: ['pending', 'approved'] },
        OR: [
          {
            startDate: { lte: validated.endDate },
            endDate: { gte: validated.startDate },
          },
        ],
      },
    });

    if (existing) {
      res.status(400).json({
        success: false,
        message: `You already have an active/pending leave request between ${existing.startDate} and ${existing.endDate}. Overlapping leaves are not allowed.`,
      });
      return;
    }

    const days = calculateDays(validated.startDate, validated.endDate);

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: req.user.employeeId,
        leaveType: validated.leaveType,
        startDate: validated.startDate,
        endDate: validated.endDate,
        days,
        remarks: validated.remarks,
        status: 'pending',
      },
    });

    // Notify admins
    await notifyAdmins(
      'New Leave Request Submitted',
      `${req.user.name} requested ${days} day(s) for ${validated.leaveType} (${validated.startDate} to ${validated.endDate}).`,
      'leave',
      '/admin/leave-approvals'
    );

    // Notify user
    await createNotification({
      userId: req.user.id,
      title: 'Leave Request Submitted',
      message: `Your request for ${validated.leaveType} (${days} days) has been submitted for approval.`,
      type: 'leave',
      link: '/employee/leave',
    });

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leave,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, message: err.errors[0]?.message || 'Validation error' });
      return;
    }
    res.status(500).json({ success: false, message: err.message || 'Failed to submit leave request' });
  }
};

export const getMyLeaves = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: { employeeId: req.user.employeeId },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate balances
    const approvedPaid = leaves
      .filter((l) => l.status === 'approved' && l.leaveType === 'Paid leave')
      .reduce((sum, l) => sum + l.days, 0);

    const approvedSick = leaves
      .filter((l) => l.status === 'approved' && l.leaveType === 'Sick leave')
      .reduce((sum, l) => sum + l.days, 0);

    const totalPaidAllowance = 20;
    const totalSickAllowance = 10;

    const balances = {
      paidLeave: Math.max(0, totalPaidAllowance - approvedPaid),
      sickLeave: Math.max(0, totalSickAllowance - approvedSick),
      unpaidLeave: leaves
        .filter((l) => l.status === 'approved' && l.leaveType === 'Unpaid leave')
        .reduce((sum, l) => sum + l.days, 0),
      totalPaidAllowance,
      totalSickAllowance,
    };

    res.status(200).json({
      success: true,
      data: {
        leaves: leaves.map((l) => ({
          id: l.id,
          employeeId: l.employeeId,
          type: l.leaveType,
          start: l.startDate,
          end: l.endDate,
          days: l.days,
          reason: l.remarks,
          status: l.status,
          comment: l.reviewComment,
          reviewedBy: l.reviewedBy,
          createdAt: l.createdAt,
        })),
        balances,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch leaves' });
  }
};

export const getAllLeaves = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, leaveType, employeeId, search } = req.query;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = String(status);
    }
    if (leaveType && leaveType !== 'all') {
      where.leaveType = String(leaveType);
    }
    if (employeeId) {
      where.employeeId = String(employeeId);
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    const empIds = Array.from(new Set(leaves.map((l) => l.employeeId)));
    const users = await prisma.user.findMany({
      where: { employeeId: { in: empIds } },
      include: { profile: true },
    });

    const userMap = new Map(users.map((u) => [u.employeeId, u]));

    const enriched = leaves.map((l) => {
      const u = userMap.get(l.employeeId);
      return {
        id: l.id,
        employeeId: l.employeeId,
        name: u?.name || l.employeeId,
        email: u?.email || '',
        title: u?.profile?.designation || 'Team Member',
        department: u?.profile?.department || 'General',
        initials: u?.profile?.initials || 'DF',
        color: u?.profile?.color || '#d47f68',
        type: l.leaveType,
        start: l.startDate,
        end: l.endDate,
        days: l.days,
        reason: l.remarks,
        status: l.status,
        comment: l.reviewComment,
        reviewedBy: l.reviewedBy,
        createdAt: l.createdAt,
      };
    });

    const filtered = search
      ? enriched.filter(
          (l) =>
            l.name.toLowerCase().includes(String(search).toLowerCase()) ||
            l.employeeId.toLowerCase().includes(String(search).toLowerCase()) ||
            l.department.toLowerCase().includes(String(search).toLowerCase())
        )
      : enriched;

    res.status(200).json({
      success: true,
      data: {
        leaves: filtered,
        total: filtered.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch leave requests' });
  }
};

export const approveLeave = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reviewComment } = req.body;

    const leave = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!leave) {
      res.status(404).json({ success: false, message: 'Leave request not found' });
      return;
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'approved',
        reviewedBy: req.user?.name || 'Admin',
        reviewComment: reviewComment || 'Approved by People Operations',
      },
    });

    // Notify employee
    const user = await prisma.user.findUnique({
      where: { employeeId: leave.employeeId },
    });

    if (user) {
      await createNotification({
        userId: user.id,
        title: 'Leave Request Approved',
        message: `Your ${leave.leaveType} request for ${leave.startDate} to ${leave.endDate} (${leave.days} days) has been approved.`,
        type: 'leave',
        link: '/employee/leave',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Leave request approved successfully',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to approve leave request' });
  }
};

export const rejectLeave = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reviewComment } = req.body;

    if (!reviewComment || !reviewComment.trim()) {
      res.status(400).json({
        success: false,
        message: 'A rejection comment/reason is required when rejecting a leave request.',
      });
      return;
    }

    const leave = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!leave) {
      res.status(404).json({ success: false, message: 'Leave request not found' });
      return;
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewedBy: req.user?.name || 'Admin',
        reviewComment: reviewComment.trim(),
      },
    });

    // Notify employee
    const user = await prisma.user.findUnique({
      where: { employeeId: leave.employeeId },
    });

    if (user) {
      await createNotification({
        userId: user.id,
        title: 'Leave Request Rejected',
        message: `Your ${leave.leaveType} request was not approved. Note: "${reviewComment}"`,
        type: 'leave',
        link: '/employee/leave',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Leave request rejected successfully',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to reject leave request' });
  }
};
