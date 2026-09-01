import type {
  EmployeeItem,
  AttendanceRecord,
  LeaveRecord,
  LeaveBalances,
  SalaryStructure,
  SalaryHistoryItem,
  SalarySlipData,
  NotificationItem,
  Role,
  User,
} from '../types';

const STORAGE_KEYS = {
  EMPLOYEES: 'dayflow_mock_employees',
  ATTENDANCE: 'dayflow_mock_attendance',
  LEAVES: 'dayflow_mock_leaves',
  NOTIFICATIONS: 'dayflow_mock_notifications',
  SETTINGS: 'dayflow_mock_settings',
  SALARIES: 'dayflow_mock_salaries',
};

const getStored = <T>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const saveStored = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save ${key} to localStorage:`, err);
  }
};

const initialEmployees: EmployeeItem[] = [
  {
    id: 'DF-1042',
    name: 'Maya Chen',
    initials: 'MC',
    email: 'maya.chen@dayflow.co',
    role: 'employee',
    title: 'Product Designer',
    department: 'Design',
    location: 'San Francisco',
    joined: 'Mar 12, 2022',
    phone: '+1 415 555 0142',
    address: '228 Valencia Street, San Francisco, CA',
    salary: 94000,
    basicSalary: 75000,
    allowances: 19000,
    deductions: 8000,
    netSalary: 86000,
    color: '#e58f78',
    status: 'active',
  },
  {
    id: 'DF-1001',
    name: 'Avery Morgan',
    initials: 'AM',
    email: 'admin@dayflow.com',
    role: 'admin',
    title: 'People Operations Lead',
    department: 'People',
    location: 'New York',
    joined: 'Jun 04, 2020',
    phone: '+1 212 555 0188',
    address: '18 W 21st Street, New York, NY',
    salary: 128000,
    basicSalary: 100000,
    allowances: 28000,
    deductions: 12000,
    netSalary: 116000,
    color: '#9eb9a8',
    status: 'active',
  },
  {
    id: 'DF-1088',
    name: 'Jon Bell',
    initials: 'JB',
    email: 'jon.bell@dayflow.co',
    role: 'employee',
    title: 'Frontend Engineer',
    department: 'Engineering',
    location: 'Austin',
    joined: 'Jan 18, 2023',
    phone: '+1 512 555 0190',
    address: '1412 E 5th Street, Austin, TX',
    salary: 112000,
    basicSalary: 90000,
    allowances: 22000,
    deductions: 10000,
    netSalary: 102000,
    color: '#b7a0c9',
    status: 'active',
  },
  {
    id: 'DF-1091',
    name: 'Priya Nair',
    initials: 'PN',
    email: 'priya.nair@dayflow.co',
    role: 'employee',
    title: 'Data Analyst',
    department: 'Insights',
    location: 'Chicago',
    joined: 'Aug 22, 2022',
    phone: '+1 312 555 0114',
    address: '620 N State Street, Chicago, IL',
    salary: 88000,
    basicSalary: 70000,
    allowances: 18000,
    deductions: 8000,
    netSalary: 80000,
    color: '#d8b36a',
    status: 'active',
  },
  {
    id: 'DF-1104',
    name: 'Eli Romero',
    initials: 'ER',
    email: 'eli.romero@dayflow.co',
    role: 'employee',
    title: 'Customer Advocate',
    department: 'Support',
    location: 'Miami',
    joined: 'Nov 07, 2023',
    phone: '+1 305 555 0171',
    address: '701 Brickell Avenue, Miami, FL',
    salary: 67000,
    basicSalary: 54000,
    allowances: 13000,
    deductions: 6000,
    netSalary: 61000,
    color: '#84a7bb',
    status: 'active',
  },
];

const todayStr = new Date().toISOString().slice(0, 10);

const initialAttendance: AttendanceRecord[] = [
  {
    id: 'att-1042-today',
    employeeId: 'DF-1042',
    name: 'Maya Chen',
    email: 'maya.chen@dayflow.co',
    department: 'Design',
    title: 'Product Designer',
    initials: 'MC',
    color: '#e58f78',
    date: todayStr,
    checkIn: '09:08 AM',
    checkOut: '',
    workingHours: 4.5,
    status: 'present',
    notes: 'Designing UI workflows',
  },
  {
    id: 'att-1001-today',
    employeeId: 'DF-1001',
    name: 'Avery Morgan',
    email: 'admin@dayflow.com',
    department: 'People',
    title: 'People Operations Lead',
    initials: 'AM',
    color: '#9eb9a8',
    date: todayStr,
    checkIn: '08:45 AM',
    checkOut: '',
    workingHours: 5.2,
    status: 'present',
  },
  {
    id: 'att-1088-today',
    employeeId: 'DF-1088',
    name: 'Jon Bell',
    email: 'jon.bell@dayflow.co',
    department: 'Engineering',
    title: 'Frontend Engineer',
    initials: 'JB',
    color: '#b7a0c9',
    date: todayStr,
    checkIn: '09:15 AM',
    checkOut: '',
    workingHours: 4.2,
    status: 'remote',
  },
];

const initialLeaves: LeaveRecord[] = [
  {
    id: 'l-1',
    employeeId: 'DF-1042',
    name: 'Maya Chen',
    email: 'maya.chen@dayflow.co',
    title: 'Product Designer',
    department: 'Design',
    initials: 'MC',
    color: '#e58f78',
    type: 'Paid leave',
    start: '2025-04-21',
    end: '2025-04-23',
    days: 3,
    reason: 'Family retreat and personal recharge.',
    status: 'approved',
    reviewedBy: 'Avery Morgan',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'l-2',
    employeeId: 'DF-1088',
    name: 'Jon Bell',
    email: 'jon.bell@dayflow.co',
    title: 'Frontend Engineer',
    department: 'Engineering',
    initials: 'JB',
    color: '#b7a0c9',
    type: 'Sick leave',
    start: '2025-04-08',
    end: '2025-04-08',
    days: 1,
    reason: 'Seasonal flu.',
    status: 'approved',
    reviewedBy: 'Avery Morgan',
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 'l-3',
    employeeId: 'DF-1091',
    name: 'Priya Nair',
    email: 'priya.nair@dayflow.co',
    title: 'Data Analyst',
    department: 'Insights',
    initials: 'PN',
    color: '#d8b36a',
    type: 'Paid leave',
    start: '2025-05-10',
    end: '2025-05-14',
    days: 5,
    reason: 'Annual family holiday travel.',
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const initialNotifications: NotificationItem[] = [
  {
    id: 'n-1',
    userId: 'DF-1042',
    title: 'Leave Approved',
    message: 'Your Paid leave application for 3 days has been approved.',
    type: 'leave',
    isRead: false,
    link: '/employee/leave',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'n-2',
    userId: 'DF-1042',
    title: 'Pay Slip Available',
    message: 'Your salary slip for the current payroll cycle has been processed.',
    type: 'payroll',
    isRead: true,
    link: '/employee/payroll',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'n-3',
    userId: 'DF-1001',
    title: 'New Leave Request',
    message: 'Priya Nair submitted a Paid leave request (5 days).',
    type: 'leave',
    isRead: false,
    link: '/admin/leave-approvals',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

export const mockStore = {
  getEmployees: (): EmployeeItem[] => {
    return getStored<EmployeeItem[]>(STORAGE_KEYS.EMPLOYEES, initialEmployees);
  },

  getEmployeeById: (id: string): EmployeeItem | null => {
    const list = mockStore.getEmployees();
    const query = id.toLowerCase();
    return (
      list.find(
        (e) =>
          e.id.toLowerCase() === query ||
          e.email.toLowerCase() === query ||
          e.name.toLowerCase() === query
      ) || null
    );
  },

  saveEmployee: (emp: EmployeeItem): EmployeeItem => {
    const list = mockStore.getEmployees();
    const idx = list.findIndex((e) => e.id === emp.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...emp };
    } else {
      list.push(emp);
    }
    saveStored(STORAGE_KEYS.EMPLOYEES, list);
    return emp;
  },

  deleteEmployee: (id: string): void => {
    const list = mockStore.getEmployees().filter((e) => e.id !== id);
    saveStored(STORAGE_KEYS.EMPLOYEES, list);
  },

  getAttendance: (): AttendanceRecord[] => {
    return getStored<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, initialAttendance);
  },

  saveAttendance: (rec: AttendanceRecord): AttendanceRecord => {
    const list = mockStore.getAttendance();
    const idx = list.findIndex((a) => a.id === rec.id || (a.employeeId === rec.employeeId && a.date === rec.date));
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...rec };
    } else {
      list.unshift(rec);
    }
    saveStored(STORAGE_KEYS.ATTENDANCE, list);
    return rec;
  },

  getLeaves: (): LeaveRecord[] => {
    return getStored<LeaveRecord[]>(STORAGE_KEYS.LEAVES, initialLeaves);
  },

  saveLeave: (leave: LeaveRecord): LeaveRecord => {
    const list = mockStore.getLeaves();
    const idx = list.findIndex((l) => l.id === leave.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...leave };
    } else {
      list.unshift(leave);
    }
    saveStored(STORAGE_KEYS.LEAVES, list);
    return leave;
  },

  getNotifications: (): NotificationItem[] => {
    return getStored<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  },

  saveNotifications: (items: NotificationItem[]): void => {
    saveStored(STORAGE_KEYS.NOTIFICATIONS, items);
  },

  // Auth mock methods
  login: (identifier: string, role?: Role): { token: string; user: User } => {
    const trimmed = identifier.trim();
    let emp = mockStore.getEmployeeById(trimmed);

    if (!emp) {
      const isRoleAdmin = role === 'admin' || trimmed.toLowerCase().includes('admin');
      const newId = isRoleAdmin ? 'DF-1001' : `DF-${Math.floor(1000 + Math.random() * 9000)}`;
      const newName = trimmed.includes('@') ? trimmed.split('@')[0].replace('.', ' ') : 'Workspace User';
      const initials = newName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      emp = {
        id: newId,
        name: isRoleAdmin ? 'Avery Morgan' : newName || 'Maya Chen',
        initials: initials || (isRoleAdmin ? 'AM' : 'DF'),
        email: trimmed.includes('@') ? trimmed : `${trimmed.toLowerCase()}@dayflow.co`,
        role: isRoleAdmin ? 'admin' : (role || 'employee'),
        title: isRoleAdmin ? 'People Operations Lead' : 'Team Member',
        department: isRoleAdmin ? 'People' : 'Engineering',
        location: 'San Francisco',
        joined: 'Jan 2024',
        phone: '+1 555 0199',
        address: '100 Market St, San Francisco, CA',
        salary: isRoleAdmin ? 128000 : 94000,
        basicSalary: isRoleAdmin ? 100000 : 75000,
        allowances: isRoleAdmin ? 28000 : 19000,
        deductions: isRoleAdmin ? 12000 : 8000,
        netSalary: isRoleAdmin ? 116000 : 86000,
        color: isRoleAdmin ? '#9eb9a8' : '#e58f78',
        status: 'active',
      };
      mockStore.saveEmployee(emp);
    }

    const user: User = {
      id: emp.id,
      employeeId: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      emailVerified: true,
      profile: {
        id: emp.id,
        employeeId: emp.id,
        phone: emp.phone,
        address: emp.address,
        department: emp.department,
        designation: emp.title,
        joiningDate: emp.joined,
        location: emp.location,
        initials: emp.initials,
        color: emp.color,
      },
      salary: {
        employeeId: emp.id,
        basicSalary: emp.basicSalary || emp.salary * 0.8,
        allowances: emp.allowances || emp.salary * 0.2,
        deductions: emp.deductions || emp.salary * 0.1,
        netSalary: emp.netSalary || emp.salary * 0.9,
      },
    };

    const token = `dayflow_token_mock_${user.id}_${Date.now()}`;
    return { token, user };
  },

  signup: (name: string, email: string, role: Role = 'employee'): { token: string; user: User } => {
    const id = `DF-${Math.floor(1000 + Math.random() * 9000)}`;
    const initials = name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const emp: EmployeeItem = {
      id,
      name,
      initials: initials || 'DF',
      email: email.toLowerCase(),
      role,
      title: role === 'admin' ? 'HR Manager' : 'Software Engineer',
      department: role === 'admin' ? 'People' : 'Engineering',
      location: 'Remote',
      joined: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      phone: '+1 555 0100',
      address: 'Dayflow HQ, San Francisco, CA',
      salary: role === 'admin' ? 120000 : 90000,
      basicSalary: role === 'admin' ? 95000 : 72000,
      allowances: role === 'admin' ? 25000 : 18000,
      deductions: role === 'admin' ? 12000 : 8000,
      netSalary: role === 'admin' ? 108000 : 82000,
      color: '#d8bf79',
      status: 'active',
    };

    mockStore.saveEmployee(emp);

    const user: User = {
      id: emp.id,
      employeeId: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      emailVerified: true,
      profile: {
        id: emp.id,
        employeeId: emp.id,
        phone: emp.phone,
        address: emp.address,
        department: emp.department,
        designation: emp.title,
        joiningDate: emp.joined,
        location: emp.location,
        initials: emp.initials,
        color: emp.color,
      },
    };

    const token = `dayflow_token_mock_${user.id}_${Date.now()}`;
    return { token, user };
  },
};
