import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';

export interface AuthUser {
  id: string;
  employeeId: string;
  email: string;
  role: 'employee' | 'admin';
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dayflow_super_secret_jwt_key_2025_hrms_flow';

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication token is missing or invalid' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string; employeeId: string; email: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, employeeId: true, email: true, role: true, name: true },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found or session expired' });
      return;
    }

    req.user = {
      id: user.id,
      employeeId: user.employeeId,
      email: user.email,
      role: user.role as 'employee' | 'admin',
      name: user.name,
    };

    next();
  } catch (err: any) {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  }
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
    return;
  }
  next();
};

export const requireEmployee = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  next();
};
