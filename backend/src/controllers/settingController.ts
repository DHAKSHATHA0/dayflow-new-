import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { updateSettingSchema } from '../validators/index.js';

export const getSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const settings = await prisma.setting.findMany();

    const defaults: Record<string, string> = {
      organizationName: 'Dayflow Inc.',
      officialEmail: 'operations@dayflow.com',
      workHoursStart: '09:00',
      workHoursEnd: '17:30',
      workDaysPerWeek: '5',
      paidLeaveAllowance: '20',
      sickLeaveAllowance: '10',
      currency: 'USD ($)',
      emailNotifications: 'true',
      autoApproveCheckIn: 'true',
    };

    const settingMap = new Map(settings.map((s) => [s.key, s.value]));
    const combined: Record<string, string> = { ...defaults };

    for (const [k, v] of settingMap.entries()) {
      combined[k] = v;
    }

    res.status(200).json({
      success: true,
      data: combined,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch settings' });
  }
};

export const updateSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validated = updateSettingSchema.parse(req.body);

    for (const item of validated.settings) {
      await prisma.setting.upsert({
        where: { key: item.key },
        update: { value: item.value, category: item.category || 'general' },
        create: { key: item.key, value: item.value, category: item.category || 'general' },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, message: err.errors[0]?.message || 'Validation error' });
      return;
    }
    res.status(500).json({ success: false, message: err.message || 'Failed to update settings' });
  }
};
