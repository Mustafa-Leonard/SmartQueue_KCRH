import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:5173';

const users = {
  admin: { email: 'admin@kcrh.go.ke', password: 'Admin@2024' },
  staff: { email: 'staff@kcrh.go.ke', password: 'Staff@2024' },
  customer: { email: 'patient@gmail.com', password: 'Patient@2024' }
};

const adminRoutes = [
  '/admin/dashboard',
  '/admin/branches',
  '/admin/counters',
  '/admin/services',
  '/admin/users',
  '/admin/analytics',
  '/admin/appointments'
];

const staffRoutes = ['/staff', '/staff/counter'];
const customerRoutes = ['/customer/dashboard', '/customer/join', '/customer/appointments', '/customer/profile'];
const publicRoutes = ['/login', '/register', '/display', '/track'];

async function login(page, user) {
  await page.goto(`${APP_URL}/login`);
  await expect(page.getByRole('heading', { name: /patient & staff portal/i })).toBeVisible();
  await page.getByLabel('Email Address').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: /secure log in/i }).click();
  await page.waitForLoadState('networkidle');
}

function attachPageErrorWatcher(page) {
  page.on('pageerror', (error) => {
    throw new Error(`Frontend runtime error: ${error.message}`);
  });
}

test.describe('Frontend smoke test - page loads', () => {
  test('public routes load', async ({ page }) => {
    attachPageErrorWatcher(page);
    for (const route of publicRoutes) {
      await page.goto(`${APP_URL}${route}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
      await expect(page).not.toHaveURL(/500|404/);
    }
  });

  test('admin routes load after login', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    attachPageErrorWatcher(page);
    await login(page, users.admin);
    for (const route of adminRoutes) {
      await page.goto(`${APP_URL}${route}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    }
    await context.close();
  });

  test('staff routes load after login', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    attachPageErrorWatcher(page);
    await login(page, users.staff);
    for (const route of staffRoutes) {
      await page.goto(`${APP_URL}${route}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    }
    await context.close();
  });

  test('customer routes load after login', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    attachPageErrorWatcher(page);
    await login(page, users.customer);
    for (const route of customerRoutes) {
      await page.goto(`${APP_URL}${route}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    }
    await context.close();
  });
});
