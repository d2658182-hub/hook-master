/* ============================================================
   GAMEPLAY SCREEN — Hook Master.
   Pendulum crane: hold LEFT/RIGHT to swing the hook, GRAB to
   pick a crate, DROP to release it into the rocking ship's
   hold. Wind, moving ship, fragile crates, narrow holds,
   storms and golden crates unlock along the level curve.
   ============================================================ */

class GameplayScreen extends BaseScreen {
  constructor(game) {
    super(game, 'gameplay');
    this.canvas = null;
    this.ctx = null;
    this.frameId = null;
    this.resize = this.resize.bind(this);
    this.lastTime = 0;
    this.level = 1;
    this.hearts = game.config.hud.hearts;
    this.particles = [];
    this.popups = [];
    this.shake = 0;
    this.phase = 'playing';      // playing | winSeq | failSeq
    this.phaseTimer = 0;
    this.winHandled = false;
    this.failHandled = false;
    this.paused = false;
    this.platformPaused = false;
    this.snapshot = null;
    this.stats = { coins: 0, stars: 1 };
    this.offPause = null;
    this.perfects = 0;
    this.combo = 0;
    this.timeLeft = 60;
    this.timeTotal = 60;
    this.cratesLeft = 0;
    this.cratesLost = 0;
    this.windGust = 0;
    this.angle = 0;
    this.omega = 0;
    this.carrying = null;
    this.falling = [];
    this.stacked = [];
    this.fragileBroken = false;
    this.time = 0;
    this.cloudOffset = 0;
    this.tutorialActive = false;
    this.banner = null;
    this.bannerTimer = 0;
    this.bannerEl = null;
    this.windHintEl = null;
    this.spec = null;
    this.world = null;
    this.shipX = 360;
    this.shipPhase = 0;
  }

  build() {
    const config = this.game.config;

    this.el = document.createElement('div');
    this.el.className = 'screen gameplay-screen';
    this.el.style.backgroundImage = `url("${config.backgrounds.menu}")`;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'game-canvas';
    this.ctx = this.canvas.getContext('2d');

    this.hud = document.createElement('div');
    this.hud.className = 'gameplay-hud';
    this.hud.innerHTML = `
      <div class="hud-left">
        <div class="hud-badge hud-level"><span class="hud-level-value">1</span></div>
        <div class="hud-hearts"></div>
      </div>
      <div class="hook-hud">
        <div class="hud-time"><span class="hud-time-value">60</span><span>s</span></div>
        <div class="hud-crates"><img src="assets/game/crate-a.png" alt="" draggable="false"><span class="hud-crates-value">0</span></div>
        <div class="hud-badge hud-coins"><img src="assets/ui/c.png" alt="" draggable="false"><span class="hud-coins-value">0</span></div>
        <button type="button" class="btn btn-square btn-pause" aria-label="Pause">
          <img src="assets/ui/b_8.png" alt="" draggable="false">
          <span class="btn-icon">⏸</span>
        </button>
      </div>
    `;

    this.controls = document.createElement('div');
    this.controls.className = 'hook-controls';
    this.controls.innerHTML = `
      <div class="hook-swing">
        <button type="button" class="btn btn-swing btn-swing-left" aria-label="Swing left">
          <img src="assets/ui/b_7.png" alt="" draggable="false">
          <span class="btn-label">◀</span>
        </button>
        <button type="button" class="btn btn-swing btn-swing-right" aria-label="Swing right">
          <img src="assets/ui/b_7.png" alt="" draggable="false">
          <span class="btn-label">▶</span>
        </button>
      </div>
      <div class="hook-drop">
        <button type="button" class="btn btn-grabdrop btn-grabdrop-main" aria-label="Grab or drop">
          <img src="assets/ui/b_4.png" alt="" draggable="false">
          <span class="btn-label">GRAB</span>
        </button>
      </div>
    `;

    this.bannerEl = document.createElement('div');
    this.bannerEl.className = 'level-banner';
    this.bannerEl.style.display = 'none';

    this.windHintEl = document.createElement('div');
    this.windHintEl.className = 'wind-hint';
    this.windHintEl.textContent = '🌬️';
    this.windHintEl.style.display = 'none';

    this.comboEl = document.createElement('div');
    this.comboEl.className = 'hud-combo';
    this.comboEl.style.display = 'none';
    this.comboEl.textContent = 'COMBO ×1';

    this.pauseOverlay = document.createElement('div');
    this.pauseOverlay.className = 'pause-overlay pause-ui';
    this.pauseOverlay.style.display = 'none';
    this.pauseOverlay.innerHTML = `
      <div class="pause-ui-panel">
        <h2 class="modal-title">PAUSE</h2>
        <button type="button" class="btn btn-primary btn-pause-resume">
          <img src="assets/ui/b_4.png" alt="" draggable="false">
          <span class="btn-label">RESUME</span>
        </button>
        <button type="button" class="btn btn-secondary btn-pause-restart">
          <img src="assets/ui/b_5.png" alt="" draggable="false">
          <span class="btn-label">RESTART</span>
        </button>
        <button type="button" class="btn btn-back btn-pause-quit">
          <img src="assets/ui/b_2.png" alt="" draggable="false">
          <span class="btn-label">QUIT</span>
        </button>
      </div>
    `;

    this.tutorialEl = document.createElement('div');
    this.tutorialEl.className = 'tutorial-overlay';
    this.tutorialEl.style.display = 'none';

    this.el.appendChild(this.canvas);
    this.el.appendChild(this.hud);
    this.el.appendChild(this.controls);
    this.el.appendChild(this.bannerEl);
    this.el.appendChild(this.windHintEl);
    this.el.appendChild(this.comboEl);
    this.el.appendChild(this.tutorialEl);
    this.el.appendChild(this.pauseOverlay);

    this.hud.querySelector('.btn-pause').addEventListener('click', () => {
      this.game.audio.click();
      this.openPause();
    });
    this.pauseOverlay.querySelector('.btn-pause-resume').addEventListener('click', () => {
      this.game.audio.click();
      this.closePause();
    });
    this.pauseOverlay.querySelector('.btn-pause-restart').addEventListener('click', () => {
      this.game.audio.click();
      this.closePause(true);
      this.startLevel(this.level, true);
    });
    this.pauseOverlay.querySelector('.btn-pause-quit').addEventListener('click', () => {
      this.game.audio.click();
      this.closePause(true);
      this.stopGameplay();
      this.game.show('menu');
    });

    /* swing input: hold to push */
    this.swingDir = 0;
    this.bindSwing = (button, dir) => {
      const start = (event) => {
        event.preventDefault();
        this.swingDir += dir;
      };
      const end = () => {
        this.swingDir -= dir;
      };
      button.addEventListener('pointerdown', start);
      button.addEventListener('pointerup', end);
      button.addEventListener('pointerleave', end);
      button.addEventListener('pointercancel', end);
      button.addEventListener('contextmenu', (event) => event.preventDefault());
    };
    this.bindSwing(this.controls.querySelector('.btn-swing-left'), -1);
    this.bindSwing(this.controls.querySelector('.btn-swing-right'), 1);

    this.controls.querySelector('.btn-grabdrop-main').addEventListener('click', () => {
      this.onGrabDrop();
    });

    /* keyboard: arrows swing, space grabs/drops */
    this.onKeyDown((event) => {
      if (event.code === 'Escape') {
        if (this.paused) this.closePause();
        else this.openPause();
        return;
      }
      if (event.code === 'ArrowLeft') this.swingDir = this.swingDir < 0 ? -1 : -1;
      if (event.code === 'ArrowRight') this.swingDir = this.swingDir > 0 ? 1 : 1;
      if (event.code === 'Space') this.onGrabDrop();
    });
    this.onKeyUpHandler = (event) => {
      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
        this.swingDir = this.swingDir > 0 ? (event.code === 'ArrowRight' ? 0 : this.swingDir) : (event.code === 'ArrowLeft' ? 0 : this.swingDir);
        this.swingDir = 0;
      }
    };
    const offKeyUp = this.game.input.on('keyup', this.onKeyUpHandler);
    this.cleanups.push(offKeyUp);

    this.offPause = SDK.onPause((paused) => {
      if (this.phase !== 'playing') return;
      if (paused && !this.paused) {
        this.platformPaused = true;
        this.openPause(true);
      } else if (!paused && this.platformPaused) {
        this.platformPaused = false;
        if (this.paused) this.closePause(true);
      }
    });
  }

  /* ---------------- lifecycle ---------------- */

  enter(previous, options) {
    const opts = options || {};
    this.level = opts.level || this.game.storage.get('level', 1);
    this.snapshot = opts.snapshot || null;

    if (opts.freshRun !== false) {
      const owned = this.game.storage.get('owned', []);
      this.hearts = owned.indexOf('extra_heart') >= 0 ? this.game.config.hud.hearts + 1 : this.game.config.hud.hearts;
    }

    this.resize();
    window.addEventListener('resize', this.resize);

    this.startLevel(this.level, false);

    this.lastTime = 0;
    this.phase = 'playing';
    if (this.frameId) cancelAnimationFrame(this.frameId);
    this.frameId = requestAnimationFrame(this.loop.bind(this));
    this.game.audio.playMusic('gameplay');
  }

  exit() {
    window.removeEventListener('resize', this.resize);
    cancelAnimationFrame(this.frameId);
    this.frameId = null;
    if (this.offPause) {
      this.offPause();
      this.offPause = null;
    }
    this.game.audio.stopMusic();
  }

  destroy() {
    if (this.offPause) {
      this.offPause();
      this.offPause = null;
    }
    super.destroy();
  }

  startLevel(level, forceFresh) {
    this.level = level;
    this.phase = 'playing';
    this.phaseTimer = 0;
    this.winHandled = false;
    this.failHandled = false;
    this.particles = [];
    this.popups = [];
    this.shake = 0;
    this.stats = { coins: 0, stars: 1 };
    this.perfects = 0;
    this.combo = 0;
    this.falling = [];
    this.stacked = [];
    this.carrying = null;
    this.cratesLost = 0;
    this.fragileBroken = false;
    this.swingDir = 0;
    this.angle = 0;
    this.omega = 0;
    this.windGust = 0;

    const spec = LevelGen.generate(level);
    this.spec = spec;
    this.world = spec;
    this.timeTotal = spec.timeBudget;
    this.timeLeft = spec.timeBudget;
    this.cratesLeft = spec.crates.filter((c) => c.state === 'dock').length;

    const owned = this.game.storage.get('owned', []);
    if (owned.indexOf('time_boost') >= 0 && this.game.storage.get('uses_time_boost', 0) > 0) {
      this.timeTotal += 20;
      this.timeLeft += 20;
    }

    this.shipX = spec.ship.baseX;
    this.shipPhase = spec.ship.phase;

    if (this.snapshot && !forceFresh) {
      this.restoreSnapshot(this.snapshot);
      this.snapshot = null;
      this.showBanner(null);
    } else {
      const worldMeta = LevelGen.worldFor(level);
      this.showBanner(LevelGen.bannerFor(level, worldMeta));
    }

    this.updateHud();
    SDK.sendMessage('level_started', { world: spec.world + 1, level });
    SDK.sendMessage('gameplay_started');

    /* tutorial on level 1 */
    if (level === 1 && !forceFresh) {
      this.showTutorial();
    }
  }

  stopGameplay() {
    SDK.sendMessage('gameplay_stopped');
    this.game.audio.stopMusic();
  }

  /* ---------------- snapshot (revive) ---------------- */

  snapshotState() {
    return {
      level: this.level,
      angle: this.angle,
      omega: this.omega,
      timeLeft: this.timeLeft,
      cratesLost: this.cratesLost,
      hearts: this.hearts,
      perfects: this.perfects,
      combo: this.combo,
      coins: this.stats.coins,
      shipX: this.shipX,
      shipPhase: this.shipPhase,
      crates: this.spec.crates.map((c) => ({ index: c.index, state: c.state, x: c.x, y: c.y })),
      stacked: this.stacked.map((s) => ({ x: s.x, y: s.y, sprite: s.sprite, golden: s.golden, fragile: s.fragile }))
    };
  }

  restoreSnapshot(snap) {
    this.level = snap.level;
    this.angle = snap.angle;
    this.omega = snap.omega;
    this.timeLeft = snap.timeLeft;
    this.cratesLost = snap.cratesLost;
    this.hearts = snap.hearts;
    this.perfects = snap.perfects;
    this.combo = snap.combo;
    this.stats.coins = snap.coins;
    this.shipX = snap.shipX;
    this.shipPhase = snap.shipPhase;
    this.spec.crates.forEach((c) => {
      const saved = snap.crates.find((s) => s.index === c.index);
      if (saved) {
        c.state = saved.state;
        c.x = saved.x;
        c.y = saved.y;
      }
    });
    this.stacked = snap.stacked.map((s) => ({ x: s.x, y: s.y, sprite: s.sprite, golden: s.golden, fragile: s.fragile }));
    this.cratesLeft = this.spec.crates.filter((c) => c.state === 'dock').length;
  }

  /* ---------------- pause ---------------- */

  openPause(platform) {
    if (this.paused) return;
    this.paused = true;
    this.pauseOverlay.style.display = 'flex';
    this.game.audio.stopMusic();
    SDK.sendMessage('level_paused', { world: LevelGen.worldFor(this.level).index + 1, level: this.level });
  }

  closePause(restarting) {
    if (!this.paused) return;
    this.paused = false;
    this.pauseOverlay.style.display = 'none';
    if (!restarting) {
      this.game.audio.playMusic('gameplay');
      SDK.sendMessage('level_resumed', { world: LevelGen.worldFor(this.level).index + 1, level: this.level });
    }
  }

  /* ---------------- core actions ---------------- */

  onGrabDrop() {
    if (this.paused || this.tutorialActive || this.phase !== 'playing') return;
    if (this.carrying) {
      this.dropCrate();
    } else {
      this.grabCrate();
    }
  }

  hookPosition() {
    const s = this.spec;
    const angle = this.angle;
    const L = s.ropeLen;
    return {
      x: s.pivot.x + Math.sin(angle) * L,
      y: s.pivot.y + Math.cos(angle) * L
    };
  }

  grabCrate() {
    const hook = this.hookPosition();
    const spec = this.spec;
    const owned = this.game.storage.get('owned', []);
    const magnet = owned.indexOf('hook_magnet') >= 0 && this.game.storage.get('uses_hook_magnet', 0) > 0;
    const marginX = magnet ? 150 : 110;
    const marginY = 140;

    const dockCrates = spec.crates.filter((c) => c.state === 'dock');
    let best = null;
    let bestDist = Infinity;
    dockCrates.forEach((c) => {
      const dx = Math.abs(c.x - hook.x);
      const dy = Math.abs(c.y - hook.y);
      if (dx < marginX && dy < marginY && dx + dy * 0.3 < bestDist) {
        best = c;
        bestDist = dx + dy * 0.3;
      }
    });
    if (!best) return;

    /* visual feedback: the crate snaps up to the hook */
    best.y = hook.y + 46;

    best.state = 'held';
    best.grabbed = true;
    this.carrying = best;
    this.game.audio.sfx('grab');
    this.spawnBurst(hook.x, hook.y, 10, ['#ffffff', '#b9f6ff']);
  }

  dropCrate() {
    const hook = this.hookPosition();
    const crate = this.carrying;
    if (!crate) return;
    this.carrying = null;

    /* the crate falls — cap horizontal velocity so drops are forgiving */
    const rawVx = Math.cos(this.angle) * this.omega * this.spec.ropeLen;
    const vx = Math.max(-260, Math.min(260, rawVx));
    const vy = 30;
    crate.state = 'falling';
    crate.x = hook.x;
    crate.y = hook.y + 46;
    crate.vx = vx;
    crate.vy = vy;
    this.falling.push(crate);
    this.game.audio.sfx('drop');
  }

  updateShip(delta) {
    const s = this.spec;
    const ship = s.ship;
    this.shipPhase += delta * ship.rockSpeed;
    if (ship.range > 0) {
      const dir = ship.driftDir;
      const target = ship.baseX + Math.sin(this.shipPhase * 0.6) * ship.range * dir;
      ship.baseX += (target - ship.baseX) * Math.min(1, delta * ship.speed * 0.12);
      this.shipX = ship.baseX;
    }
  }

  crateHoldX() {
    return this.shipX;
  }

  updateFalling(delta) {
    const s = this.spec;
    const ship = s.ship;
    const holdLeft = this.shipX - ship.holdW / 2;
    const holdRight = this.shipX + ship.holdW / 2;
    const deckY = ship.y;

    this.falling.forEach((crate) => {
      crate.vy += 1500 * delta;
      crate.x += crate.vx * delta;
      crate.y += crate.vy * delta;

      const stackTop = this.stacked.reduce((maxY, st) => (st.x >= holdLeft && st.x <= holdRight ? Math.min(maxY, st.y) : maxY), deckY - ship.holdH);

      /* landed inside the hold → stack */
      if (crate.y >= stackTop && crate.x >= holdLeft && crate.x <= holdRight) {
        this.landCrate(crate);
        return;
      }
      /* missed → water */
      if (crate.y > deckY + 60 || crate.x < 40 || crate.x > LevelGen.W - 40) {
        this.loseCrate(crate);
      }
    });
    this.falling = this.falling.filter((c) => c.state === 'falling');
  }

  landCrate(crate) {
    const s = this.spec;
    const ship = s.ship;
    const holdLeft = this.shipX - ship.holdW / 2;
    const holdRight = this.shipX + ship.holdW / 2;
    const stackTop = this.stacked.reduce((maxY, st) => (st.x >= holdLeft && st.x <= holdRight ? Math.min(maxY, st.y) : maxY), ship.y - ship.holdH);

    /* fragile crates break if dropped from high */
    if (crate.fragile && crate.y < stackTop - 130) {
      this.fragileBroken = true;
      crate.state = 'lost';
      this.cratesLost += 1;
      this.combo = 0;
      this.shake = 14;
      this.game.audio.sfx('fail');
      this.spawnBurst(crate.x, crate.y, 24, ['#c9c9c9', '#ffffff', '#ff5d5d']);
      this.addPopup(crate.x, crate.y - 60, 'BROKEN!');
      this.updateHud();
      return;
    }

    crate.state = 'stacked';
    crate.x = Math.max(holdLeft + 30, Math.min(holdRight - 30, crate.x));
    crate.y = stackTop;
    this.stacked.push({ x: crate.x, y: crate.y, sprite: crate.sprite, golden: crate.golden, fragile: crate.fragile });
    this.cratesLeft = this.spec.crates.filter((c) => c.state === 'dock' || c.state === 'held' || c.state === 'falling').length;
    if (this.cratesLeft <= 0) this.cratesLeft = 0;

    /* perfect drop: dead center */
    const center = this.shipX;
    const perfect = Math.abs(crate.x - center) < ship.holdW * 0.14;
    if (perfect) {
      this.perfects += 1;
      this.combo += 1;
      const mult = Math.min(5, 1 + Math.floor(this.combo / 2));
      const bonus = 3 * mult;
      this.stats.coins += bonus;
      this.game.audio.sfx('perfect');
      this.spawnBurst(crate.x, crate.y - 30, 20, ['#ffd700', '#fff3bf', '#ffffff', '#ffb347']);
      this.addPopup(crate.x, crate.y - 70, `PERFECT! +${bonus}`);
      this.comboEl.style.display = 'flex';
      this.comboEl.textContent = `COMBO ×${mult}`;
      this.shake = Math.max(this.shake, 8);
    } else {
      this.combo = Math.max(0, this.combo - 1);
      this.game.audio.sfx('drop');
      this.spawnBurst(crate.x, crate.y - 20, 10, ['#ffffff', '#ffd166']);
    }
    this.updateHud();

    /* all crates loaded → win */
    if (this.cratesLeft <= 0 && this.falling.length === 0) {
      this.phase = 'winSeq';
      this.phaseTimer = 0.9;
      this.game.audio.sfx('win');
      this.spawnConfetti(30);
      this.game.audio.stopMusic();
    }
  }

  loseCrate(crate) {
    crate.state = 'lost';
    this.cratesLost += 1;
    this.combo = 0;
    this.comboEl.style.display = 'none';
    this.game.audio.sfx('splash');
    this.shake = 12;
    this.spawnBurst(crate.x, Math.min(crate.y, 1000), 16, ['#4cc9f0', '#b9f6ff', '#ffffff']);
    this.addPopup(crate.x, 960, 'SPLASH!');
    this.updateHud();

    /* life-loss feedback */
    if (this.hearts >= 2) {
      this.addPopup(360, 540, `${this.hearts - 1} HEART${this.hearts - 1 > 1 ? 'S' : ''} LEFT`);
    }

    if (this.cratesLost >= 3) {
      this.phase = 'failSeq';
      this.phaseTimer = 1.1;
      this.game.audio.sfx('fail');
      this.shake = 16;
    }
  }

  /* ---------------- loop ---------------- */

  loop(time) {
    const delta = this.lastTime ? (time - this.lastTime) / 1000 : 0;
    this.lastTime = time;
    if (!this.paused) {
      this.update(delta);
    }
    this.render();
    this.frameId = requestAnimationFrame(this.loop.bind(this));
  }

  update(delta) {
    const dt = Math.min(delta, 0.05);
    this.time += dt;
    this.cloudOffset += dt * 12;

    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) {
        this.bannerEl.style.display = 'none';
        this.bannerEl.innerHTML = '';
      }
    }

    if (this.phase === 'playing' && !this.tutorialActive) {
      this.updateShip(dt);

      /* wind gust */
      const spec = this.spec;
      if (spec.wind.active) {
        const gust = Math.sin(this.time * spec.wind.freq * 2 + spec.wind.phase) * spec.wind.base;
        this.windGust = gust;
        this.windHintEl.style.display = 'flex';
      }

      /* pendulum physics: α = -(g/L)sinθ + input + wind */
      const g = 2000;
      const L = spec.ropeLen;
      const gravity = -(g / L) * Math.sin(this.angle);
      const input = this.swingDir * 300;
      const wind = this.windGust * 0.14;
      const damping = -this.omega * 0.32;
      const alpha = gravity + input + wind + damping;
      this.omega += alpha * dt;
      this.omega = Math.max(-7, Math.min(7, this.omega));
      this.angle += this.omega * dt;

      /* time */
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.phase = 'failSeq';
        this.phaseTimer = 1.0;
        this.game.audio.sfx('fail');
      }

      this.updateFalling(dt);

      /* all crates loaded → win (checked here too so the flow is robust) */
      if (this.phase === 'playing' && this.cratesLeft <= 0 && this.falling.length === 0 && this.carrying === null) {
        this.phase = 'winSeq';
        this.phaseTimer = 0.9;
        this.game.audio.sfx('win');
        this.spawnConfetti(30);
        this.game.audio.stopMusic();
      }

      /* swing creak every so often for life */
      if (Math.abs(this.omega) > 1.2 && Math.random() < dt * 0.8) {
        this.game.audio.sfx('swing');
      }

      if (this.phase === 'winSeq') {
        this.phaseTimer = 0.9;
      } else if (this.phase === 'failSeq' && this.phaseTimer <= 0.3 && !this.failHandled) {
        /* handled below */
      }
    }

    if (this.phase === 'winSeq') {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0 && !this.winHandled) {
        this.winHandled = true;
        this.onWin();
      }
    } else if (this.phase === 'failSeq') {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0 && !this.failHandled) {
        this.failHandled = true;
        this.onFail();
      }
    }

    this.updateHud();
    this.updateParticles(dt);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 40);
  }

  /* ---------------- win / fail ---------------- */

  onWin() {
    const spec = this.spec;
    const coinsCollected = this.stats.coins;
    const timeRatio = this.timeLeft / this.timeTotal;
    let stars = timeRatio >= 0.55 ? 3 : timeRatio >= 0.3 ? 2 : 1;
    if (this.perfects > 0) stars = Math.min(3, stars + 1);

    const winStreak = this.game.storage.get('winstreak', 0);
    const streakCount = winStreak + 1;
    const streakMult = streakCount >= 5 ? 3 : streakCount >= 3 ? 2 : streakCount >= 2 ? 1.5 : 1;
    this.game.storage.set('winstreak', streakCount);

    let reward = Math.round((18 + 4 * coinsCollected + Math.floor(this.level / 12)) * streakMult);
    const goldenActive = this.game.storage.get('uses_golden_hook', 0) > 0;
    const doubleActive = spec.doubleCoins || this.game.storage.get('uses_double_coins', 0) > 0;
    if (goldenActive || doubleActive) reward *= 2;
    if (this.perfects >= 2) reward = Math.round(reward * 1.5);

    const coins = this.game.storage.get('coins', 0) + reward;
    this.game.storage.set('coins', coins);
    const nextLevel = Math.min(LevelGen.MAX_LEVEL, this.level + 1);
    this.game.storage.set('level', Math.max(this.game.storage.get('level', 1), nextLevel));

    const starsMap = this.game.storage.get('stars', {});
    starsMap[this.level] = Math.max(starsMap[this.level] || 0, stars);
    this.game.storage.set('stars', starsMap);

    this.consumeUse('uses_hook_magnet');
    this.consumeUse('uses_golden_hook');
    this.consumeUse('uses_double_coins');
    this.consumeUse('uses_time_boost');

    this.stats = { coins: coinsCollected, stars, reward, totalCoins: coins, streakCount, streakMult, perfects: this.perfects };

    this.stopGameplay();
    SDK.sendMessage('level_completed', { world: spec.world + 1, level: this.level });

    this.game.storage.set('streak', { type: 'win', count: (this.game.storage.get('streak', { type: null, count: 0 }).type === 'win' ? this.game.storage.get('streak').count + 1 : 1) });
    const streak = this.game.storage.get('streak');

    const options = {
      level: this.level, stars, coinsCollected, reward, totalCoins: coins, doubleActive,
      streakCount, streakMult, perfects: this.perfects
    };
    if (streak.count >= 2 && SDK.isInterstitialSupported()) {
      SDK.showInterstitial('level_complete').then(() => {
        this.game.show('victory', options);
      });
    } else {
      this.game.show('victory', options);
    }
  }

  onFail() {
    const spec = this.spec;
    this.game.storage.set('winstreak', 0);
    SDK.sendMessage('level_failed', { world: spec.world + 1, level: this.level });

    if (this.hearts > 0) {
      this.hearts -= 1;
      this.game.storage.set('streak', { type: 'fail', count: (this.game.storage.get('streak', { type: null, count: 0 }).type === 'fail' ? this.game.storage.get('streak').count + 1 : 1) });
      const streak = this.game.storage.get('streak');
      const resume = () => this.startLevel(this.level, true);
      if (streak.count >= 2 && SDK.isInterstitialSupported()) {
        SDK.showInterstitial('level_failed').then(resume);
      } else {
        resume();
      }
    } else {
      this.stopGameplay();
      const consolation = 2;
      const coins = this.game.storage.get('coins', 0) + consolation;
      this.game.storage.set('coins', coins);
      this.consumeUse('uses_hook_magnet');
      this.consumeUse('uses_golden_hook');
      this.consumeUse('uses_double_coins');
      this.consumeUse('uses_time_boost');
      this.game.storage.set('streak', { type: 'fail', count: (this.game.storage.get('streak', { type: null, count: 0 }).type === 'fail' ? this.game.storage.get('streak').count + 1 : 1) });
      const streak = this.game.storage.get('streak');
      const options = {
        level: this.level,
        coinsCollected: this.stats.coins,
        consolation,
        snapshot: this.snapshotState(),
        totalCoins: this.game.storage.get('coins', 0)
      };
      if (streak.count >= 2 && SDK.isInterstitialSupported()) {
        SDK.showInterstitial('game_over').then(() => {
          this.game.show('gameover', options);
        });
      } else {
        this.game.show('gameover', options);
      }
    }
  }

  consumeUse(key) {
    const uses = this.game.storage.get(key, 0);
    if (uses > 0) {
      this.game.storage.set(key, uses - 1);
    }
  }

  /* ---------------- HUD ---------------- */

  updateHud() {
    const hud = this.hud;
    if (!hud) return;

    const levelValue = hud.querySelector('.hud-level-value');
    if (levelValue) levelValue.textContent = this.level.toLocaleString('en-US');

    const heartsContainer = hud.querySelector('.hud-hearts');
    if (heartsContainer) {
      heartsContainer.innerHTML = '';
      for (let index = 0; index < this.hearts; index += 1) {
        const img = document.createElement('img');
        img.src = 'assets/game/crate-a.png';
        img.alt = '';
        img.className = 'heart-icon';
        heartsContainer.appendChild(img);
      }
    }

    const coinsValue = hud.querySelector('.hud-coins-value');
    if (coinsValue) coinsValue.textContent = this.stats.coins.toLocaleString('en-US');

    const timeValue = hud.querySelector('.hud-time-value');
    if (timeValue) {
      const secs = Math.max(0, Math.ceil(this.timeLeft));
      timeValue.textContent = secs.toLocaleString('en-US');
      hud.querySelector('.hud-time').classList.toggle('low', secs <= 10);
    }

    const cratesValue = hud.querySelector('.hud-crates-value');
    if (cratesValue) cratesValue.textContent = this.cratesLeft.toLocaleString('en-US');
  }

  showTutorial() {
    this.tutorialActive = true;
    this.tutorialEl.innerHTML = `
      <div class="tutorial-box">
        <div class="tutorial-step">◀ ▶ <strong>SWING</strong> the hook over a crate</div>
        <div class="tutorial-step"><strong>GRAB</strong> it with the center button</div>
        <div class="tutorial-step">Release <strong>OVER THE SHIP</strong> to drop</div>
        <div class="tutorial-step">Watch the <span style="color:#8ac926">GREEN</span> target dot!</div>
        <button type="button" class="btn btn-primary btn-tutorial-ok">
          <span class="btn-label">GOT IT!</span>
        </button>
      </div>
    `;
    this.tutorialEl.style.display = 'flex';
    const dismiss = () => {
      this.tutorialEl.style.display = 'none';
      this.tutorialActive = false;
    };
    this.tutorialEl.querySelector('.btn-tutorial-ok').addEventListener('click', (e) => {
      e.stopPropagation();
      this.game.audio.click();
      dismiss();
    });
    /* tap anywhere on the overlay to dismiss */
    this.tutorialEl.addEventListener('click', dismiss, { once: true });
    /* keyboard dismiss */
    this._tutKeyHandler = (e) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
        e.preventDefault();
        dismiss();
        window.removeEventListener('keydown', this._tutKeyHandler);
      }
    };
    window.addEventListener('keydown', this._tutKeyHandler);
  }

  showBanner(banner) {
    if (!banner) {
      this.bannerEl.style.display = 'none';
      this.bannerEl.innerHTML = '';
      this.bannerTimer = 0;
      return;
    }
    const newWorld = banner.sub === 'NEW WORLD';
    this.bannerEl.className = 'level-banner' + (newWorld ? ' world-banner' : '');
    this.bannerEl.innerHTML = `
      <div class="banner-title">${banner.title}</div>
      <div class="banner-sub">${banner.sub}</div>
    `;
    this.bannerEl.style.display = 'flex';
    this.bannerTimer = newWorld ? 2.4 : 1.7;
  }

  /* ---------------- particles / popups ---------------- */

  addPopup(x, y, text) {
    const rect = this.canvas.getBoundingClientRect();
    const s = Math.min(rect.width / 720, rect.height / 1280);
    const ox = (rect.width - 720 * s) / 2;
    const oy = (rect.height - 1280 * s) / 2;
    const el = document.createElement('div');
    el.className = 'float-popup';
    el.textContent = text;
    el.style.left = `${((x * s + ox) / rect.width) * 100}%`;
    el.style.top = `${((y * s + oy) / rect.height) * 100}%`;
    el.style.fontSize = `${Math.max(18, text.length > 10 ? 26 : 40)}px`;
    this.el.appendChild(el);
    this.popups.push(el);
    window.setTimeout(() => {
      el.remove();
    }, 1100);
  }

  spawnBurst(x, y, count, colors) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 260;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 120,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 900
      });
    }
  }

  spawnConfetti(count) {
    for (let index = 0; index < count; index += 1) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const speed = 320 + Math.random() * 380;
      this.particles.push({
        x: 360 + (Math.random() - 0.5) * 300,
        y: 300,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 1.2 + Math.random() * 0.8,
        size: 6 + Math.random() * 6,
        color: ['#ff5d8f', '#ffd166', '#8ac926', '#4cc9f0', '#ffffff'][Math.floor(Math.random() * 5)],
        gravity: 500,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 8
      });
    }
  }

  updateParticles(delta) {
    this.particles.forEach((p) => {
      p.life += delta;
      p.vy += p.gravity * delta;
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      if (p.rot !== undefined) p.rot += p.vr * delta;
    });
    this.particles = this.particles.filter((p) => p.life < p.maxLife);
  }

  /* ---------------- render ---------------- */

  resize() {
    const rect = this.el.getBoundingClientRect();
    this.canvas.width = Math.max(1, Math.floor(rect.width * devicePixelRatio));
    this.canvas.height = Math.max(1, Math.floor(rect.height * devicePixelRatio));
  }

  render() {
    const { ctx, canvas } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* game area */
    const s = Math.min(canvas.width / 720, canvas.height / 1280);
    const ox = (canvas.width - 720 * s) / 2;
    const oy = (canvas.height - 1280 * s) / 2;
    ctx.setTransform(s, 0, 0, s, ox, oy);
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }

    if (this.spec) {
      this.drawBackground(ctx);
      this.drawWater(ctx);
      this.drawDock(ctx);
      this.drawShip(ctx);
      this.drawCrates(ctx);
      this.drawCrane(ctx);
      this.drawFalling(ctx);
      this.drawReticle(ctx);
      this.drawParticles(ctx);
      this.drawWind(ctx);
    }
  }

  layerPath(bgDir, name) {
    return `assets/screens/${bgDir}/${name}.png`;
  }

  drawBackground(ctx) {
    const dir = this.spec.bgDir;
    const W = 720;
    const H = 1280;
    const layers = {
      w1: ['sky', 'cloud', 'sea', 'land', 'decor'],
      w2: ['sky', 'cloud', 'sea', 'land', 'island', 'decor'],
      w3: ['sky', 'cloud', 'sea', 'land', 'decor'],
      w4: ['sky', 'cloud', 'sea', 'land', 'sun', 'decor'],
      /* deepest layer first so the closer (opaque) sky shows through */
      w5: ['pixel-oc_1_240', 'pixel-oc_2_165', 'pixel-oc_3_122', 'pixel-oc_4_81'],
      w6: ['moon-and_4_91', 'moon-and_3_134', 'moon-and_2_182', 'moon-and_1_262']
    };
    const list = layers[dir] || layers.w1;
    list.forEach((name, index) => {
      const img = Assets.get(this.layerPath(dir, name));
      if (!img.complete || !img.naturalWidth) return;
      /* cover-fit: fill the whole portrait canvas, keep aspect */
      const scale = Math.max(W / img.width, H / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      /* subtle parallax drift between layers */
      const factor = 0.06 * (list.length - index);
      const drift = Math.sin(this.time * 0.2 + index) * 8;
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.drawImage(img, (W - w) / 2 - drift * factor, (H - h) / 2, w, h);
      ctx.restore();
    });
  }

  drawWater(ctx) {
    const img = Assets.get('assets/game/water.png');
    if (!img.complete || !img.naturalWidth) return;
    const waveH = 90;
    const tileW = 256;
    const y = this.spec.waterY;
    for (let x = -256; x < 720 + 256; x += tileW) {
      const bob = Math.sin(this.time * 3 + x * 0.02) * 6;
      ctx.drawImage(img, x, y + bob, tileW + 4, waveH);
    }
    /* soft foam edge */
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(0, y - 4, 720, 8);
  }

  drawShip(ctx) {
    const ship = this.spec.ship;
    const rock = Math.sin(this.shipPhase) * ship.rockAmp;
    const img = Assets.get('assets/game/ship.png');
    if (!img.complete || !img.naturalWidth) return;
    const w = 560;
    const h = 150;
    ctx.save();
    ctx.translate(this.shipX, ship.y - h / 2 + 8);
    ctx.rotate(rock);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);

    /* hold outline (drop zone) */
    const holdLeft = this.shipX - ship.holdW / 2;
    const holdTop = ship.y - ship.holdH - 6;
    ctx.save();
    ctx.translate(this.shipX, ship.y);
    ctx.rotate(rock);
    ctx.translate(-this.shipX, -ship.y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(holdLeft, holdTop, ship.holdW, ship.holdH + 4);
    ctx.setLineDash([]);
    ctx.restore();

    /* stacked crates in the hold */
    this.stacked.forEach((st) => {
      const cimg = Assets.get(st.sprite);
      if (cimg.complete && cimg.naturalWidth) {
        ctx.drawImage(cimg, st.x - 48, st.y - 37, 96, 74);
      }
    });
    ctx.restore();
  }

  /* ---- wooden dock / quay where crates sit ---- */
  drawDock(ctx) {
    const spec = this.spec;
    const W = 720;
    const dockY = 810;  /* just below crate.y (780) */
    const dockH = 28;
    const waterY = spec.waterY || 940;

    /* determine dock extent from crate positions */
    const dockCrates = spec.crates.filter((c) => c.state === 'dock');
    if (dockCrates.length === 0) {
      /* fallback: full-width dock */
      this._drawDockSegment(ctx, 30, W - 30, dockY, dockH, waterY);
      return;
    }

    /* group crates by dock side */
    const leftCrates = dockCrates.filter((c) => c.x < W / 2);
    const rightCrates = dockCrates.filter((c) => c.x >= W / 2);

    if (leftCrates.length > 0) {
      const minX = Math.min(...leftCrates.map((c) => c.x)) - 60;
      const maxX = Math.max(...leftCrates.map((c) => c.x)) + 60;
      this._drawDockSegment(ctx, Math.max(0, minX), Math.min(W / 2, maxX), dockY, dockH, waterY);
    }
    if (rightCrates.length > 0) {
      const minX = Math.min(...rightCrates.map((c) => c.x)) - 60;
      const maxX = Math.max(...rightCrates.map((c) => c.x)) + 60;
      this._drawDockSegment(ctx, Math.max(W / 2, minX), Math.min(W, maxX), dockY, dockH, waterY);
    }
  }

  _drawDockSegment(ctx, x0, x1, dockY, dockH, waterY) {
    const w = x1 - x0;
    if (w <= 0) return;

    /* dock surface (wood planks) */
    const grad = ctx.createLinearGradient(x0, dockY, x0, dockY + dockH + 30);
    grad.addColorStop(0, '#8B6914');
    grad.addColorStop(0.3, '#A0782C');
    grad.addColorStop(1, '#5C4A1A');
    ctx.fillStyle = grad;
    ctx.fillRect(x0, dockY, w, dockH);

    /* plank lines */
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    for (let x = x0 + 10; x < x1; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, dockY);
      ctx.lineTo(x, dockY + dockH);
      ctx.stroke();
    }

    /* dock top highlight */
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x0, dockY, w, 3);

    /* pilings (vertical posts) */
    ctx.fillStyle = '#5C4A1A';
    const pilingTop = dockY + dockH - 4;
    for (let px = x0 + 10; px < x1; px += 60) {
      ctx.fillRect(px, pilingTop, 8, waterY - pilingTop);
      /* highlight */
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(px, pilingTop, 3, waterY - pilingTop);
      ctx.fillStyle = '#5C4A1A';
    }

    /* water splash under dock */
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x0, waterY - 6, w, 6);
  }

  drawCrates(ctx) {
    const spec = this.spec;
    spec.crates.forEach((crate) => {
      if (crate.state !== 'dock') return;
      const img = Assets.get(crate.sprite);
      if (!img.complete || !img.naturalWidth) return;
      const bob = Math.sin(this.time * 2 + crate.x * 0.05) * 3;
      ctx.drawImage(img, crate.x - 48, crate.y - 37 + bob, 96, 74);
      if (crate.fragile) {
        ctx.strokeStyle = 'rgba(255, 90, 90, 0.9)';
        ctx.lineWidth = 4;
        ctx.strokeRect(crate.x - 48, crate.y - 37 + bob, 96, 74);
      }
      if (crate.golden) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
        ctx.fillRect(crate.x - 48, crate.y - 37 + bob, 96, 74);
      }
    });

    /* the crate being carried hangs under the hook */
    if (this.carrying) {
      const hook = this.hookPosition();
      const img = Assets.get(this.carrying.sprite);
      if (img.complete && img.naturalWidth) {
        ctx.drawImage(img, hook.x - 48, hook.y + 20, 96, 74);
      }
    }
  }

  drawCrane(ctx) {
    const spec = this.spec;

    /* mast (crane tower) behind */
    const mast = Assets.get('assets/game/mast.png');
    if (mast.complete && mast.naturalWidth) {
      ctx.drawImage(mast, spec.pivot.x - 16, 0, 32, 340);
    }

    /* rigging arm (horizontal beam) */
    const rigging = Assets.get('assets/game/rigging.png');
    if (rigging.complete && rigging.naturalWidth) {
      ctx.drawImage(rigging, spec.pivot.x - 180, spec.pivot.y - 60, 360, 120);
    }

    /* rope from pivot to hook */
    const hook = this.hookPosition();
    const pivot = spec.pivot;
    ctx.strokeStyle = '#5b3a1e';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y);
    ctx.lineTo(hook.x, hook.y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y);
    ctx.lineTo(hook.x, hook.y);
    ctx.stroke();

    /* hook */
    const hookImg = Assets.get('assets/game/hook.png');
    if (hookImg.complete && hookImg.naturalWidth) {
      ctx.save();
      ctx.translate(hook.x, hook.y);
      ctx.rotate(this.angle);
      ctx.drawImage(hookImg, -30, -26, 60, 53);
      ctx.restore();
    }

    /* pivot cap */
    ctx.fillStyle = '#3d2a12';
    ctx.beginPath();
    ctx.arc(pivot.x, pivot.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b4a24';
    ctx.beginPath();
    ctx.arc(pivot.x, pivot.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFalling(ctx) {
    this.falling.forEach((crate) => {
      const img = Assets.get(crate.sprite);
      if (!img.complete || !img.naturalWidth) return;
      ctx.save();
      ctx.translate(crate.x, crate.y);
      ctx.rotate(crate.vy * 0.01);
      ctx.drawImage(img, -48, -37, 96, 74);
      ctx.restore();
    });
  }

  drawWind(ctx) {
    if (!this.spec.wind.active || this.phase !== 'playing') return;
    const strength = this.windGust;
    const alpha = Math.min(0.7, Math.abs(strength) / 80);
    const dir = strength >= 0 ? 1 : -1;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 3;
    for (let index = 0; index < 5; index += 1) {
      const y = 420 + index * 60 + Math.sin(this.time * 2 + index) * 10;
      const x0 = dir > 0 ? 60 : 660;
      const x1 = dir > 0 ? 180 : 540;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y + Math.sin(this.time * 3 + index) * 14);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawParticles(ctx) {
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = 1 - p.life / p.maxLife;
      ctx.fillStyle = p.color;
      if (p.rot !== undefined) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  /* ---- landing reticle: shows where the crate will land ---- */
  drawReticle(ctx) {
    if (this.phase !== 'playing' || !this.carrying) return;
    const hook = this.hookPosition();
    const rawVx = Math.cos(this.angle) * this.omega * this.spec.ropeLen;
    const vx = Math.max(-260, Math.min(260, rawVx));
    const vy0 = 30;
    const g = 1500;
    const ship = this.spec.ship;
    const holdTop = ship.y - ship.holdH;
    const startY = hook.y + 46;
    const dist = holdTop - startY;
    if (dist <= 0) return;
    const a = 0.5 * g;
    const t = (-vy0 + Math.sqrt(vy0 * vy0 + 4 * a * dist)) / (2 * a);
    const landX = hook.x + vx * t;
    const landY = holdTop;
    /* dashed line from hook to landing spot */
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(hook.x, startY);
    ctx.lineTo(landX, landY);
    ctx.stroke();
    ctx.setLineDash([]);
    /* landing circle */
    const inHold = landX >= ship.x - ship.holdW / 2 && landX <= ship.x + ship.holdW / 2;
    ctx.strokeStyle = inHold ? 'rgba(138, 201, 38, 0.7)' : 'rgba(255, 93, 93, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(landX, landY, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
