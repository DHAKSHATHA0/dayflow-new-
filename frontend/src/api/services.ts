import apiClient from './apiClient';
import type {
  User,
  EmployeeItem,
  AttendanceRecord,
  LeaveRecord,
  LeaveBalances,
  SalaryStructure,
  SalaryHistoryItem,
  SalarySlipData,
  NotificationItem,
  Role,
} from '../types';

export const authApi = {
  signup: async (data: { name: string; email: string; password: string; role: Role }) => {
    const res = await apiClient.post('/auth/signup', data);
    return res.data;
  },
  login: async (data: { email: string; password: string; rememberMe?: boolean }) => {
    const res = await apiClient.post('/auth/login', data);
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  verifyEmail: async (data: { email: string; token: string }) => {
    const res = await apiClient.post('/auth/verify-email', data);
    return res.data;
  },
  forgotPassword: async (data: { email: string }) => {
    const res = await apiClient.post('/auth/forgot-password', data);
    return res.data;
  },
  resetPassword: async (data: { email: string; token: string; newPassword: string }) => {
    const res = await apiClient.post('/auth/reset-password', data);
    return res.data;
  },
};

export const employeeApi = {
  getAll: async (params?: { search?: string; department?: string; role?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<{ success: boolean; data: { employees: EmployeeItem[]; total: number } }>('/employees', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/employees/${id}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/employees', data);
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.put(`/employees/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete(`/employees/${id}`);
    return res.data;
  },
};

export const profileApi = {
  get: async () => {
    const res = await apiClient.get<{ success: boolean; data: EmployeeItem }>('/profile');
    return res.data;
  },
  update: async (data: { phone?: string; address?: string; dateOfBirth?: string; profilePicture?: string }) => {
    const res = await apiClient.put('/profile', data);
    return res.data;
  },
  uploadAvatar: async (imageUrl: string) => {
    const res = await apiClient.post('/profile/avatar', { imageUrl });
    return res.data;
  },
  uploadDocument: async (data: { name: string; fileUrl: string; documentType?: string; fileSize?: string }) => {
    const res = await apiClient.post('/profile/documents', data);
    return res.data;
  },
};

export const attendanceApi = {
  checkIn: async (notes?: string) => {
    const res = await apiClient.post('/attendance/check-in', { notes });
    return res.data;
  },
  checkOut: async (notes?: string) => {
    const res = await apiClient.post('/attendance/check-out', { notes });
    return res.data;
  },
  getMyAttendance: async (params?: { month?: number; year?: number }) => {
    const res = await apiClient.get<{ success: boolean; data: { records: AttendanceRecord[]; todayRecord: AttendanceRecord | null } }>('/attendance/my', { params });
    return res.data;
  },
  getAllAttendance: async (params?: { employeeId?: string; date?: string; status?: string; search?: string; fromDate?: string; toDate?: string }) => {
    const res = await apiClient.get<{ success: boolean; data: { records: AttendanceRecord[]; total: number } }>('/attendance', { params });
    return res.data;
  },
  getByEmployeeId: async (employeeId: string) => {
    const res = await apiClient.get(`/attendance/${employeeId}`);
    return res.data;
  },
};

export const leaveApi = {
  apply: async (data: { leaveType: string; startDate: string; endDate: string; remarks: string }) => {
    const res = await apiClient.post('/leaves', data);
    return res.data;
  },
  getMyLeaves: async () => {
    const res = await apiClient.get<{ success: boolean; data: { leaves: LeaveRecord[]; balances: LeaveBalances } }>('/leaves/my');
    return res.data;
  },
  getAllLeaves: async (params?: { status?: string; leaveType?: string; employeeId?: string; search?: string }) => {
    const res = await apiClient.get<{ success: boolean; data: { leaves: LeaveRecord[]; total: number } }>('/leaves', { params });
    return res.data;
  },
  approve: async (id: string, reviewComment?: string) => {
    const res = await apiClient.put(`/leaves/${id}/approve`, { reviewComment });
    return res.data;
  },
  reject: async (id: string, reviewComment: string) => {
    const res = await apiClient.put(`/leaves/${id}/reject`, { reviewComment });
    return res.data;
  },
};

export const payrollApi = {
  getMyPayroll: async () => {
    const res = await apiClient.get<{
      success: boolean;
      data: {
        employee: any;
        salaryStructure: SalaryStructure & { monthlyGross: number; monthlyNet: number; monthlyDeductions: number; bonusTarget: number; benefitsAllowance: number };
        slip: SalarySlipData;
        history: SalaryHistoryItem[];
      };
    }>('/payroll/my');
    return res.data;
  },
  getAllPayroll: async (params?: { department?: string; search?: string }) => {
    const res = await apiClient.get<{
      success: boolean;
      data: {
        payrolls: any[];
        summary: { totalEmployees: number; totalAnnualPayroll: number; totalMonthlyGross: number; totalMonthlyNet: number };
      };
    }>('/payroll', { params });
    return res.data;
  },
  updateSalary: async (employeeId: string, data: { basicSalary: number; allowances: number; deductions: number; changeReason?: string }) => {
    const res = await apiClient.put(`/payroll/${employeeId}`, data);
    return res.data;
  },
  getHistory: async (employeeId: string) => {
    const res = await apiClient.get(`/payroll/${employeeId}/history`);
    return res.data;
  },
};

export const notificationApi = {
  getAll: async () => {
    const res = await apiClient.get<{ success: boolean; data: { notifications: NotificationItem[]; unreadCount: number } }>('/notifications');
    return res.data;
  },
  markRead: async (id: string) => {
    const res = await apiClient.put(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await apiClient.put('/notifications/read-all');
    return res.data;
  },
};

export const reportApi = {
  getAttendanceReport: async () => {
    const res = await apiClient.get('/reports/attendance');
    return res.data;
  },
  getLeaveReport: async () => {
    const res = await apiClient.get('/reports/leave');
    return res.data;
  },
  getPayrollReport: async () => {
    const res = await apiClient.get('/reports/payroll');
    return res.data;
  },
  getAnalytics: async () => {
    const res = await apiClient.get('/reports/analytics');
    return res.data;
  },
};

export const settingApi = {
  get: async () => {
    const res = await apiClient.get('/settings');
    return res.data;
  },
  update: async (settings: { key: string; value: string; category?: string }[]) => {
    const res = await apiClient.put('/settings', { settings });
    return res.data;
  },
};
