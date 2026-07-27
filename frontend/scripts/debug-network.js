import { chromium } from 'playwright';

const urls = ['http://localhost:5173/', 'http://localhost:5173/login', 'http://localhost:5173/register', 'http://localhost:5173/display'];

(async () => {
  const browser = await chromium.launch({ headless: true, timeout: 120000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('request', request => {
    if (request.url().includes('/api/') || request.url().includes('/vite') || request.url().includes('socket.io')) {
      console.log('REQUEST', request.method(), request.url());
    }
  });

  page.on('response', response => {
    if (response.status() >= 400 || response.url().includes('/api/') || response.url().includes('/vite') || response.url().includes('socket.io')) {
      console.log('RESPONSE', response.status(), response.url());
    }
  });

  page.on('requestfailed', request => {
    console.log('FAILED', request.method(), request.url(), request.failure()?.errorText);
  });

  page.on('console', msg => {
    console.log('CONSOLE', msg.type(), msg.text());
  });

  for (const url of urls) {
    console.log('NAVIGATE', url);
    try {
      const response = await page.goto(url, { timeout: 120000, waitUntil: 'networkidle' });
      console.log('PAGE STATUS', response?.status(), response?.url());
      await page.waitForTimeout(2000);
    } catch (err) {
      console.error('ERROR NAVIGATING', url, err.message);
    }
  }

  await browser.close();
})();
