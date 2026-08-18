/* ============================================================
   RUN-SELFTEST — launches chromium headless, loads the game
   with the selftest harness and prints the QA verdict.
   Usage : node tools/run-selftest.js
   ============================================================ */

const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 800 });
  const logs = [];
  page.on('console', (msg) => logs.push(msg.text()));
  page.on('pageerror', (err) => logs.push('PAGEERROR: ' + err.message));

  await page.goto('http://127.0.0.1:8765/tools/selftest-page.html', { waitUntil: 'load' });

  /* wait for the async selftest to finish (title flips to PASS/FAIL) */
  await page.waitForFunction(
    () => document.title.indexOf('SELFTEST-') === 0,
    { timeout: 60000 }
  );
  const result = await page.evaluate(() => window.__T);
  await browser.close();

  console.log('=== HOOK MASTER SELFTEST ===');
  (result.notes || []).forEach((note) => console.log(note));
  console.log('=== ERRORS ===');
  (result.errors || []).forEach((err) => console.log(err));
  logs.filter((l) => l.indexOf('SELFTEST') === 0).forEach((l) => console.log(l));
  const ok = (result.fails || []).length === 0 && (result.errors || []).length === 0;
  console.log(ok ? '=== SELFTEST-PASS ===' : '=== SELFTEST-FAIL ===');
  process.exit(ok ? 0 : 1);
})().catch((err) => {
  console.error('RUNNER ERROR:', err.message);
  process.exit(2);
});
