export type Role = 'employee' | 'admin';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type LeaveType = 'Paid leave' | 'Sick leave' | 'Unpaid leave';
export type AttendanceStatus = 'present' | 'late' | 'remote' | 'half_day' | 'absent' | 'leave';

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  profile?: EmployeeProfile;
  salary?: SalaryStructure;
}

export interface EmployeeProfile {
  id?: string;
  userId?: string;
  employeeId?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  profilePicture?: string;
  department?: string;
  designation?: string;
  joiningDate?: string;
  employmentType?: string;
  manager?: string;
  location?: string;
  initials?: string;
  color?: string;
  documents?: DocumentItem[];
}

export interface EmployeeItem {
  id: string;
  userId?: string;
  name: string;
  initials: string;
  email: string;
  role: Role;
  title: string;
  department: string;
  location: string;
  joined: string;
  phone: string;
  address: string;
  dateOfBirth?: string;
  profilePicture?: string;
  employmentType?: string;
  manager?: string;
  salary: number;
  basicSalary?: number;
  allowances?: number;
  deductions?: number;
  netSalary?: number;
  color: string;
  status?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  name?: string;
  email?: string;
  department?: string;
  title?: string;
  initials?: string;
  color?: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workingHours: number;
  status: AttendanceStatus | string;
  notes?: string;
}

export interface LeaveRecord {
  id: string;
  employeeId: string;
  name?: string;
  email?: string;
  title?: string;
  department?: string;
  initials?: string;
  color?: string;
  type: LeaveType | string;
  start: string;
  end: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  comment?: string;
  reviewedBy?: string;
  createdAt?: string;
}

export interface LeaveBalances {
  paidLeave: number;
  sickLeave: number;
  unpaidLeave: number;
  totalPaidAllowance: number;
  totalSickAllowance: number;
}

export interface SalaryStructure {
  id?: string;
  employeeId: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  effectiveFrom?: string;
}

export interface SalaryHistoryItem {
  id: string;
  employeeId: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  changeReason?: string;
  effectiveFrom?: string;
  createdAt: string;
}

export interface SalarySlipData {
  payPeriod: string;
  payDate: string;
  earnings: { label: string; amount: string }[];
  deductions: { label: string; amount: string }[];
  grossTotal: string;
  deductionsTotal: string;
  netPay: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  employeeId: string;
  name: string;
  fileUrl: string;
  documentType: string;
  fileSize?: string;
  createdAt: string;
}
