class VictoryScreen extends BaseScreen {
  constructor(game) {
    super(game, 'victory');
    this.confettiFrame = null;
  }

  build(options = {}) {
    this.level = options.level || 1;
    this.resizeConfetti = this.resizeConfetti.bind(this);
    this.stars = options.stars != null ? options.stars : 3;
    this.coinsCollected = options.coinsCollected || 0;
    this.reward = options.reward || 0;
    this.totalCoins = options.totalCoins != null ? options.totalCoins : this.game.storage.get('coins', 0);
    this.doubleActive = !!options.doubleActive;
    this.rewardDoubled = false;
    this.streakCount = options.streakCount || 0;
    this.streakMult = options.streakMult || 1;
    this.perfects = options.perfects || 0;

    this.el = document.createElement('div');
    this.el.className = 'screen victory-screen';
    this.el.style.backgroundImage = `url("${this.game.config.backgrounds.menu}")`;

    this.confettiCanvas = document.createElement('canvas');
    this.confettiCanvas.className = 'confetti-canvas';
    this.el.appendChild(this.confettiCanvas);

    const panel = new Panel({ image: 'assets/ui/f.png' });
    const extras = [];
    if (this.streakCount >= 2) {
      extras.push(this.tagEl(`🔥 STREAK ×${this.streakMult}`));
    }
    if (this.perfects > 0) {
      extras.push(this.tagEl(`✨ PERFECT CUT${this.perfects > 1 ? 'S' : ''} +${this.perfects}`));
    }
    panel.add(
      this.titleEl('VICTORY!'),
      this.subtitleEl(`LEVEL ${this.level.toLocaleString('en-US')} COMPLETE`),
      this.starsEl(this.stars),
      this.rewardEl(this.reward),
      ...extras,
      this.buttonEl('NEXT LEVEL', 'primary', () => this.nextLevel()),
      this.buttonEl('DOUBLE COINS', 'secondary', () => this.doubleCoins())
    );
    this.el.appendChild(panel.el);

    this.onKeyDown((event) => {
      if (event.code === 'Enter' || event.code === 'Space') this.nextLevel();
    });
  }

  enter() {
    this.game.audio.playMusic('menu');
    this.startConfetti();
  }

  exit() {
    this.stopConfetti();
  }

  destroy() {
    this.stopConfetti();
    super.destroy();
  }

  starsEl(count) {
    const row = document.createElement('div');
    row.className = 'modal-stars';
    for (let index = 0; index < 3; index += 1) {
      const img = document.createElement('img');
      img.src = index < count ? 'assets/ui/s1.png' : 'assets/ui/s2.png';
      img.alt = '';
      row.appendChild(img);
    }
    return row;
  }

  rewardEl(reward) {
    const row = document.createElement('div');
    row.className = 'modal-score';
    row.innerHTML = `<img src="assets/ui/c.png" alt="" draggable="false"><span class="victory-reward">+${reward.toLocaleString('en-US')}</span>`;
    return row;
  }

  subtitleEl(text) {
    const h = document.createElement('div');
    h.className = 'modal-subtitle';
    h.textContent = text;
    return h;
  }

  titleEl(text) {
    const h = document.createElement('h2');
    h.className = 'modal-title';
    h.textContent = text;
    return h;
  }

  tagEl(text) {
    const tag = document.createElement('div');
    tag.className = 'victory-tag';
    tag.textContent = text;
    return tag;
  }

  buttonEl(label, variant, onClick) {
    return new Button({ label, variant, onClick });
  }

  nextLevel() {
    this.game.audio.click();
    /* freshRun:false keeps the remaining hearts — a fail on the next level
       still costs a session heart, so GAME OVER stays meaningful */
    this.game.show(this.game.config.playTarget || 'gameplay', { level: this.level + 1, freshRun: false });
  }

  doubleCoins() {
    if (!SDK.isRewardedSupported() || this.rewardDoubled) return;
    this.game.audio.click();
    SDK.showRewarded('double_coins').then((state) => {
      if (state === 'rewarded') {
        this.rewardDoubled = true;
        const extra = this.reward;
        const coins = this.game.storage.get('coins', 0) + extra;
        this.game.storage.set('coins', coins);
        const label = this.el.querySelector('.victory-reward');
        if (label) {
          label.textContent = `+${(this.reward * 2).toLocaleString('en-US')}`;
        }
        const button = this.el.querySelector('.btn-secondary .btn-label');
        if (button) button.textContent = 'DOUBLED ✓';
        this.game.audio.sfx('win');
        this.spawnConfetti(30);
      }
    });
  }

  /* ---- confetti ---- */

  startConfetti() {
    this.resizeConfetti();
    window.addEventListener('resize', this.resizeConfetti);
    this.confettiPieces = [];
    this.confettiFrame = requestAnimationFrame(this.confettiLoop.bind(this));
  }

  stopConfetti() {
    window.removeEventListener('resize', this.resizeConfetti);
    if (this.confettiFrame) {
      cancelAnimationFrame(this.confettiFrame);
      this.confettiFrame = null;
    }
  }

  resizeConfetti() {
    const rect = this.el.getBoundingClientRect();
    this.confettiCanvas.width = Math.floor(rect.width * devicePixelRatio);
    this.confettiCanvas.height = Math.floor(rect.height * devicePixelRatio);
  }

  spawnConfetti(count) {
    if (!this.confettiPieces) this.confettiPieces = [];
    for (let index = 0; index < count; index += 1) {
      this.confettiPieces.push({
        x: Math.random() * this.confettiCanvas.width,
        y: -20 - Math.random() * 80,
        vx: (Math.random() - 0.5) * 160,
        vy: 140 + Math.random() * 220,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 9,
        size: 7 + Math.random() * 8,
        color: ['#ff5d8f', '#ffd166', '#8ac926', '#4cc9f0', '#ffffff'][Math.floor(Math.random() * 5)]
      });
    }
  }

  confettiLoop(time) {
    const ctx = this.confettiCanvas.getContext('2d');
    const rect = this.el.getBoundingClientRect();
    const scaleX = this.confettiCanvas.width / Math.max(1, rect.width);
    const scaleY = this.confettiCanvas.height / Math.max(1, rect.height);
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    this.confettiPieces.forEach((p) => {
      p.vy += 240 * 0.016;
      p.x += p.vx * 0.016;
      p.y += p.vy * 0.016;
      p.rot += p.vr * 0.016;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    });
    this.confettiPieces = this.confettiPieces.filter((p) => p.y < rect.height + 40);
    this.confettiFrame = requestAnimationFrame(this.confettiLoop.bind(this));
  }
}
