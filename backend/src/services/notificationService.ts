import { prisma } from '../config/prisma.js';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: 'leave' | 'attendance' | 'payroll' | 'profile' | 'system';
  link?: string;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type || 'system',
        link: params.link || '',
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

export const notifyAdmins = async (title: string, message: string, type = 'system', link = '') => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title,
          message,
          type,
          link,
        },
      });
    }
  } catch (error) {
    console.error('Failed to notify admins:', error);
  }
};
