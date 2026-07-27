import app from '../src/app.js';
import http from 'http';

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Test server running on ${baseUrl}`);

  try {
    // 1. Test ADMIN login
    console.log('Testing ADMIN login...');
    const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@kcrh.go.ke', password: 'Admin@2024' })
    });
    const adminData = await adminRes.json();
    console.log('Admin login status:', adminRes.status, 'Success:', adminData.success, 'Role:', adminData.data?.user?.role);
    if (!adminData.success) throw new Error('Admin login failed');

    // 2. Test STAFF login
    console.log('Testing STAFF login...');
    const staffRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@kcrh.go.ke', password: 'Staff@2024' })
    });
    const staffData = await staffRes.json();
    console.log('Staff login status:', staffRes.status, 'Success:', staffData.success, 'Role:', staffData.data?.user?.role);
    if (!staffData.success) throw new Error('Staff login failed');

    // 3. Test CUSTOMER login
    console.log('Testing CUSTOMER login...');
    const customerRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient@gmail.com', password: 'Patient@2024' })
    });
    const customerData = await customerRes.json();
    console.log('Customer login status:', customerRes.status, 'Success:', customerData.success, 'Role:', customerData.data?.user?.role);
    if (!customerData.success) throw new Error('Customer login failed');

    const customerToken = customerData.data.accessToken;

    // 4. Test GET /api/auth/me
    console.log('Testing GET /api/auth/me...');
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const meData = await meRes.json();
    console.log('GetMe status:', meRes.status, 'User email:', meData.data?.user?.email);
    if (!meData.success) throw new Error('GetMe failed');

    // 5. Test PATCH /api/auth/profile
    console.log('Testing PATCH /api/auth/profile...');
    const patchRes = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({ name: 'John Kamau Updated' })
    });
    const patchData = await patchRes.json();
    console.log('Patch Profile status:', patchRes.status, 'Updated name:', patchData.data?.user?.name);
    if (!patchData.success) throw new Error('Patch profile failed');

    // 6. Test Registration
    console.log('Testing POST /api/auth/register...');
    const regEmail = `testuser_${Date.now()}@example.com`;
    const regPhone = `+2547${Math.floor(10000000 + Math.random() * 90000000)}`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Registration User',
        email: regEmail,
        phone: regPhone,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    const regData = await regRes.json();
    console.log('Register status:', regRes.status, 'Success:', regData.success, 'User email:', regData.data?.user?.email);
    if (!regData.success) throw new Error('Register failed: ' + JSON.stringify(regData));

    // 7. Test Public Counter Display API
    console.log('Testing GET /api/branches...');
    const branchRes = await fetch(`${baseUrl}/api/branches`);
    const branchData = await branchRes.json();
    console.log('Branches status:', branchRes.status, 'Success:', branchData.success, 'Count:', branchData.data?.branches?.length);
    if (!branchData.success) throw new Error('Get branches failed');

    const firstBranchId = branchData.data?.branches?.[0]?.id;
    if (firstBranchId) {
      console.log('Testing GET /api/counters/branch/' + firstBranchId + '...');
      const displayRes = await fetch(`${baseUrl}/api/counters/branch/${firstBranchId}`);
      const displayData = await displayRes.json();
      console.log('Public display status:', displayRes.status, 'Success:', displayData.success, 'Count:', displayData.data?.counters?.length);
    }

    console.log('\n--- ALL AUTH AND API TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('TEST ERROR:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    process.exit(process.exitCode || 0);
  }
});
