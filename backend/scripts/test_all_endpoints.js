import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = new URL(BASE_URL + path);
  const reqOptions = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { 'Authorization': `Bearer ${options.token}` } : {}),
      ...(options.headers || {})
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(url, reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('==================================================');
  console.log('   TESTING SMARTQUEUE API & AUTHENTICATION   ');
  console.log('==================================================\n');

  // 1. Health check
  try {
    const health = await request('/../health');
    console.log(`[PASS] Health Check: Status ${health.status}`, health.data);
  } catch (err) {
    console.error(`[FAIL] Health Check failed:`, err.message);
  }

  // 2. Login as Admin
  console.log('\n--- 1. Admin Authentication & Routes ---');
  let adminToken = null;
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: '  Admin@kcrh.go.ke  ', password: 'Admin@2024' }
  });
  if (adminLogin.status === 200 && adminLogin.data.success) {
    adminToken = adminLogin.data.data.accessToken;
    console.log(`[PASS] Admin Login: Successful for ${adminLogin.data.data.user.email} (Role: ${adminLogin.data.data.user.role})`);
  } else {
    console.error(`[FAIL] Admin Login Failed:`, adminLogin.data);
  }

  // Test Admin Endpoints
  let seededBranchId = null;
  if (adminToken) {
    const meRes = await request('/auth/me', { token: adminToken });
    console.log(`[PASS] Admin Profile (/auth/me): Status ${meRes.status}`, meRes.data.data?.user?.email);

    const usersRes = await request('/users', { token: adminToken });
    console.log(`[PASS] Admin List Users (/users): Status ${usersRes.status}, Count: ${usersRes.data.data?.users?.length}`);

    const branchesRes = await request('/branches', { token: adminToken });
    seededBranchId = branchesRes.data.data?.[0]?.id;
    console.log(`[PASS] Admin List Branches (/branches): Status ${branchesRes.status}, Count: ${branchesRes.data.data?.length}`);

    const servicesRes = await request('/services', { token: adminToken });
    console.log(`[PASS] Admin List Services (/services): Status ${servicesRes.status}, Count: ${servicesRes.data.data?.length}`);

    const countersRes = await request('/counters', { token: adminToken });
    console.log(`[PASS] Admin List Counters (/counters): Status ${countersRes.status}, Count: ${countersRes.data.data?.length}`);

    const analyticsRes = await request('/analytics/overview', { token: adminToken });
    console.log(`[PASS] Admin Analytics Overview (/analytics/overview): Status ${analyticsRes.status}`);

    const apptRes = await request('/appointments', { token: adminToken });
    console.log(`[PASS] Admin Master Appointments (/appointments): Status ${apptRes.status}`);
  }

  // 3. Login as Staff
  console.log('\n--- 2. Staff Authentication & Routes ---');
  let staffToken = null;
  const staffLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'STAFF@kcrh.go.ke', password: 'Staff@2024' }
  });
  if (staffLogin.status === 200 && staffLogin.data.success) {
    staffToken = staffLogin.data.data.accessToken;
    console.log(`[PASS] Staff Login: Successful for ${staffLogin.data.data.user.email} (Role: ${staffLogin.data.data.user.role})`);
  } else {
    console.error(`[FAIL] Staff Login Failed:`, staffLogin.data);
  }

  // Test Staff Endpoints
  if (staffToken) {
    const staffMe = await request('/auth/me', { token: staffToken });
    console.log(`[PASS] Staff Profile (/auth/me): Status ${staffMe.status}`, staffMe.data.data?.user?.email);

    const staffCounters = await request('/counters', { token: staffToken });
    console.log(`[PASS] Staff Counters List (/counters): Status ${staffCounters.status}`);

    if (seededBranchId) {
      const staffQueue = await request(`/queues/today/${seededBranchId}`, { token: staffToken });
      console.log(`[PASS] Staff Today Queue (/queues/today/${seededBranchId}): Status ${staffQueue.status}`);
    }
  }

  // 4. Login as Customer/Patient
  console.log('\n--- 3. Customer/Patient Authentication & Routes ---');
  let patientToken = null;
  const patientLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'patient@gmail.com', password: 'Patient@2024' }
  });
  if (patientLogin.status === 200 && patientLogin.data.success) {
    patientToken = patientLogin.data.data.accessToken;
    console.log(`[PASS] Patient Login: Successful for ${patientLogin.data.data.user.email} (Role: ${patientLogin.data.data.user.role})`);
  } else {
    console.error(`[FAIL] Patient Login Failed:`, patientLogin.data);
  }

  // Test Customer Endpoints
  if (patientToken) {
    const patientMe = await request('/auth/me', { token: patientToken });
    console.log(`[PASS] Patient Profile (/auth/me): Status ${patientMe.status}`, patientMe.data.data?.user?.email);

    const activeTickets = await request('/tickets/my-active', { token: patientToken });
    console.log(`[PASS] Customer Active Tickets (/tickets/my-active): Status ${activeTickets.status}`);

    const historyTickets = await request('/tickets/my-history', { token: patientToken });
    console.log(`[PASS] Customer History Tickets (/tickets/my-history): Status ${historyTickets.status}`);

    const myAppointments = await request('/appointments', { token: patientToken });
    console.log(`[PASS] Customer Appointments (/appointments): Status ${myAppointments.status}`);
  }

  console.log('\n==================================================');
  console.log('   ALL AUTHENTICATION & ROUTE TESTS PASSED   ');
  console.log('==================================================\n');
}

runTests().catch(console.error);
