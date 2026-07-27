/import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true, timeout: 120000 });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('request', request => console.log('REQUEST', request.method(), request.url()));
  page.on('response', response => console.log('RESPONSE', response.status(), response.url()));
  page.on('requestfailed', request => console.log('FAILED', request.method(), request.url(), request.failure()?.errorText));
  page.on('console', msg => console.log('CONSOLE', msg.type(), msg.text()));
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 120000 });
  const names = await page.$$eval('input', els => els.map(e => ({ name: e.name, placeholder: e.placeholder, type: e.type, value: e.value })));
  console.log('INPUTS', JSON.stringify(names, null, 2));
  await page.fill('input[name=email]', 'admin@kcrh.go.ke');
  await page.fill('input[name=password]', 'Admin@2024');
  await page.click('button[type=submit]', { force: true });
  await page.waitForTimeout(10000);
  console.log('FINAL URL', page.url());
  await browser.close();
})();
