/* ============================================================
   SCREENSHOT — captures menu / gameplay / victory frames for
   visual QA (placement, no floating, no overlap, confetti).
   Usage : node tools/screenshot.js [outdir]
   ============================================================ */

const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const outdir = process.argv[2] || '/tmp/hm-shots';
  const fs = require('fs');
  fs.mkdirSync(outdir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 800 });
  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message.slice(0, 200)));

  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'load' });

  /* wait for the menu */
  await page.waitForFunction(() => window.__game && window.__game.screens.current && window.__game.screens.current.name === 'menu', { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outdir, '01-menu.png') });

  /* gameplay level 1 */
  await page.evaluate(() => window.__game.show('gameplay', { level: 1 }));
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outdir, '02-gameplay-l1.png') });

  /* gameplay level 15 (wind) */
  await page.evaluate(() => window.__game.show('gameplay', { level: 15 }));
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outdir, '03-gameplay-l15-wind.png') });

  /* gameplay level 90 (two docks) */
  await page.evaluate(() => window.__game.show('gameplay', { level: 90 }));
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outdir, '04-gameplay-l90.png') });

  /* gameplay level 220 (world 5, deep blue sea) */
  await page.evaluate(() => window.__game.show('gameplay', { level: 220 }));
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outdir, '05-gameplay-l220-deep.png') });

  /* gameplay level 251 (world 6, night) */
  await page.evaluate(() => window.__game.show('gameplay', { level: 251 }));
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outdir, '05-gameplay-l251-night.png') });

  /* victory : force a win */
  await page.evaluate(() => {
    const g = window.__game;
    g.show('gameplay', { level: 1 });
    const s = g.screens.current;
    s.spec.crates.forEach((c) => {
      if (c.state !== 'held') {
        c.state = 'stacked';
        s.stacked.push({ x: s.shipX + (Math.random() - 0.5) * 40, y: 950, sprite: c.sprite, golden: c.golden, fragile: c.fragile });
      }
    });
    s.cratesLeft = 0;
    s.falling = [];
    s.update(0.05);
    s.phaseTimer = 0;
    s.update(0.016);
  });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outdir, '06-victory-confetti.png') });

  /* shop */
  await page.evaluate(() => window.__game.show('shop'));
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outdir, '07-shop.png') });

  await browser.close();
  console.log('screenshots written to', outdir);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
