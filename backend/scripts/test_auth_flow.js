import app from '../src/app.js';
import http from 'http';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/database.js';

const server = http.createServer(app);
let visibilityTestBranchId = null;
let visibilityTestServiceId = null;
let visibilityTestTicketId = null;
let permissionTestCounterId = null;
let permissionTestTaskId = null;
let permissionTestAppointmentId = null;
let permissionTestFeedbackId = null;
let permissionTestNotificationId = null;
let permissionTestSettingKey = null;
let permissionTestAdminId = null;
const permissionTestUserIds = [];
const permissionTestAdminEmail = `admin-crud-${Date.now()}@example.test`;
const permissionTestAdminPassword = 'AdminTest987!';
const permissionTestAdminPhone = `+2547${Math.floor(10000000 + Math.random() * 90000000)}`;

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Test server running on ${baseUrl}`);

  try {
    const permissionTestAdmin = await prisma.user.create({
      data: {
        name: 'Temporary CRUD Test Admin',
        email: permissionTestAdminEmail,
        phone: permissionTestAdminPhone,
        password: await bcrypt.hash(permissionTestAdminPassword, 12),
        role: 'ADMIN',
        isActive: true
      }
    });
    permissionTestAdminId = permissionTestAdmin.id;

    // 1. Test ADMIN login
    console.log('Testing ADMIN login...');
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const failedAdminLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: permissionTestAdminEmail, password: 'WrongPassword987!' })
      });
      if (failedAdminLogin.status !== 401) {
        throw new Error(`Incorrect admin password attempt should return 401, got ${failedAdminLogin.status}`);
      }
    }

    const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: permissionTestAdminEmail, password: permissionTestAdminPassword })
    });
    const adminData = await adminRes.json();
    console.log('Admin login status:', adminRes.status, 'Success:', adminData.success, 'Role:', adminData.data?.user?.role);
    if (!adminData.success) throw new Error('Admin login failed');

    let storedAdminLogin = null;
    let storedAdminCredentialLabel = null;
    for (const candidate of [
      { password: 'admin2026', label: 'admin password utility' },
      { password: 'Admin@2024', label: 'development seed' }
    ]) {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@kcrh.go.ke', password: candidate.password })
      });
      if (response.ok) {
        storedAdminLogin = await response.json();
        storedAdminCredentialLabel = candidate.label;
        break;
      }
    }
    if (!storedAdminLogin) throw new Error('The persisted admin account did not accept either configured development credential');
    console.log(`Persisted admin login verified using ${storedAdminCredentialLabel}`);
    const storedAdminLogout = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedAdminLogin.data.accessToken}`
      },
      body: JSON.stringify({ refreshToken: storedAdminLogin.data.refreshToken })
    });
    if (!storedAdminLogout.ok) throw new Error('Could not revoke the persisted admin verification session');

    const adminHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminData.data.accessToken}`
    };
    const visibilityTestBranchName = `Admin visibility test ${Date.now()}`;
    const createBranchRes = await fetch(`${baseUrl}/api/branches`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ name: visibilityTestBranchName, isActive: false })
    });
    const createdBranchData = await createBranchRes.json();
    if (!createdBranchData.success) throw new Error(`Admin branch creation failed: ${JSON.stringify(createdBranchData)}`);
    visibilityTestBranchId = createdBranchData.data.branch.id;

    const updateBranchRes = await fetch(`${baseUrl}/api/branches/${visibilityTestBranchId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ description: 'Updated by admin CRUD regression test' })
    });
    if (!updateBranchRes.ok) throw new Error(`Admin could not update branch: ${updateBranchRes.status}`);

    const adminBranchesRes = await fetch(`${baseUrl}/api/branches`, { headers: adminHeaders });
    const adminBranchesData = await adminBranchesRes.json();
    if (!adminBranchesData.data.branches.some(branch => branch.id === visibilityTestBranchId)) {
      throw new Error('Admin branch list did not include an inactive branch');
    }
    const publicBranchesRes = await fetch(`${baseUrl}/api/branches`);
    const publicBranchesData = await publicBranchesRes.json();
    if (publicBranchesData.data.branches.some(branch => branch.id === visibilityTestBranchId)) {
      throw new Error('Public branch list exposed an inactive branch');
    }
    const activateBranchRes = await fetch(`${baseUrl}/api/branches/${visibilityTestBranchId}`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ isActive: true })
    });
    if (!activateBranchRes.ok) throw new Error(`Admin could not activate branch: ${activateBranchRes.status}`);

    const createServiceRes = await fetch(`${baseUrl}/api/services`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: `Inactive test service ${Date.now()}`,
        branchId: visibilityTestBranchId,
        estimatedTime: 5,
        isActive: false
      })
    });
    const createdServiceData = await createServiceRes.json();
    if (!createdServiceData.success) throw new Error(`Admin service creation failed: ${JSON.stringify(createdServiceData)}`);
    visibilityTestServiceId = createdServiceData.data.service.id;

    const updateServiceRes = await fetch(`${baseUrl}/api/services/${visibilityTestServiceId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ description: 'Updated by admin CRUD regression test', estimatedTime: 7 })
    });
    if (!updateServiceRes.ok) throw new Error(`Admin could not update service: ${updateServiceRes.status}`);

    const adminBranchServicesRes = await fetch(`${baseUrl}/api/services/branch/${visibilityTestBranchId}`, { headers: adminHeaders });
    const adminBranchServicesData = await adminBranchServicesRes.json();
    if (!adminBranchServicesData.data.services.some(service => service.id === visibilityTestServiceId)) {
      throw new Error('Admin service list did not include an inactive service');
    }
    const publicBranchServicesRes = await fetch(`${baseUrl}/api/services/branch/${visibilityTestBranchId}`);
    const publicBranchServicesData = await publicBranchServicesRes.json();
    if (publicBranchServicesData.data.services.some(service => service.id === visibilityTestServiceId)) {
      throw new Error('Public service list exposed an inactive service');
    }

    await prisma.service.update({ where: { id: visibilityTestServiceId }, data: { isActive: true } });

    const createCounterRes = await fetch(`${baseUrl}/api/counters`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ name: 'CRUD Test Counter', number: 1, branchId: visibilityTestBranchId, serviceIds: [visibilityTestServiceId] })
    });
    const createCounterData = await createCounterRes.json();
    if (!createCounterData.success) throw new Error(`Admin could not create counter: ${JSON.stringify(createCounterData)}`);
    permissionTestCounterId = createCounterData.data.counter.id;
    const updateCounterRes = await fetch(`${baseUrl}/api/counters/${permissionTestCounterId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ name: 'CRUD Test Counter Updated', number: 2 })
    });
    if (!updateCounterRes.ok) throw new Error(`Admin could not update counter: ${updateCounterRes.status}`);
    const counterStatusRes = await fetch(`${baseUrl}/api/counters/${permissionTestCounterId}/status`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'OPEN' })
    });
    if (!counterStatusRes.ok) throw new Error(`Admin could not update counter status: ${counterStatusRes.status}`);
    const deleteCounterRes = await fetch(`${baseUrl}/api/counters/${permissionTestCounterId}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    if (!deleteCounterRes.ok) throw new Error(`Admin could not delete counter: ${deleteCounterRes.status}`);
    permissionTestCounterId = null;

    const createTaskRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ title: 'CRUD Test Task', priority: 'LOW', branchId: visibilityTestBranchId })
    });
    const createTaskData = await createTaskRes.json();
    if (!createTaskData.success) throw new Error(`Admin could not create task: ${JSON.stringify(createTaskData)}`);
    permissionTestTaskId = createTaskData.data.task.id;
    const updateTaskRes = await fetch(`${baseUrl}/api/tasks/${permissionTestTaskId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ title: 'CRUD Test Task Updated' })
    });
    if (!updateTaskRes.ok) throw new Error(`Admin could not update task: ${updateTaskRes.status}`);
    const deleteTaskRes = await fetch(`${baseUrl}/api/tasks/${permissionTestTaskId}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    if (!deleteTaskRes.ok) throw new Error(`Admin could not delete task: ${deleteTaskRes.status}`);
    permissionTestTaskId = null;

    permissionTestSettingKey = `CRUD_TEST_${Date.now()}`;
    for (const value of ['created', 'updated']) {
      const settingRes = await fetch(`${baseUrl}/api/settings`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ key: permissionTestSettingKey, value, description: 'Temporary CRUD test setting' })
      });
      if (!settingRes.ok) throw new Error(`Admin could not upsert setting: ${settingRes.status}`);
    }
    const deleteSettingRes = await fetch(`${baseUrl}/api/settings/${permissionTestSettingKey}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    if (!deleteSettingRes.ok) throw new Error(`Admin could not delete setting: ${deleteSettingRes.status}`);
    permissionTestSettingKey = null;

    const testTicketRes = await fetch(`${baseUrl}/api/tickets/join`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ serviceId: visibilityTestServiceId, branchId: visibilityTestBranchId })
    });
    const testTicketData = await testTicketRes.json();
    if (!testTicketData.success) throw new Error(`Could not create queue visibility test ticket: ${JSON.stringify(testTicketData)}`);
    visibilityTestTicketId = testTicketData.data.ticket.id;
    await prisma.ticket.update({ where: { id: visibilityTestTicketId }, data: { status: 'COMPLETED' } });
    const queueReadRes = await fetch(`${baseUrl}/api/tickets/branch/${visibilityTestBranchId}`, { headers: adminHeaders });
    const queueReadData = await queueReadRes.json();
    if (!queueReadData.data?.tickets?.some(ticket => ticket.id === visibilityTestTicketId && ticket.status === 'COMPLETED')) {
      throw new Error('Admin branch ticket list omitted a completed ticket stored in the database');
    }

    const deactivateServiceRes = await fetch(`${baseUrl}/api/services/${visibilityTestServiceId}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    if (!deactivateServiceRes.ok) throw new Error(`Admin could not deactivate service: ${deactivateServiceRes.status}`);
    const reactivateServiceRes = await fetch(`${baseUrl}/api/services/${visibilityTestServiceId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ isActive: true })
    });
    if (!reactivateServiceRes.ok) throw new Error(`Admin could not reactivate service: ${reactivateServiceRes.status}`);
    const deactivateBranchRes = await fetch(`${baseUrl}/api/branches/${visibilityTestBranchId}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    if (!deactivateBranchRes.ok) throw new Error(`Admin could not deactivate branch: ${deactivateBranchRes.status}`);
    const reactivateBranchRes = await fetch(`${baseUrl}/api/branches/${visibilityTestBranchId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ isActive: true })
    });
    if (!reactivateBranchRes.ok) throw new Error(`Admin could not reactivate branch: ${reactivateBranchRes.status}`);

    permissionTestAppointmentId = (await prisma.appointment.create({
      data: {
        customerId: permissionTestAdminId,
        serviceId: visibilityTestServiceId,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        timeSlot: '10:00',
        status: 'PENDING'
      }
    })).id;
    const appointmentStatusRes = await fetch(`${baseUrl}/api/appointments/${permissionTestAppointmentId}/status`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'CONFIRMED' })
    });
    if (!appointmentStatusRes.ok) throw new Error(`Admin could not update appointment status: ${appointmentStatusRes.status}`);

    permissionTestFeedbackId = (await prisma.feedback.create({
      data: { rating: 5, comment: 'Temporary admin CRUD test', category: 'GENERAL', customerId: permissionTestAdminId }
    })).id;
    const feedbackReadRes = await fetch(`${baseUrl}/api/feedback/${permissionTestFeedbackId}/read`, {
      method: 'PATCH',
      headers: adminHeaders
    });
    if (!feedbackReadRes.ok) throw new Error(`Admin could not mark feedback read: ${feedbackReadRes.status}`);

    permissionTestNotificationId = (await prisma.notification.create({
      data: {
        type: 'SMS',
        recipient: permissionTestAdminEmail,
        message: 'Temporary notification CRUD test',
        status: 'SENT',
        userId: permissionTestAdminId
      }
    })).id;
    const notificationReadRes = await fetch(`${baseUrl}/api/notifications/${permissionTestNotificationId}/read`, {
      method: 'PATCH',
      headers: adminHeaders
    });
    if (!notificationReadRes.ok) throw new Error(`Admin could not mark notification read: ${notificationReadRes.status}`);

    const adminPageReadRoutes = [
      '/api/users',
      '/api/counters',
      '/api/services',
      '/api/tasks',
      '/api/appointments',
      '/api/notifications',
      '/api/settings',
      '/api/feedback',
      '/api/feedback/stats',
      '/api/audit/activity',
      '/api/audit/logs',
      '/api/analytics/overview'
    ];
    for (const route of adminPageReadRoutes) {
      const response = await fetch(`${baseUrl}${route}`, { headers: adminHeaders });
      if (!response.ok) throw new Error(`Admin page read denied at ${route}: ${response.status}`);
    }
    const adminNotificationsPageRes = await fetch(`${baseUrl}/api/notifications?page=1&limit=5`, { headers: adminHeaders });
    const adminNotificationsPage = await adminNotificationsPageRes.json();
    if (!adminNotificationsPage.data?.pagination || adminNotificationsPage.data.pagination.limit !== 5) {
      throw new Error('Admin notification pagination metadata is missing or incorrect');
    }

    const adminPageMutationChecks = [
      ['/api/users', 'POST'],
      ['/api/branches', 'POST'],
      ['/api/services', 'POST'],
      ['/api/counters', 'POST'],
      ['/api/tasks', 'POST'],
      ['/api/settings', 'POST']
    ];
    for (const [route, method] of adminPageMutationChecks) {
      const response = await fetch(`${baseUrl}${route}`, {
        method,
        headers: adminHeaders,
        body: JSON.stringify({})
      });
      if (response.status === 403) throw new Error(`Admin mutation denied at ${route}`);
    }

    const adminUpdateDeleteChecks = [
      ['/api/users/__missing_admin_crud__', 'PUT', {}],
      ['/api/users/__missing_admin_crud__', 'DELETE'],
      ['/api/branches/__missing_admin_crud__', 'PUT', {}],
      ['/api/branches/__missing_admin_crud__', 'DELETE'],
      ['/api/services/__missing_admin_crud__', 'PUT', {}],
      ['/api/services/__missing_admin_crud__', 'DELETE'],
      ['/api/counters/__missing_admin_crud__', 'PUT', {}],
      ['/api/counters/__missing_admin_crud__', 'DELETE'],
      ['/api/tasks/__missing_admin_crud__', 'PUT', {}],
      ['/api/tasks/__missing_admin_crud__', 'DELETE'],
      ['/api/settings/__missing_admin_crud__', 'DELETE'],
      ['/api/appointments/__missing_admin_crud__/status', 'PUT', { status: 'CONFIRMED' }],
      ['/api/feedback/__missing_admin_crud__/read', 'PATCH'],
      ['/api/notifications/__missing_admin_crud__/read', 'PATCH'],
      ['/api/queues/__missing_admin_crud__/close', 'PUT']
    ];
    for (const [route, method, body] of adminUpdateDeleteChecks) {
      const response = await fetch(`${baseUrl}${route}`, {
        method,
        headers: adminHeaders,
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      if (response.status === 403) throw new Error(`Admin update/delete denied at ${route}`);
      if (response.status >= 500) throw new Error(`Unexpected server error for missing record at ${route}: ${response.status}`);
    }

    for (const role of ['STAFF', 'CUSTOMER']) {
      const userEmail = `${role.toLowerCase()}-suspension-${Date.now()}@example.test`;
      const userPhone = `+2547${Math.floor(10000000 + Math.random() * 90000000)}`;
      const createUserRes = await fetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          name: `Temporary ${role} Suspension Test`,
          email: userEmail,
          phone: userPhone,
          password: 'SuspendTest987!',
          role
        })
      });
      const createUserData = await createUserRes.json();
      if (!createUserData.success) throw new Error(`Admin could not create ${role} user: ${JSON.stringify(createUserData)}`);
      const userId = createUserData.data.user.id;
      permissionTestUserIds.push(userId);

      const updateUserRes = await fetch(`${baseUrl}/api/users/${userId}`, {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({ name: `Updated Temporary ${role}` })
      });
      if (!updateUserRes.ok) throw new Error(`Admin could not update ${role} user: ${updateUserRes.status}`);

      const suspendRes = await fetch(`${baseUrl}/api/users/${userId}/toggle-active`, {
        method: 'PATCH',
        headers: adminHeaders
      });
      if (!suspendRes.ok) throw new Error(`Admin could not suspend ${role} user: ${suspendRes.status}`);

      const suspendedLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, password: 'SuspendTest987!' })
      });
      if (suspendedLoginRes.status !== 403) throw new Error(`Suspended ${role} user login should return 403, got ${suspendedLoginRes.status}`);

      const reactivateRes = await fetch(`${baseUrl}/api/users/${userId}/toggle-active`, {
        method: 'PATCH',
        headers: adminHeaders
      });
      if (!reactivateRes.ok) throw new Error(`Admin could not reactivate ${role} user: ${reactivateRes.status}`);

      const activeLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, password: 'SuspendTest987!' })
      });
      if (!activeLoginRes.ok) throw new Error(`Reactivated ${role} user could not log in: ${activeLoginRes.status}`);

      const deleteUserRes = await fetch(`${baseUrl}/api/users/${userId}`, {
        method: 'DELETE',
        headers: adminHeaders
      });
      if (!deleteUserRes.ok) throw new Error(`Admin could not soft-delete ${role} user: ${deleteUserRes.status}`);
    }

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
    const patientHistoryPageRes = await fetch(`${baseUrl}/api/tickets/my-history?page=1&limit=1`, {
      headers: { Authorization: `Bearer ${customerData.data.accessToken}` }
    });
    const patientHistoryPage = await patientHistoryPageRes.json();
    if (!patientHistoryPage.data?.pagination || patientHistoryPage.data.pagination.limit !== 1) {
      throw new Error('Patient ticket history pagination metadata is missing or incorrect');
    }

    const invalidLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'missing@example.com', password: 'Password123!' })
    });
    if (invalidLoginRes.status !== 401) throw new Error(`Invalid login should return 401, got ${invalidLoginRes.status}`);

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
    const weakPasswordRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Registration User',
        email: `weak_${regEmail}`,
        phone: `+2547${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: 'short1',
        confirmPassword: 'short1'
      })
    });
    if (weakPasswordRes.status !== 400) throw new Error(`Weak registration password should return 400, got ${weakPasswordRes.status}`);

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

    const wrongCurrentPasswordRes = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${regData.data.accessToken}`
      },
      body: JSON.stringify({ currentPassword: 'WrongPassword123!', password: 'Password234!' })
    });
    if (wrongCurrentPasswordRes.status !== 401) {
      throw new Error(`Incorrect current password should return 401, got ${wrongCurrentPasswordRes.status}`);
    }

    const changePasswordRes = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${regData.data.accessToken}`
      },
      body: JSON.stringify({ currentPassword: 'Password123!', password: 'Password234!' })
    });
    if (!changePasswordRes.ok) throw new Error(`Password change failed with status ${changePasswordRes.status}`);

    const duplicateRes = await fetch(`${baseUrl}/api/auth/register`, {
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
    if (duplicateRes.status !== 409) throw new Error(`Duplicate registration should return 409, got ${duplicateRes.status}`);

    const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `unknown_${regEmail}` })
    });
    const forgotData = await forgotRes.json();
    if (!forgotData.success || !forgotData.message.includes('If that email is registered')) {
      throw new Error('Forgot-password response should not reveal whether the email exists');
    }

    const invalidResetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: regEmail,
        token: 'invalid-reset-token',
        newPassword: 'Password456!',
        confirmPassword: 'Password456!'
      })
    });
    if (invalidResetRes.status !== 400) throw new Error(`Invalid reset token should return 400, got ${invalidResetRes.status}`);

    const validResetToken = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({
      data: {
        userId: regData.data.user.id,
        token: crypto.createHash('sha256').update(validResetToken).digest('hex'),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      }
    });
    const validResetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: regEmail,
        token: validResetToken,
        newPassword: 'Password456!',
        confirmPassword: 'Password456!'
      })
    });
    const validResetData = await validResetRes.json();
    if (!validResetData.success) throw new Error(`Valid password reset failed: ${JSON.stringify(validResetData)}`);

    const reusedResetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: regEmail,
        token: validResetToken,
        newPassword: 'Password789!',
        confirmPassword: 'Password789!'
      })
    });
    if (reusedResetRes.status !== 400) throw new Error(`A used reset token should return 400, got ${reusedResetRes.status}`);

    const rotatedSessionRes = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: regData.data.refreshToken })
    });
    if (rotatedSessionRes.status !== 401) throw new Error(`Password reset should revoke existing sessions, got ${rotatedSessionRes.status}`);

    const resetLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: regEmail, password: 'Password456!' })
    });
    const resetLoginData = await resetLoginRes.json();
    if (!resetLoginData.success) throw new Error('Login with the reset password failed');

    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resetLoginData.data.accessToken}`
      },
      body: JSON.stringify({ refreshToken: resetLoginData.data.refreshToken })
    });
    if (!logoutRes.ok) throw new Error(`Logout failed with status ${logoutRes.status}`);

    const revokedRefreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: resetLoginData.data.refreshToken })
    });
    if (revokedRefreshRes.status !== 401) throw new Error(`Revoked refresh token should return 401, got ${revokedRefreshRes.status}`);

    const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: customerData.data.refreshToken })
    });
    const refreshData = await refreshRes.json();
    if (!refreshData.success || !refreshData.data?.accessToken || !refreshData.data?.refreshToken) {
      throw new Error('Refresh token rotation failed');
    }

    const oldRefreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: customerData.data.refreshToken })
    });
    if (oldRefreshRes.status !== 401) throw new Error(`Rotated refresh token should be revoked, got ${oldRefreshRes.status}`);

    const secondRefreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshData.data.refreshToken })
    });
    const secondRefreshData = await secondRefreshRes.json();
    if (!secondRefreshData.success || !secondRefreshData.data?.refreshToken) {
      throw new Error('A second refresh using the rotated token failed');
    }

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
    if (permissionTestNotificationId) {
      await prisma.notification.deleteMany({ where: { id: permissionTestNotificationId } });
    }
    if (permissionTestFeedbackId) {
      await prisma.feedback.deleteMany({ where: { id: permissionTestFeedbackId } });
    }
    if (permissionTestAppointmentId) {
      await prisma.appointment.deleteMany({ where: { id: permissionTestAppointmentId } });
    }
    if (visibilityTestTicketId) {
      await prisma.ticket.deleteMany({ where: { id: visibilityTestTicketId } });
    }
    if (visibilityTestServiceId) {
      await prisma.service.deleteMany({ where: { id: visibilityTestServiceId } });
    }
    if (visibilityTestBranchId) {
      await prisma.branch.deleteMany({ where: { id: visibilityTestBranchId } });
    }
    if (permissionTestAdminId) {
      await prisma.notification.deleteMany({ where: { userId: permissionTestAdminId } });
      await prisma.activityLog.deleteMany({ where: { userId: permissionTestAdminId } });
      await prisma.auditLog.deleteMany({ where: { userId: permissionTestAdminId } });
      await prisma.apiLog.deleteMany({ where: { userId: permissionTestAdminId } });
      await prisma.user.deleteMany({ where: { id: permissionTestAdminId } });
    }
    for (const userId of permissionTestUserIds) {
      await prisma.activityLog.deleteMany({ where: { userId } });
      await prisma.auditLog.deleteMany({ where: { userId } });
      await prisma.apiLog.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    server.close();
    await prisma.$disconnect();
    process.exit(process.exitCode || 0);
  }
});
