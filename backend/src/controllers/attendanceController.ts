import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { checkInSchema, checkOutSchema } from '../validators/index.js';
import { createNotification } from '../services/notificationService.js';

const getTodayString = () => new Date().toISOString().slice(0, 10);
const getCurrentTimeString = () => new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

const parseTimeToMinutes = (timeStr: string): number => {
  const parts = timeStr.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
};

export const checkIn = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const today = getTodayString();
    const currentTime = getCurrentTimeString();
    const validated = checkInSchema.parse(req.body || {});

    // Check if attendance record already exists for today
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: req.user.employeeId,
          date: today,
        },
      },
    });

    if (existing && existing.checkIn) {
      res.status(400).json({
        success: false,
        message: `You have already checked in today at ${existing.checkIn}. Multiple check-ins on the same day are not permitted.`,
        data: existing,
      });
      return;
    }

    // Determine if late (e.g. past 09:30 AM)
    const minutes = parseTimeToMinutes(currentTime);
    const status = minutes > 9 * 60 + 30 ? 'late' : 'present';

    const attendance = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: req.user.employeeId,
          date: today,
        },
      },
      update: {
        checkIn: currentTime,
        status,
        notes: validated.notes || existing?.notes || '',
      },
      create: {
        employeeId: req.user.employeeId,
        date: today,
        checkIn: currentTime,
        status,
        notes: validated.notes || '',
      },
    });

    await createNotification({
      userId: req.user.id,
      title: 'Checked In Successfully',
      message: `You checked in today at ${currentTime}. Have a productive day!`,
      type: 'attendance',
      link: '/employee/attendance',
    });

    res.status(200).json({
      success: true,
      message: `Checked in successfully at ${currentTime}`,
      data: attendance,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to check in' });
  }
};

export const checkOut = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const today = getTodayString();
    const currentTime = getCurrentTimeString();
    const validated = checkOutSchema.parse(req.body || {});

    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: req.user.employeeId,
          date: today,
        },
      },
    });

    if (!existing || !existing.checkIn) {
      res.status(400).json({
        success: false,
        message: 'Cannot check out before checking in. Please check in first.',
      });
      return;
    }

    // Calculate working hours
    const inMinutes = parseTimeToMinutes(existing.checkIn);
    const outMinutes = parseTimeToMinutes(currentTime);
    const diffMinutes = Math.max(0, outMinutes - inMinutes);
    const workingHours = parseFloat((diffMinutes / 60).toFixed(2));

    // If working hours < 4, could be half_day
    let status = existing.status;
    if (workingHours < 4 && workingHours > 0) {
      status = 'half_day';
    }

    const attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: currentTime,
        workingHours,
        status,
        notes: validated.notes || existing.notes,
      },
    });

    await createNotification({
      userId: req.user.id,
      title: 'Checked Out',
      message: `You checked out at ${currentTime}. Total working time: ${workingHours} hrs.`,
      type: 'attendance',
      link: '/employee/attendance',
    });

    res.status(200).json({
      success: true,
      message: `Checked out successfully at ${currentTime}. Total hours: ${workingHours}`,
      data: attendance,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to check out' });
  }
};

export const getMyAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { month, year } = req.query;
    const records = await prisma.attendance.findMany({
      where: {
        employeeId: req.user.employeeId,
        ...(year && month ? { date: { startsWith: `${year}-${String(month).padStart(2, '0')}` } } : {}),
      },
      orderBy: { date: 'desc' },
      take: 60,
    });

    // Today record
    const today = getTodayString();
    const todayRecord = records.find((r) => r.date === today) || null;

    res.status(200).json({
      success: true,
      data: {
        records,
        todayRecord,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch attendance' });
  }
};

export const getAllAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, date, status, search, fromDate, toDate } = req.query;

    const where: any = {};

    if (employeeId) {
      where.employeeId = String(employeeId);
    }

    if (date) {
      where.date = String(date);
    } else if (fromDate && toDate) {
      where.date = { gte: String(fromDate), lte: String(toDate) };
    }

    if (status && status !== 'all') {
      where.status = String(status);
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    });

    // Fetch user details for each record
    const empIds = Array.from(new Set(attendanceRecords.map((a) => a.employeeId)));
    const users = await prisma.user.findMany({
      where: { employeeId: { in: empIds } },
      include: { profile: true },
    });

    const userMap = new Map(users.map((u) => [u.employeeId, u]));

    const enriched = attendanceRecords.map((a) => {
      const u = userMap.get(a.employeeId);
      return {
        id: a.id,
        employeeId: a.employeeId,
        name: u?.name || a.employeeId,
        email: u?.email || '',
        department: u?.profile?.department || 'General',
        title: u?.profile?.designation || 'Team Member',
        initials: u?.profile?.initials || 'DF',
        color: u?.profile?.color || '#d47f68',
        date: a.date,
        checkIn: a.checkIn || '',
        checkOut: a.checkOut || '',
        workingHours: a.workingHours,
        status: a.status,
        notes: a.notes,
      };
    });

    // Filter by search if provided
    const filtered = search
      ? enriched.filter(
          (r) =>
            r.name.toLowerCase().includes(String(search).toLowerCase()) ||
            r.employeeId.toLowerCase().includes(String(search).toLowerCase()) ||
            r.department.toLowerCase().includes(String(search).toLowerCase())
        )
      : enriched;

    res.status(200).json({
      success: true,
      data: {
        records: filtered,
        total: filtered.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch attendance records' });
  }
};

export const getAttendanceByEmployeeId = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;

    if (req.user?.role !== 'admin' && req.user?.employeeId !== employeeId) {
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    const records = await prisma.attendance.findMany({
      where: { employeeId },
      orderBy: { date: 'desc' },
      take: 60,
    });

    res.status(200).json({
      success: true,
      data: {
        records,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch employee attendance' });
  }
};
