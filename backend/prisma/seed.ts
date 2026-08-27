import { PrismaClient, Role, AttendanceStatus, LeaveStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Dayflow HRMS database...');

  // Clean existing tables
  await prisma.document.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.salaryHistory.deleteMany();
  await prisma.salary.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.employeeProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  console.log('Cleared existing records.');

  // Create default admin user
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const employeePasswordHash = await bcrypt.hash('Employee@123', 10);

  const admin = await prisma.user.create({
    data: {
      employeeId: 'DF-1001',
      name: 'HR Admin (Avery Morgan)',
      email: 'admin@dayflow.com',
      passwordHash: adminPasswordHash,
      role: Role.admin,
      emailVerified: true,
      profile: {
        create: {
          employeeId: 'DF-1001',
          department: 'People',
          designation: 'People Operations Lead',
          employmentType: 'Full-time',
          joiningDate: 'Jun 04, 2020',
          location: 'New York',
          phone: '+1 212 555 0188',
          address: '18 W 21st Street, New York, NY',
          dateOfBirth: '1990-05-14',
          initials: 'AM',
          color: '#9eb9a8',
        },
      },
    },
  });

  await prisma.salary.create({
    data: {
      employeeId: 'DF-1001',
      basicSalary: 110000,
      allowances: 18000,
      deductions: 22000,
      netSalary: 106000,
    },
  });

  await prisma.salaryHistory.create({
    data: {
      employeeId: 'DF-1001',
      basicSalary: 110000,
      allowances: 18000,
      deductions: 22000,
      netSalary: 106000,
      changeReason: 'Annual lead revision',
    },
  });

  // Seed sample employees
  const sampleEmployees = [
    {
      id: 'DF-1042',
      name: 'Maya Chen',
      email: 'maya.chen@dayflow.co',
      role: Role.employee,
      title: 'Product Designer',
      department: 'Design',
      location: 'San Francisco',
      joined: 'Mar 12, 2022',
      phone: '+1 415 555 0142',
      address: '228 Valencia Street, San Francisco, CA',
      dateOfBirth: '1994-08-20',
      salary: 94000,
      allowances: 6000,
      deductions: 14000,
      initials: 'MC',
      color: '#e58f78',
    },
    {
      id: 'DF-1088',
      name: 'Jon Bell',
      email: 'jon.bell@dayflow.co',
      role: Role.employee,
      title: 'Frontend Engineer',
      department: 'Engineering',
      location: 'Austin',
      joined: 'Jan 18, 2023',
      phone: '+1 512 555 0190',
      address: '1412 E 5th Street, Austin, TX',
      dateOfBirth: '1992-11-03',
      salary: 112000,
      allowances: 8000,
      deductions: 18000,
      initials: 'JB',
      color: '#b7a0c9',
    },
    {
      id: 'DF-1091',
      name: 'Priya Nair',
      email: 'priya.nair@dayflow.co',
      role: Role.employee,
      title: 'Data Analyst',
      department: 'Insights',
      location: 'Chicago',
      joined: 'Aug 22, 2022',
      phone: '+1 312 555 0114',
      address: '620 N State Street, Chicago, IL',
      dateOfBirth: '1995-03-17',
      salary: 88000,
      allowances: 5000,
      deductions: 12000,
      initials: 'PN',
      color: '#d8b36a',
    },
    {
      id: 'DF-1104',
      name: 'Eli Romero',
      email: 'eli.romero@dayflow.co',
      role: Role.employee,
      title: 'Customer Advocate',
      department: 'Support',
      location: 'Miami',
      joined: 'Nov 07, 2023',
      phone: '+1 305 555 0171',
      address: '701 Brickell Avenue, Miami, FL',
      dateOfBirth: '1996-09-29',
      salary: 67000,
      allowances: 4000,
      deductions: 9000,
      initials: 'ER',
      color: '#84a7bb',
    },
    {
      id: 'DF-1024',
      name: 'Nina Okafor',
      email: 'nina.okafor@dayflow.co',
      role: Role.employee,
      title: 'Marketing Manager',
      department: 'Marketing',
      location: 'Brooklyn',
      joined: 'Feb 14, 2021',
      phone: '+1 718 555 0132',
      address: '77 Wyckoff Avenue, Brooklyn, NY',
      dateOfBirth: '1991-04-12',
      salary: 101000,
      allowances: 7000,
      deductions: 16000,
      initials: 'NO',
      color: '#c9949d',
    },
    {
      id: 'DF-1076',
      name: 'Theo Martin',
      email: 'theo.martin@dayflow.co',
      role: Role.employee,
      title: 'Backend Engineer',
      department: 'Engineering',
      location: 'Portland',
      joined: 'Sep 30, 2022',
      phone: '+1 503 555 0153',
      address: '428 NW 11th Avenue, Portland, OR',
      dateOfBirth: '1993-01-25',
      salary: 115000,
      allowances: 9000,
      deductions: 19000,
      initials: 'TM',
      color: '#a7b78a',
    },
    {
      id: 'DF-1115',
      name: 'Leila Haddad',
      email: 'leila.haddad@dayflow.co',
      role: Role.employee,
      title: 'Content Strategist',
      department: 'Marketing',
      location: 'Boston',
      joined: 'May 09, 2023',
      phone: '+1 617 555 0162',
      address: '35 Newbury Street, Boston, MA',
      dateOfBirth: '1997-07-08',
      salary: 79000,
      allowances: 4500,
      deductions: 11000,
      initials: 'LH',
      color: '#d1a77c',
    },
  ];

  const createdUsers = [];

  for (const emp of sampleEmployees) {
    const user = await prisma.user.create({
      data: {
        employeeId: emp.id,
        name: emp.name,
        email: emp.email,
        passwordHash: employeePasswordHash,
        role: emp.role,
        emailVerified: true,
        profile: {
          create: {
            employeeId: emp.id,
            department: emp.department,
            designation: emp.title,
            employmentType: 'Full-time',
            joiningDate: emp.joined,
            location: emp.location,
            phone: emp.phone,
            address: emp.address,
            dateOfBirth: emp.dateOfBirth,
            initials: emp.initials,
            color: emp.color,
          },
        },
      },
      include: { profile: true },
    });

    createdUsers.push(user);

    // Create salary structure
    const net = emp.salary + emp.allowances - emp.deductions;
    await prisma.salary.create({
      data: {
        employeeId: emp.id,
        basicSalary: emp.salary,
        allowances: emp.allowances,
        deductions: emp.deductions,
        netSalary: net,
      },
    });

    await prisma.salaryHistory.create({
      data: {
        employeeId: emp.id,
        basicSalary: emp.salary,
        allowances: emp.allowances,
        deductions: emp.deductions,
        netSalary: net,
        changeReason: 'Initial contract package',
      },
    });

    // Sample documents
    await prisma.document.create({
      data: {
        employeeId: emp.id,
        name: `${emp.name.replace(' ', '_')}_Employment_Agreement.pdf`,
        fileUrl: '/uploads/sample-contract.pdf',
        documentType: 'contract',
        fileSize: '1.4 MB',
      },
    });

    await prisma.document.create({
      data: {
        employeeId: emp.id,
        name: `Government_ID_${emp.id}.pdf`,
        fileUrl: '/uploads/sample-id.pdf',
        documentType: 'id_proof',
        fileSize: '840 KB',
      },
    });
  }

  // Seed Attendance for Today and past 5 days
  const today = new Date().toISOString().slice(0, 10);
  const pastDates: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    pastDates.push(d.toISOString().slice(0, 10));
  }

  // Today attendance
  const allEmps = ['DF-1001', ...sampleEmployees.map((e) => e.id)];
  for (let i = 0; i < allEmps.length; i++) {
    const empId = allEmps[i];
    let status: AttendanceStatus = AttendanceStatus.present;
    let checkInTime = `09:0${i + 2}`;
    let checkOutTime = '';

    if (i === 3) {
      status = AttendanceStatus.remote;
      checkInTime = '08:50';
    } else if (i === 4) {
      status = AttendanceStatus.late;
      checkInTime = '09:45';
    } else if (i === 0) {
      checkInTime = '09:08';
      checkOutTime = '';
    }

    await prisma.attendance.create({
      data: {
        employeeId: empId,
        date: today,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        workingHours: 0,
        status,
      },
    });
  }

  // Past attendance
  for (const date of pastDates) {
    for (let i = 0; i < allEmps.length; i++) {
      const empId = allEmps[i];
      await prisma.attendance.create({
        data: {
          employeeId: empId,
          date,
          checkIn: '09:05',
          checkOut: '17:35',
          workingHours: 8.5,
          status: AttendanceStatus.present,
        },
      });
    }
  }

  // Seed Leave Requests
  const leaves = [
    {
      employeeId: 'DF-1042',
      leaveType: 'Paid leave',
      startDate: '2025-05-10',
      endDate: '2025-05-12',
      days: 3,
      remarks: 'Family vacation and personal downtime.',
      status: LeaveStatus.approved,
      reviewedBy: 'HR Admin',
      reviewComment: 'Approved. Enjoy your time with family!',
    },
    {
      employeeId: 'DF-1088',
      leaveType: 'Sick leave',
      startDate: '2025-04-12',
      endDate: '2025-04-12',
      days: 1,
      remarks: 'Medical appointment & recovery.',
      status: LeaveStatus.approved,
      reviewedBy: 'HR Admin',
      reviewComment: 'Approved. Take care.',
    },
    {
      employeeId: 'DF-1091',
      leaveType: 'Paid leave',
      startDate: '2025-05-20',
      endDate: '2025-05-24',
      days: 5,
      remarks: 'Spring break travel plans.',
      status: LeaveStatus.pending,
    },
    {
      employeeId: 'DF-1115',
      leaveType: 'Unpaid leave',
      startDate: '2025-05-15',
      endDate: '2025-05-17',
      days: 3,
      remarks: 'Personal urgent matters.',
      status: LeaveStatus.pending,
    },
    {
      employeeId: 'DF-1104',
      leaveType: 'Sick leave',
      startDate: '2025-04-02',
      endDate: '2025-04-03',
      days: 2,
      remarks: 'Seasonal flu symptoms.',
      status: LeaveStatus.rejected,
      reviewedBy: 'HR Admin',
      reviewComment: 'Please submit doctor prescription note before re-applying.',
    },
  ];

  for (const l of leaves) {
    await prisma.leaveRequest.create({
      data: {
        employeeId: l.employeeId,
        leaveType: l.leaveType,
        startDate: l.startDate,
        endDate: l.endDate,
        days: l.days,
        remarks: l.remarks,
        status: l.status,
        reviewedBy: l.reviewedBy || null,
        reviewComment: l.reviewComment || null,
      },
    });
  }

  // Seed Notifications
  await prisma.notification.create({
    data: {
      userId: admin.id,
      title: 'Pending Leave Requests',
      message: 'There are 2 pending leave requests waiting for your review.',
      type: 'leave',
      link: '/admin/leave-approvals',
    },
  });

  const maya = createdUsers.find((u) => u.employeeId === 'DF-1042');
  if (maya) {
    await prisma.notification.create({
      data: {
        userId: maya.id,
        title: 'Leave Request Approved',
        message: 'Your Paid leave request for May 10 - May 12 was approved by People Operations.',
        type: 'leave',
        link: '/employee/leave',
      },
    });
  }

  // Seed Settings
  const defaultSettings = [
    { key: 'organizationName', value: 'Dayflow Technologies', category: 'general' },
    { key: 'officialEmail', value: 'admin@dayflow.com', category: 'general' },
    { key: 'workHoursStart', value: '09:00', category: 'attendance' },
    { key: 'workHoursEnd', value: '17:30', category: 'attendance' },
    { key: 'paidLeaveAllowance', value: '20', category: 'leave' },
    { key: 'sickLeaveAllowance', value: '10', category: 'leave' },
    { key: 'emailNotifications', value: 'true', category: 'notifications' },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.create({ data: s });
  }

  console.log('Dayflow HRMS seed completed successfully!');
  console.log('==============================================');
  console.log('Default Admin Account:');
  console.log('  Email:    admin@dayflow.com');
  console.log('  Password: Admin@123');
  console.log('Sample Employee Account:');
  console.log('  Email:    maya.chen@dayflow.co (or ID: DF-1042)');
  console.log('  Password: Employee@123');
  console.log('==============================================');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
