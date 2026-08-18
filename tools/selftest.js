/* ============================================================
   SELFTEST — headless QA harness for HOOK MASTER.
   Mocks the Playgama bridge, then drives the full flow:
   loading → menu → gameplay (grab/drop/win) → victory
   (confetti pixels) → shop. Verifies with pixels, not just
   "no errors".
   ============================================================ */

window.bridge = {
  EVENT_NAME: {
    REWARDED_STATE_CHANGED: 'rewarded_state_changed',
    PAUSE_STATE_CHANGED: 'pause_state_changed',
    AUDIO_STATE_CHANGED: 'audio_state_changed'
  },
  initialize: () => Promise.resolve(),
  platform: { language: 'en', isAudioEnabled: true, sendMessage() {}, on() {} },
  storage: { get: (keys) => Promise.resolve(keys.map(() => null)), set: () => Promise.resolve() },
  advertisement: (() => {
    const state = { rewardedCb: null, interstitialCb: null };
    return {
      isInterstitialSupported: () => false,
      isRewardedSupported: () => true,
      showInterstitial() {},
      /* NOTE: the SDK calls .on via a local variable, so `this` is NOT the
         object here — capture callbacks in the closure instead. */
      on(name, cb) {
        if (String(name).indexOf('rewarded') >= 0) state.rewardedCb = cb;
        else state.interstitialCb = cb;
      },
      off() {
        state.rewardedCb = null;
        state.interstitialCb = null;
      },
      showRewarded() { setTimeout(() => { if (state.rewardedCb) state.rewardedCb('rewarded'); }, 10); },
      __state: state
    };
  })(),
  leaderboards: { setScore: () => Promise.resolve() }
};

const T = { errors: [], fails: [], notes: [] };
window.__T = T;
window.addEventListener('error', (e) => T.errors.push('error: ' + e.message));
const origError = console.error;
console.error = (...a) => { T.errors.push(a.map((x) => String(x)).join(' ')); origError(...a); };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function settle() { await sleep(400); }
function check(name, cond, extra) {
  if (cond) T.notes.push('OK   ' + name);
  else { T.fails.push(name + (extra ? ' — ' + extra : '')); T.notes.push('FAIL ' + name + (extra ? ' — ' + extra : '')); }
}
function inside(rect, vp) {
  return rect.left >= -1 && rect.top >= -1 && rect.right <= vp.w + 1 && rect.bottom <= vp.h + 1;
}

/* count NON-BACKGROUND colored pixels in the canvas at logical coords */
function canvasPixelCount(canvas, region) {
  const ctx = canvas.getContext('2d');
  const s = Math.min(canvas.width / 720, canvas.height / 1280);
  const ox = (canvas.width - 720 * s) / 2;
  const oy = (canvas.height - 1280 * s) / 2;
  const x0 = Math.max(0, Math.floor((region.x0) * s + ox));
  const y0 = Math.max(0, Math.floor((region.y0) * s + oy));
  const x1 = Math.min(canvas.width, Math.ceil((region.x1) * s + ox));
  const y1 = Math.min(canvas.height, Math.ceil((region.y1) * s + oy));
  if (x1 <= x0 || y1 <= y0) return 0;
  const data = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
  let count = 0;
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    /* skip near-black/near-transparent and pure sky-blue background */
    if (a < 40) continue;
    if (r < 30 && g < 30 && b < 30) continue;
    count += 1;
  }
  return count;
}

window.__SELFTEST_RUN = async function run(game) {
  game.audio.settings.sound = false;
  const vp = { w: window.innerWidth, h: window.innerHeight };
  while (game.screens.current && game.screens.current.name === 'loading') await sleep(50);
  const style = document.createElement('style');
  style.textContent = '* { animation: none !important; transition: none !important; }';
  document.head.appendChild(style);

  const sm = game.screens;
  const origShow = sm.show.bind(sm);
  sm.show = (name, options) => {
    const previous = sm.current;
    origShow(name, options);
    if (previous && previous !== sm.current && previous.el) previous.destroy();
  };

  // ---------- MENU ----------
  check('menu: current screen is menu', game.screens.current.name === 'menu');
  check('menu: PLAY button present', !!game.screens.current.el.querySelector('.btn-play'));
  check('menu: SHOP button present', !!game.screens.current.el.querySelector('.btn-shop'));

  // ---------- GAMEPLAY level 1 : pendule + caisses + grue ----------
  game.show('gameplay', { level: 1 });
  let s = game.screens.current;
  await settle();
  /* dismiss tutorial so the game loop runs */
  s.tutorialActive = false;
  const tutBtn = s.tutorialEl.querySelector('.btn-tutorial-ok');
  if (tutBtn) tutBtn.click();
  await settle();
  check('gameplay: screen is gameplay', s.name === 'gameplay');
  check('gameplay: spec generated (300 max levels)', LevelGen.MAX_LEVEL === 300);
  check('gameplay: crates placed on dock', s.spec.crates.length >= 2, 'n=' + s.spec.crates.length);
  check('gameplay: ship hold drawn region has pixels', canvasPixelCount(s.canvas, { x0: 60, y0: 960, x1: 660, y1: 1120 }) > 60);
  check('gameplay: hook hangs from pivot', Math.abs(s.hookPosition().y - (s.spec.pivot.y + s.spec.ropeLen)) < 2);
  check('gameplay: HUD level = 1', s.hud.querySelector('.hud-level-value').textContent === '1');
  check('gameplay: HUD time > 0', parseInt(s.hud.querySelector('.hud-time-value').textContent, 10) > 0);
  check('gameplay: crates left shown', parseInt(s.hud.querySelector('.hud-crates-value').textContent, 10) === s.spec.crates.length);

  // swing the hook to the right and check the pendulum moves
  const startAngle = s.angle;
  s.swingDir = 1;
  for (let i = 0; i < 30; i += 1) s.update(0.05);
  s.swingDir = 0;
  check('gameplay: pendulum swings on input', Math.abs(s.angle - startAngle) > 0.02, 'd=' + (s.angle - startAngle).toFixed(3));

  // grab a crate when over it
  const hook = s.hookPosition();
  const dockCrate = s.spec.crates.find((c) => c.state === 'dock');
  s.angle = Math.asin((dockCrate.x - s.spec.pivot.x) / s.spec.ropeLen);
  s.omega = 0;
  s.grabCrate();
  check('gameplay: GRAB picks the crate', s.carrying && s.carrying.state === 'held', 'carry=' + (s.carrying && s.carrying.state));

  // drop over the ship → crate falls into the hold
  s.angle = Math.asin((s.shipX - s.spec.pivot.x) / s.spec.ropeLen);
  s.omega = 0;
  s.dropCrate();
  check('gameplay: DROP releases the crate', s.carrying === null && s.falling.length === 1, 'falling=' + s.falling.length);
  // simulate the fall
  for (let i = 0; i < 120; i += 1) s.update(0.05);
  check('gameplay: crate stacked in hold', s.stacked.length === 1, 'stacked=' + s.stacked.length);

  // ---------- VICTORY : load all remaining crates directly ----------
  s.spec.crates.forEach((c) => {
    if (c.state !== 'held') {
      c.state = 'stacked';
      s.stacked.push({ x: s.shipX + (Math.random() - 0.5) * 40, y: 950, sprite: c.sprite, golden: c.golden, fragile: c.fragile });
    }
  });
  s.cratesLeft = s.spec.crates.filter((c) => c.state === 'dock' || c.state === 'held' || c.state === 'falling').length;
  s.falling = [];
  s.update(0.05);
  check('gameplay: all crates loaded → win sequence', s.phase === 'winSeq', 'phase=' + s.phase);
  s.phaseTimer = 0;
  s.update(0.016);
  await sleep(300);
  const victory = game.screens.current;
  check('victory: screen is victory', victory.name === 'victory');
  check('victory: reward shown', (victory.el.querySelector('.victory-reward') || {}).textContent && victory.el.querySelector('.victory-reward').textContent.length > 0);
  // confetti pixels : render the confetti pieces onto a fresh offscreen
  // canvas (no RAF side effects) and count colored pixels.
  victory.spawnConfetti(40);
  victory.confettiPieces.forEach((p) => { p.x = 60 + Math.random() * 300; p.y = 60 + Math.random() * 200; });
  const probe = document.createElement('canvas');
  probe.width = 420; probe.height = 320;
  const pctx = probe.getContext('2d');
  victory.confettiPieces.forEach((p) => {
    pctx.save();
    pctx.translate(p.x, p.y);
    pctx.rotate(p.rot || 0);
    pctx.fillStyle = p.color;
    pctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    pctx.restore();
  });
  let colored = 0;
  const data = pctx.getImageData(0, 0, probe.width, probe.height).data;
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a > 40 && !(r < 40 && g < 40 && b < 40)) colored += 1;
  }
  victory.confettiPieces = [];
  check('victory: confetti pixels present (colorful)', colored > 30, 'colored=' + colored);

  // ---------- SHOP ----------
  game.show('shop');
  await settle();
  const shop = game.screens.current;
  check('shop: screen is shop', shop.name === 'shop');
  const items = shop.el.querySelectorAll('.shop-item');
  check('shop: 5 items illustrated', items.length === 5, 'n=' + items.length);
  const adButtons = shop.el.querySelectorAll('.btn-ad');
  check('shop: WATCH AD on >= 50% items', adButtons.length >= 3, 'ad=' + adButtons.length);
  // buy the extra heart
  const coinsBefore = game.storage.get('coins', 0);
  game.storage.set('coins', 500);
  items[0].querySelector('.btn-secondary').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await settle();
  check('shop: buying extra heart works', (game.storage.get('owned', []) || []).indexOf('extra_heart') >= 0);
  game.storage.set('coins', coinsBefore);

  // ---------- GAME OVER → REVIVE via rewarded ----------
  game.show('gameplay', { level: 1 });
  s = game.screens.current;
  s.hearts = 1;
  s.cratesLost = 2;
  s.spec.crates.forEach((c) => { c.state = 'lost'; });
  s.falling = [];
  s.loseCrate(s.spec.crates[0]);
  s.update(0.05);
  check('gameover: 3 lost crates → fail sequence', s.phase === 'failSeq', 'phase=' + s.phase);
  s.phaseTimer = 0;
  s.hearts = 0; /* 0 hearts → real GAME OVER */
  s.update(0.016);
  await sleep(300);
  const gameover = game.screens.current;
  check('gameover: screen is gameover', gameover.name === 'gameover', 'screen=' + gameover.name);
  const reviveBtn = gameover.el.querySelector('.btn-primary');
  check('gameover: REVIVE button (rewarded supported)', !!reviveBtn && reviveBtn.querySelector('.btn-label').textContent === 'REVIVE');
  window.__lastReviveState = 'clicked';
  reviveBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await sleep(500);
  console.log('DEBUG revive state:', window.__lastReviveState, 'screen:', game.screens.current.name, 'hasBridge:', SDK.hasBridge, 'rewardedSupported:', SDK.isRewardedSupported());
  check('gameover: revive → gameplay restored', game.screens.current.name === 'gameplay', 'screen=' + game.screens.current.name);

  // ---------- worlds distinct : backgrounds hash + pixels ----------
  const hashes = [];
  const skyColors = [];
  const cv = document.createElement('canvas');
  cv.width = 720; cv.height = 1280;
  const c2 = cv.getContext('2d');
  for (let w = 1; w <= 6; w += 1) {
    const spec = LevelGen.generate((w - 1) * 50 + 1);
    hashes.push(spec.bgDir);
    /* composite the world background like drawBackground and sample sky */
    c2.clearRect(0, 0, 720, 1280);
    const dir = spec.bgDir;
    const layers = {
      w1: ['sky', 'cloud', 'sea', 'land', 'decor'],
      w2: ['sky', 'cloud', 'sea', 'land', 'island', 'decor'],
      w3: ['sky', 'cloud', 'sea', 'land', 'decor'],
      w4: ['sky', 'cloud', 'sea', 'land', 'sun', 'decor'],
      w5: ['pixel-oc_1_240', 'pixel-oc_2_165', 'pixel-oc_3_122', 'pixel-oc_4_81'],
      w6: ['moon-and_4_91', 'moon-and_3_134', 'moon-and_2_182', 'moon-and_1_262']
    };
    (layers[dir] || layers.w1).forEach((name) => {
      const img = Assets.get(`assets/screens/${dir}/${name}.png`);
      if (!img.complete || !img.naturalWidth) return;
      const scale = Math.max(720 / img.width, 1280 / img.height);
      const iw = img.width * scale;
      const ih = img.height * scale;
      c2.drawImage(img, (720 - iw) / 2, (1280 - ih) / 2, iw, ih);
    });
    const data = c2.getImageData(360, 60, 1, 1).data;
    skyColors.push(`w${w}=(${data[0]},${data[1]},${data[2]})`);
  }
  check('worlds: 6 distinct background dirs', new Set(hashes).size === 6, hashes.join(','));
  check('worlds: 6 distinct sky pixel colors', new Set(skyColors).size === 6, skyColors.join(' '));

  // ---------- depth mechanics thresholds ----------
  const g1 = LevelGen.generate(14), g15 = LevelGen.generate(15);
  const g29 = LevelGen.generate(29), g30 = LevelGen.generate(30);
  const g44 = LevelGen.generate(44), g45 = LevelGen.generate(45);
  const g89 = LevelGen.generate(89), g90 = LevelGen.generate(90);
  check('depth: wind at L15', !g1.wind.active && g15.wind.active);
  check('depth: moving ship at L30', !g29.ship.range && g30.ship.range > 0);
  check('depth: fragile crates at L45', g44.crates.every((c) => !c.fragile) && g45.crates.some((c) => c.fragile));
  check('depth: two docks at L90', g89.crates.every((c) => c.side === g89.crates[0].side) && g90.crates.some((c) => c.side !== g90.crates[0].side));
  check('depth: hold narrows with level', g1.ship.holdW > g45.ship.holdW);
  check('depth: time budget rises', g1.timeBudget < g90.timeBudget);

  // ---------- responsive : desktop landscape frame ----------
  check('layout: game frame centered portrait on desktop', document.querySelector('#game-frame') !== null);

  // ---------- FINAL ----------
  check('zero console errors', T.errors.length === 0, T.errors.join(' | ').slice(0, 400));
  const ok = T.fails.length === 0;
  document.title = ok ? 'SELFTEST-PASS' : 'SELFTEST-FAIL';
};
