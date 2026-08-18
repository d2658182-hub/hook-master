/* Loading screen — shows a progress bar while the game assets preload.
   Drives the bar from bar_1 (fill) over bar_2 (track) in assets/ui/.
   Also reports progress to the Playgama SDK when present (SDK.loadingProgress). */

const PACK_IMAGES = [
  'b_1.png', 'b_2.png', 'b_3.png', 'b_4.png', 'b_5.png',
  'b_6.png', 'b_7.png', 'b_8.png', 'bar_1.png', 'bar_2.png',
  'c.png', 'f.png', 'field.png', 'l1.png', 'l2.png',
  'pr_ui_gold.png', 's1.png', 's2.png'
];

class LoadingScreen extends BaseScreen {
  constructor(game) {
    super(game, 'loading');
  }

  build() {
    const config = this.game.config;

    this.el = document.createElement('div');
    this.el.className = 'screen loading-screen';
    this.el.style.backgroundImage = `url("${config.backgrounds.menu}")`;
    this.el.innerHTML = `
      <div class="loading-content">
        <h1 class="game-title">${config.title}</h1>
        <div class="loading-bar">
          <div class="loading-fill"></div>
        </div>
        <div class="loading-text">LOADING 0%</div>
      </div>
    `;

    this.preload(this.collectAssets());
  }

  collectAssets() {
    const config = this.game.config;
    const list = PACK_IMAGES.map((name) => `assets/ui/${name}`);
    Object.values(config.backgrounds || {}).forEach((bg) => {
      if (bg) list.push(bg);
    });
    (config.loading && config.loading.assets || []).forEach((src) => list.push(src));
    return list;
  }

  preload(assets) {
    const bar = this.el.querySelector('.loading-fill');
    const text = this.el.querySelector('.loading-text');
    let loaded = 0;
    const total = assets.length || 1;

    const setProgress = (pct) => {
      const value = Math.max(0, Math.min(100, pct));
      if (bar) bar.style.width = `${value}%`;
      if (text) text.textContent = `LOADING ${Math.round(value)}%`;
      if (typeof SDK !== 'undefined' && SDK.loadingProgress) {
        try { SDK.loadingProgress(value / 100); } catch (error) { /* noop */ }
      }
    };

    setProgress(0);
    assets.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded += 1;
        setProgress((loaded / total) * 100);
        if (loaded >= total) {
          if (typeof SDK !== 'undefined' && SDK.sendGameReady) SDK.sendGameReady();
          this.game.show(this.game.config.loading.loadTarget || 'menu');
        }
      };
      img.src = src;
    });
  }
}
