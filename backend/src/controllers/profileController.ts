import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { updateProfileSchema } from '../validators/index.js';

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
      res.status(404).json({ success: false, message: 'Profile not found' });
      return;
    }

    const salary = await prisma.salary.findUnique({
      where: { employeeId: user.employeeId },
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
        documents: user.profile?.documents || [],
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const validated = updateProfileSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      res.status(404).json({ success: false, message: 'Profile not found' });
      return;
    }

    // Role enforcement: Regular employees can only update phone, address, dateOfBirth, and profilePicture
    const updatedProfile = await prisma.employeeProfile.update({
      where: { id: user.profile.id },
      data: {
        ...(validated.phone !== undefined && { phone: validated.phone }),
        ...(validated.address !== undefined && { address: validated.address }),
        ...(validated.dateOfBirth !== undefined && { dateOfBirth: validated.dateOfBirth }),
        ...(validated.profilePicture !== undefined && { profilePicture: validated.profilePicture }),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, message: err.errors[0]?.message || 'Validation error' });
      return;
    }
    res.status(500).json({ success: false, message: err.message || 'Failed to update profile' });
  }
};

export const uploadAvatar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { imageUrl } = req.body;
    if (!imageUrl) {
      res.status(400).json({ success: false, message: 'Image data or URL is required' });
      return;
    }

    const profile = await prisma.employeeProfile.update({
      where: { userId: req.user.id },
      data: { profilePicture: imageUrl },
    });

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: { profilePicture: profile.profilePicture },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to upload avatar' });
  }
};

export const uploadDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { name, fileUrl, documentType, fileSize } = req.body;
    if (!name || !fileUrl) {
      res.status(400).json({ success: false, message: 'Document name and file URL are required' });
      return;
    }

    const doc = await prisma.document.create({
      data: {
        employeeId: req.user.employeeId,
        name,
        fileUrl,
        documentType: documentType || 'other',
        fileSize: fileSize || '1.2 MB',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: doc,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to upload document' });
  }
};
