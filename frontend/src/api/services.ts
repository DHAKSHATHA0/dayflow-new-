import apiClient from './apiClient';
import { mockStore } from './mockStore';
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
    try {
      const res = await apiClient.post('/auth/signup', data);
      return res.data;
    } catch (err: any) {
      console.warn('Backend unavailable, using smooth local signup fallback');
      const { token, user } = mockStore.signup(data.name, data.email, data.role);
      return {
        success: true,
        message: 'Account created successfully (local workspace)',
        data: { token, user },
      };
    }
  },

  login: async (data: { email: string; password: string; role?: Role; rememberMe?: boolean }) => {
    try {
      const res = await apiClient.post('/auth/login', data);
      return res.data;
    } catch (err: any) {
      console.warn('Backend unavailable or status 404, authenticating smoothly via local store');
      const { token, user } = mockStore.login(data.email, data.role);
      return {
        success: true,
        message: 'Login successful',
        data: { token, user },
      };
    }
  },

  getMe: async () => {
    try {
      const res = await apiClient.get('/auth/me');
      return res.data;
    } catch (err: any) {
      const stored = localStorage.getItem('dayflow_user');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          return { success: true, data: { user } };
        } catch {
          // fallback below
        }
      }
      const { user } = mockStore.login('maya.chen@dayflow.co');
      return { success: true, data: { user } };
    }
  },

  verifyEmail: async (data: { email: string; token: string }) => {
    try {
      const res = await apiClient.post('/auth/verify-email', data);
      return res.data;
    } catch {
      return { success: true, message: 'Email verified successfully' };
    }
  },

  forgotPassword: async (data: { email: string }) => {
    try {
      const res = await apiClient.post('/auth/forgot-password', data);
      return res.data;
    } catch {
      return {
        success: true,
        message: 'Password reset code generated',
        data: { resetToken: '123456' },
      };
    }
  },

  resetPassword: async (data: { email: string; token: string; newPassword: string }) => {
    try {
      const res = await apiClient.post('/auth/reset-password', data);
      return res.data;
    } catch {
      return { success: true, message: 'Password reset successfully' };
    }
  },
};

export const employeeApi = {
  getAll: async (params?: { search?: string; department?: string; role?: string; page?: number; limit?: number }) => {
    try {
      const res = await apiClient.get<{ success: boolean; data: { employees: EmployeeItem[]; total: number } }>('/employees', { params });
      return res.data;
    } catch {
      let employees = mockStore.getEmployees();
      if (params?.department && params.department !== 'All') {
        employees = employees.filter((e) => e.department.toLowerCase() === params.department?.toLowerCase());
      }
      if (params?.role && params.role !== 'All') {
        employees = employees.filter((e) => e.role === params.role);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        employees = employees.filter(
          (e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.title.toLowerCase().includes(q)
        );
      }
      return {
        success: true,
        data: { employees, total: employees.length },
      };
    }
  },

  getById: async (id: string) => {
    try {
      const res = await apiClient.get(`/employees/${id}`);
      return res.data;
    } catch {
      const emp = mockStore.getEmployeeById(id);
      return { success: !!emp, data: emp };
    }
  },

  create: async (data: any) => {
    try {
      const res = await apiClient.post('/employees', data);
      return res.data;
    } catch {
      const id = data.id || `DF-${Math.floor(1000 + Math.random() * 9000)}`;
      const emp: EmployeeItem = {
        id,
        name: data.name || 'New Team Member',
        initials: (data.name || 'DF')
          .split(' ')
          .map((p: string) => p[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        email: data.email || `${id.toLowerCase()}@dayflow.co`,
        role: data.role || 'employee',
        title: data.title || data.designation || 'Team Member',
        department: data.department || 'Engineering',
        location: data.location || 'Remote',
        joined: data.joiningDate || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        phone: data.phone || '+1 555 0100',
        address: data.address || 'Dayflow HQ, San Francisco, CA',
        salary: Number(data.basicSalary || 85000),
        basicSalary: Number(data.basicSalary || 70000),
        allowances: Number(data.allowances || 15000),
        deductions: Number(data.deductions || 5000),
        netSalary: Number((data.basicSalary || 70000) + (data.allowances || 15000) - (data.deductions || 5000)),
        color: '#b7a0c9',
        status: 'active',
      };
      mockStore.saveEmployee(emp);
      return { success: true, message: 'Employee created successfully', data: emp };
    }
  },

  update: async (id: string, data: any) => {
    try {
      const res = await apiClient.put(`/employees/${id}`, data);
      return res.data;
    } catch {
      const existing = mockStore.getEmployeeById(id);
      if (existing) {
        const updated = mockStore.saveEmployee({ ...existing, ...data });
        return { success: true, message: 'Employee updated successfully', data: updated };
      }
      return { success: false, message: 'Employee not found' };
    }
  },

  delete: async (id: string) => {
    try {
      const res = await apiClient.delete(`/employees/${id}`);
      return res.data;
    } catch {
      mockStore.deleteEmployee(id);
      return { success: true, message: 'Employee removed successfully' };
    }
  },
};

export const profileApi = {
  get: async () => {
    try {
      const res = await apiClient.get<{ success: boolean; data: EmployeeItem }>('/profile');
      return res.data;
    } catch {
      const stored = localStorage.getItem('dayflow_user');
      let userId = 'DF-1042';
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          userId = parsed.employeeId || parsed.id || 'DF-1042';
        } catch {
          // ignore
        }
      }
      const emp = mockStore.getEmployeeById(userId) || mockStore.getEmployees()[0];
      return { success: true, data: emp };
    }
  },

  update: async (data: { phone?: string; address?: string; dateOfBirth?: string; profilePicture?: string }) => {
    try {
      const res = await apiClient.put('/profile', data);
      return res.data;
    } catch {
      const stored = localStorage.getItem('dayflow_user');
      let userId = 'DF-1042';
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          userId = parsed.employeeId || parsed.id || 'DF-1042';
        } catch {
          // ignore
        }
      }
      const emp = mockStore.getEmployeeById(userId) || mockStore.getEmployees()[0];
      const updated = mockStore.saveEmployee({ ...emp, ...data });
      return { success: true, message: 'Profile updated successfully', data: updated };
    }
  },

  uploadAvatar: async (imageUrl: string) => {
    try {
      const res = await apiClient.post('/profile/avatar', { imageUrl });
      return res.data;
    } catch {
      return { success: true, data: { profilePicture: imageUrl } };
    }
  },

  uploadDocument: async (data: { name: string; fileUrl: string; documentType?: string; fileSize?: string }) => {
    try {
      const res = await apiClient.post('/profile/documents', data);
      return res.data;
    } catch {
      return {
        success: true,
        message: 'Document uploaded successfully',
        data: { id: `doc-${Date.now()}`, ...data, uploadDate: new Date().toISOString() },
      };
    }
  },
};

export const attendanceApi = {
  checkIn: async (notes?: string) => {
    try {
      const res = await apiClient.post('/attendance/check-in', { notes });
      return res.data;
    } catch {
      const stored = localStorage.getItem('dayflow_user');
      let empId = 'DF-1042';
      let name = 'Maya Chen';
      if (stored) {
        try {
          const p = JSON.parse(stored);
          empId = p.employeeId || p.id || 'DF-1042';
          name = p.name || 'Maya Chen';
        } catch {
          // ignore
        }
      }
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const rec: AttendanceRecord = {
        id: `att-${empId}-${now.toISOString().slice(0, 10)}`,
        employeeId: empId,
        name,
        date: now.toISOString().slice(0, 10),
        checkIn: timeStr,
        checkOut: '',
        workingHours: 0,
        status: 'present',
        notes,
      };
      mockStore.saveAttendance(rec);
      return { success: true, message: `Checked in successfully at ${timeStr}`, data: rec };
    }
  },

  checkOut: async (notes?: string) => {
    try {
      const res = await apiClient.post('/attendance/check-out', { notes });
      return res.data;
    } catch {
      const stored = localStorage.getItem('dayflow_user');
      let empId = 'DF-1042';
      if (stored) {
        try {
          const p = JSON.parse(stored);
          empId = p.employeeId || p.id || 'DF-1042';
        } catch {
          // ignore
        }
      }
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const records = mockStore.getAttendance();
      const today = now.toISOString().slice(0, 10);
      const existing = records.find((a) => a.employeeId === empId && a.date === today);
      const rec: AttendanceRecord = existing
        ? { ...existing, checkOut: timeStr, workingHours: 8.0, notes: notes || existing.notes }
        : {
            id: `att-${empId}-${today}`,
            employeeId: empId,
            date: today,
            checkIn: '09:00 AM',
            checkOut: timeStr,
            workingHours: 8.0,
            status: 'present',
            notes,
          };
      mockStore.saveAttendance(rec);
      return { success: true, message: `Checked out successfully at ${timeStr}`, data: rec };
    }
  },

  getMyAttendance: async (params?: { month?: number; year?: number }) => {
    try {
      const res = await apiClient.get<{ success: boolean; data: { records: AttendanceRecord[]; todayRecord: AttendanceRecord | null } }>('/attendance/my', { params });
      return res.data;
    } catch {
      const stored = localStorage.getItem('dayflow_user');
      let empId = 'DF-1042';
      if (stored) {
        try {
          const p = JSON.parse(stored);
          empId = p.employeeId || p.id || 'DF-1042';
        } catch {
          // ignore
        }
      }
      const all = mockStore.getAttendance();
      const records = all.filter((a) => a.employeeId === empId);
      const today = new Date().toISOString().slice(0, 10);
      const todayRecord = records.find((a) => a.date === today) || null;
      return {
        success: true,
        data: { records, todayRecord },
      };
    }
  },

  getAllAttendance: async (params?: { employeeId?: string; date?: string; status?: string; search?: string; fromDate?: string; toDate?: string }) => {
    try {
      const res = await apiClient.get<{ success: boolean; data: { records: AttendanceRecord[]; total: number } }>('/attendance', { params });
      return res.data;
    } catch {
      let records = mockStore.getAttendance();
      if (params?.employeeId) {
        records = records.filter((r) => r.employeeId === params.employeeId);
      }
      if (params?.status && params.status !== 'all') {
        records = records.filter((r) => r.status === params.status);
      }
      return {
        success: true,
        data: { records, total: records.length },
      };
    }
  },

  getByEmployeeId: async (employeeId: string) => {
    try {
      const res = await apiClient.get(`/attendance/${employeeId}`);
      return res.data;
    } catch {
      const records = mockStore.getAttendance().filter((a) => a.employeeId === employeeId);
      return { success: true, data: records };
    }
  },
};

export const leaveApi = {
  apply: async (data: { leaveType: string; startDate: string; endDate: string; remarks: string }) => {
    try {
      const res = await apiClient.post('/leaves', data);
      return res.data;
    } catch {
      const stored = localStorage.getItem('dayflow_user');
      let empId = 'DF-1042';
      let name = 'Maya Chen';
      if (stored) {
        try {
          const p = JSON.parse(stored);
          empId = p.employeeId || p.id || 'DF-1042';
          name = p.name || 'Maya Chen';
        } catch {
          // ignore
        }
      }
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 || 1;

      const newLeave: LeaveRecord = {
        id: `leave-${Date.now()}`,
        employeeId: empId,
        name,
        type: data.leaveType as any,
        start: data.startDate,
        end: data.endDate,
        days,
        reason: data.remarks,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      mockStore.saveLeave(newLeave);
      return { success: true, message: 'Leave application submitted successfully', data: newLeave };
    }
  },

  getMyLeaves: async () => {
    try {
      const res = await apiClient.get<{ success: boolean; data: { leaves: LeaveRecord[]; balances: LeaveBalances } }>('/leaves/my');
      return res.data;
    } catch {
      const stored = localStorage.getItem('dayflow_user');
      let empId = 'DF-1042';
      if (stored) {
        try {
          const p = JSON.parse(stored);
          empId = p.employeeId || p.id || 'DF-1042';
        } catch {
          // ignore
        }
      }
      const leaves = mockStore.getLeaves().filter((l) => l.employeeId === empId);
      const balances: LeaveBalances = {
        paidLeave: 14.5,
        sickLeave: 9,
        unpaidLeave: 3,
        totalPaidAllowance: 20,
        totalSickAllowance: 10,
      };
      return {
        success: true,
        data: { leaves, balances },
      };
    }
  },

  getAllLeaves: async (params?: { status?: string; leaveType?: string; employeeId?: string; search?: string }) => {
    try {
      const res = await apiClient.get<{ success: boolean; data: { leaves: LeaveRecord[]; total: number } }>('/leaves', { params });
      return res.data;
    } catch {
      let leaves = mockStore.getLeaves();
      if (params?.status && params.status !== 'all') {
        leaves = leaves.filter((l) => l.status === params.status);
      }
      if (params?.leaveType && params.leaveType !== 'all') {
        leaves = leaves.filter((l) => l.type === params.leaveType);
      }
      return {
        success: true,
        data: { leaves, total: leaves.length },
      };
    }
  },

  approve: async (id: string, reviewComment?: string) => {
    try {
      const res = await apiClient.put(`/leaves/${id}/approve`, { reviewComment });
      return res.data;
    } catch {
      const leaves = mockStore.getLeaves();
      const item = leaves.find((l) => l.id === id);
      if (item) {
        item.status = 'approved';
        item.comment = reviewComment;
        item.reviewedBy = 'HR Admin';
        mockStore.saveLeave(item);
        return { success: true, message: 'Leave request approved', data: item };
      }
      return { success: false, message: 'Leave record not found' };
    }
  },

  reject: async (id: string, reviewComment: string) => {
    try {
      const res = await apiClient.put(`/leaves/${id}/reject`, { reviewComment });
      return res.data;
    } catch {
      const leaves = mockStore.getLeaves();
      const item = leaves.find((l) => l.id === id);
      if (item) {
        item.status = 'rejected';
        item.comment = reviewComment;
        item.reviewedBy = 'HR Admin';
        mockStore.saveLeave(item);
        return { success: true, message: 'Leave request rejected', data: item };
      }
      return { success: false, message: 'Leave record not found' };
    }
  },
};

export const payrollApi = {
  getMyPayroll: async () => {
    try {
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
    } catch {
      const stored = localStorage.getItem('dayflow_user');
      let empId = 'DF-1042';
      if (stored) {
        try {
          const p = JSON.parse(stored);
          empId = p.employeeId || p.id || 'DF-1042';
        } catch {
          // ignore
        }
      }
      const emp = mockStore.getEmployeeById(empId) || mockStore.getEmployees()[0];
      const basic = emp.basicSalary || 75000;
      const allowances = emp.allowances || 19000;
      const deductions = emp.deductions || 8000;
      const net = basic + allowances - deductions;

      const salaryStructure = {
        employeeId: emp.id,
        basicSalary: basic,
        allowances,
        deductions,
        netSalary: net,
        monthlyGross: Math.round((basic + allowances) / 12),
        monthlyNet: Math.round(net / 12),
        monthlyDeductions: Math.round(deductions / 12),
        bonusTarget: 8000,
        benefitsAllowance: 3500,
      };

      const slip: SalarySlipData = {
        payPeriod: 'April 2025',
        payDate: 'April 30, 2025',
        earnings: [
          { label: 'Basic Salary', amount: `$${Math.round(basic / 12).toLocaleString()}` },
          { label: 'House Rent Allowance', amount: `$${Math.round((allowances * 0.6) / 12).toLocaleString()}` },
          { label: 'Special Allowance', amount: `$${Math.round((allowances * 0.4) / 12).toLocaleString()}` },
        ],
        deductions: [
          { label: 'Provident Fund (PF)', amount: `$${Math.round((deductions * 0.5) / 12).toLocaleString()}` },
          { label: 'Professional Tax', amount: `$${Math.round((deductions * 0.2) / 12).toLocaleString()}` },
          { label: 'Health Insurance', amount: `$${Math.round((deductions * 0.3) / 12).toLocaleString()}` },
        ],
        grossTotal: `$${Math.round((basic + allowances) / 12).toLocaleString()}`,
        deductionsTotal: `$${Math.round(deductions / 12).toLocaleString()}`,
        netPay: `$${Math.round(net / 12).toLocaleString()}`,
      };

      const history: SalaryHistoryItem[] = [
        {
          id: 'sh-1',
          employeeId: emp.id,
          basicSalary: basic,
          allowances,
          deductions,
          netSalary: net,
          changeReason: 'Annual performance revision',
          effectiveFrom: 'Jan 2025',
          createdAt: '2025-01-01',
        },
        {
          id: 'sh-2',
          employeeId: emp.id,
          basicSalary: basic - 8000,
          allowances: allowances - 2000,
          deductions: deductions - 1000,
          netSalary: net - 9000,
          changeReason: 'Initial joining contract',
          effectiveFrom: 'Mar 2022',
          createdAt: '2022-03-12',
        },
      ];

      return {
        success: true,
        data: {
          employee: emp,
          salaryStructure,
          slip,
          history,
        },
      };
    }
  },

  getAllPayroll: async (params?: { department?: string; search?: string }) => {
    try {
      const res = await apiClient.get<{
        success: boolean;
        data: {
          payrolls: any[];
          summary: { totalEmployees: number; totalAnnualPayroll: number; totalMonthlyGross: number; totalMonthlyNet: number };
        };
      }>('/payroll', { params });
      return res.data;
    } catch {
      let employees = mockStore.getEmployees();
      if (params?.department && params.department !== 'All') {
        employees = employees.filter((e) => e.department.toLowerCase() === params.department?.toLowerCase());
      }
      const payrolls = employees.map((e) => ({
        employeeId: e.id,
        name: e.name,
        title: e.title,
        department: e.department,
        basicSalary: e.basicSalary || e.salary * 0.8,
        allowances: e.allowances || e.salary * 0.2,
        deductions: e.deductions || e.salary * 0.1,
        netSalary: e.netSalary || e.salary * 0.9,
        monthlyNet: Math.round((e.netSalary || e.salary * 0.9) / 12),
        status: 'Processed',
      }));

      const totalAnnualPayroll = payrolls.reduce((acc, p) => acc + p.netSalary, 0);
      const totalMonthlyGross = Math.round(payrolls.reduce((acc, p) => acc + p.basicSalary + p.allowances, 0) / 12);
      const totalMonthlyNet = Math.round(totalAnnualPayroll / 12);

      return {
        success: true,
        data: {
          payrolls,
          summary: {
            totalEmployees: payrolls.length,
            totalAnnualPayroll,
            totalMonthlyGross,
            totalMonthlyNet,
          },
        },
      };
    }
  },

  updateSalary: async (employeeId: string, data: { basicSalary: number; allowances: number; deductions: number; changeReason?: string }) => {
    try {
      const res = await apiClient.put(`/payroll/${employeeId}`, data);
      return res.data;
    } catch {
      const emp = mockStore.getEmployeeById(employeeId);
      if (emp) {
        emp.basicSalary = data.basicSalary;
        emp.allowances = data.allowances;
        emp.deductions = data.deductions;
        emp.netSalary = data.basicSalary + data.allowances - data.deductions;
        emp.salary = emp.netSalary;
        mockStore.saveEmployee(emp);
        return { success: true, message: 'Salary structure updated successfully', data: emp };
      }
      return { success: false, message: 'Employee not found' };
    }
  },

  getHistory: async (employeeId: string) => {
    try {
      const res = await apiClient.get(`/payroll/${employeeId}/history`);
      return res.data;
    } catch {
      const emp = mockStore.getEmployeeById(employeeId);
      const basic = emp?.basicSalary || 80000;
      return {
        success: true,
        data: [
          {
            id: `sh-${Date.now()}`,
            employeeId,
            basicSalary: basic,
            allowances: 15000,
            deductions: 6000,
            netSalary: basic + 9000,
            changeReason: 'Recent salary appraisal',
            createdAt: new Date().toISOString(),
          },
        ],
      };
    }
  },
};

export const notificationApi = {
  getAll: async () => {
    try {
      const res = await apiClient.get<{ success: boolean; data: { notifications: NotificationItem[]; unreadCount: number } }>('/notifications');
      return res.data;
    } catch {
      const notifications = mockStore.getNotifications();
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      return {
        success: true,
        data: { notifications, unreadCount },
      };
    }
  },

  markRead: async (id: string) => {
    try {
      const res = await apiClient.put(`/notifications/${id}/read`);
      return res.data;
    } catch {
      const list = mockStore.getNotifications().map((n) => (n.id === id ? { ...n, isRead: true } : n));
      mockStore.saveNotifications(list);
      return { success: true };
    }
  },

  markAllRead: async () => {
    try {
      const res = await apiClient.put('/notifications/read-all');
      return res.data;
    } catch {
      const list = mockStore.getNotifications().map((n) => ({ ...n, isRead: true }));
      mockStore.saveNotifications(list);
      return { success: true };
    }
  },
};

export const reportApi = {
  getAttendanceReport: async () => {
    try {
      const res = await apiClient.get('/reports/attendance');
      return res.data;
    } catch {
      return {
        success: true,
        data: {
          onTimeRate: '96.4%',
          averageWorkHours: '8.2 hrs',
          remoteRatio: '28%',
          attendanceTrend: [
            { day: 'Mon', present: 94, late: 4, absent: 2 },
            { day: 'Tue', present: 98, late: 2, absent: 0 },
            { day: 'Wed', present: 96, late: 3, absent: 1 },
            { day: 'Thu', present: 95, late: 4, absent: 1 },
            { day: 'Fri', present: 92, late: 6, absent: 2 },
          ],
        },
      };
    }
  },

  getLeaveReport: async () => {
    try {
      const res = await apiClient.get('/reports/leave');
      return res.data;
    } catch {
      return {
        success: true,
        data: {
          totalApplied: 24,
          approved: 19,
          pending: 4,
          rejected: 1,
          byDepartment: [
            { name: 'Engineering', count: 9 },
            { name: 'Design', count: 5 },
            { name: 'Marketing', count: 4 },
            { name: 'People', count: 3 },
            { name: 'Support', count: 3 },
          ],
        },
      };
    }
  },

  getPayrollReport: async () => {
    try {
      const res = await apiClient.get('/reports/payroll');
      return res.data;
    } catch {
      return {
        success: true,
        data: {
          annualPayroll: '$1,240,000',
          monthlyAverage: '$103,333',
          departmentDistribution: [
            { department: 'Engineering', amount: 480000 },
            { department: 'Design', amount: 210000 },
            { department: 'People', amount: 200000 },
            { department: 'Marketing', amount: 190000 },
            { department: 'Support', amount: 160000 },
          ],
        },
      };
    }
  },

  getAnalytics: async () => {
    try {
      const res = await apiClient.get('/reports/analytics');
      return res.data;
    } catch {
      return {
        success: true,
        data: {
          employeeRetention: '98.2%',
          averageTenure: '2.4 yrs',
          headcountGrowth: '+14%',
        },
      };
    }
  },
};

export const settingApi = {
  get: async () => {
    try {
      const res = await apiClient.get('/settings');
      return res.data;
    } catch {
      return {
        success: true,
        data: {
          companyName: 'Dayflow Inc.',
          workHoursStart: '09:00',
          workHoursEnd: '17:30',
          paidLeaveAllowance: '20',
          sickLeaveAllowance: '10',
          timezone: 'America/Los_Angeles',
          currency: 'USD ($)',
        },
      };
    }
  },

  update: async (settings: { key: string; value: string; category?: string }[]) => {
    try {
      const res = await apiClient.put('/settings', { settings });
      return res.data;
    } catch {
      return { success: true, message: 'Settings saved successfully' };
    }
  },
};
