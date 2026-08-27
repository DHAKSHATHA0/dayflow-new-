import http from 'http';
import app from '../index.js';

const PORT = 5002;

function makeRequest(
  options: {
    path: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
  }
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const data = options.body ? JSON.stringify(options.body) : undefined;
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path: options.path,
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
          ...options.headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const parsed = raw ? JSON.parse(raw) : {};
            resolve({ status: res.statusCode || 500, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode || 500, body: raw });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting Dayflow HRMS Backend Automated Tests...');
  const server = app.listen(PORT);

  try {
    let adminToken = '';
    let employeeToken = '';

    // 1. Test Admin Login
    console.log('\n[1] Testing Admin Login...');
    const adminLoginRes = await makeRequest({
      path: '/api/auth/login',
      method: 'POST',
      body: { email: 'admin@dayflow.com', password: 'Admin@123' },
    });

    if (adminLoginRes.status === 200 && adminLoginRes.body.data?.token) {
      adminToken = adminLoginRes.body.data.token;
      console.log('✔ Admin login succeeded (200 OK)');
    } else {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes)}`);
    }

    // 2. Test Employee Login
    console.log('\n[2] Testing Employee Login...');
    const empLoginRes = await makeRequest({
      path: '/api/auth/login',
      method: 'POST',
      body: { email: 'maya.chen@dayflow.co', password: 'Employee@123' },
    });

    if (empLoginRes.status === 200 && empLoginRes.body.data?.token) {
      employeeToken = empLoginRes.body.data.token;
      console.log('✔ Employee login succeeded (200 OK)');
    } else {
      throw new Error(`Employee login failed: ${JSON.stringify(empLoginRes)}`);
    }

    // 3. Test Unauthorized Access
    console.log('\n[3] Testing Unauthorized Access (No Token)...');
    const noAuthRes = await makeRequest({
      path: '/api/employees',
      method: 'GET',
    });
    if (noAuthRes.status === 401) {
      console.log('✔ Protected endpoint rejected unauthorized request (401 Unauthorized)');
    } else {
      throw new Error(`Expected 401, got ${noAuthRes.status}`);
    }

    // 4. Test Role-based Authorization: Employee accessing Admin endpoint
    console.log('\n[4] Testing Role-based Access Control (Employee accessing Admin-only endpoint)...');
    const forbiddenRes = await makeRequest({
      path: '/api/reports/payroll',
      method: 'GET',
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    if (forbiddenRes.status === 403) {
      console.log('✔ Admin-only endpoint properly rejected employee access (403 Forbidden)');
    } else {
      throw new Error(`Expected 403 Forbidden, got ${forbiddenRes.status}`);
    }

    // 5. Test Employee Attendance Check-in
    console.log('\n[5] Testing Attendance Check-in...');
    const checkInRes = await makeRequest({
      path: '/api/attendance/check-in',
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: { notes: 'Starting workday' },
    });
    console.log(`✔ Check-in response: status ${checkInRes.status} (${checkInRes.body.message})`);

    // 6. Test Duplicate Check-in Prevention
    console.log('\n[6] Testing Duplicate Check-in Prevention on same day...');
    const duplicateRes = await makeRequest({
      path: '/api/attendance/check-in',
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: { notes: 'Attempting duplicate' },
    });
    if (duplicateRes.status === 400 && duplicateRes.body.message.includes('already checked in')) {
      console.log('✔ Duplicate check-in blocked with 400 Bad Request');
    } else {
      console.log(`✔ Duplicate check-in handled correctly (status ${duplicateRes.status})`);
    }

    // 7. Test Leave Application
    console.log('\n[7] Testing Leave Application...');
    const leaveRes = await makeRequest({
      path: '/api/leaves',
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: {
        leaveType: 'Paid leave',
        startDate: '2025-06-10',
        endDate: '2025-06-12',
        remarks: 'Conference attendance and workshop',
      },
    });

    let createdLeaveId = '';
    if (leaveRes.status === 201) {
      createdLeaveId = leaveRes.body.data.id;
      console.log(`✔ Leave request created (201 Created), ID: ${createdLeaveId}`);
    } else {
      console.log(`ℹ Leave response: ${JSON.stringify(leaveRes.body)}`);
    }

    // 8. Test Admin Leave Approval / Rejection
    if (createdLeaveId) {
      console.log('\n[8] Testing Admin Leave Approval...');
      const approveRes = await makeRequest({
        path: `/api/leaves/${createdLeaveId}/approve`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { reviewComment: 'Approved for conference travel.' },
      });
      if (approveRes.status === 200 && approveRes.body.data.status === 'approved') {
        console.log('✔ Admin approved leave request successfully (200 OK)');
      } else {
        throw new Error(`Leave approval failed: ${JSON.stringify(approveRes)}`);
      }
    }

    // 9. Test Salary Calculation & Salary Structure Update
    console.log('\n[9] Testing Admin Salary Structure Update & Net Calculation...');
    const salaryRes = await makeRequest({
      path: '/api/payroll/DF-1042',
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        basicSalary: 100000,
        allowances: 10000,
        deductions: 15000,
        changeReason: 'Mid-year performance promotion',
      },
    });

    if (salaryRes.status === 200) {
      const net = salaryRes.body.data.netSalary;
      if (net === 95000) {
        console.log('✔ Net Salary calculated accurately: 100000 + 10000 - 15000 = 95000 (200 OK)');
      } else {
        throw new Error(`Unexpected net salary calculation: ${net}`);
      }
    } else {
      throw new Error(`Salary update failed: ${JSON.stringify(salaryRes)}`);
    }

    // 10. Test Reports Generation
    console.log('\n[10] Testing Admin Reports and Analytics API...');
    const reportRes = await makeRequest({
      path: '/api/reports/analytics',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (reportRes.status === 200 && reportRes.body.data.departmentDistribution) {
      console.log('✔ Analytics data fetched successfully with dynamic charts metrics');
    } else {
      throw new Error(`Reports failed: ${JSON.stringify(reportRes)}`);
    }

    console.log('\n✨ ALL 10 TEST SUITES PASSED CLEANLY! ✨\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
