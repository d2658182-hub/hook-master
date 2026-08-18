const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 800 });
  page.on('console', (msg) => console.log('CONSOLE:', msg.type(), msg.text().slice(0, 300)));
  page.on('pageerror', (err) => console.log('PAGEERROR:', err.message.slice(0, 500)));
  , (req) => console.log('REQFAIL:', req.url(), req.failure() && req.failure().errorText));
  await page.goto('file:///sec/root/hook-master/tools/selftest-page.html', { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 8000));
  const title = await page.title();
  const t = await page.evaluate(() => window.__T && { fails: window.__T.fails.length, notes: window.__T.notes.length });
  console.log('TITLE:', title, 'T:', JSON.stringify(t));
  await browser.close();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
