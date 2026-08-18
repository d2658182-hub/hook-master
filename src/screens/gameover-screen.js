class GameOverScreen extends BaseScreen {
  constructor(game) {
    super(game, 'gameover');
  }

  build(options = {}) {
    this.level = options.level || 1;
    this.snapshot = options.snapshot || null;
    this.coinsCollected = options.coinsCollected || 0;
    this.totalCoins = options.totalCoins != null ? options.totalCoins : this.game.storage.get('coins', 0);

    this.el = document.createElement('div');
    this.el.className = 'screen gameover-screen';
    this.el.style.backgroundImage = `url("${this.game.config.backgrounds.menu}")`;

    const panel = new Panel({ image: 'assets/ui/f.png' });
    const children = [
      this.titleEl('GAME OVER'),
      this.subtitleEl(`LEVEL ${this.level.toLocaleString('en-US')}`),
      this.coinsEl(this.coinsCollected)
    ];
    if (SDK.isRewardedSupported()) {
      children.push(this.buttonEl('REVIVE', 'primary', () => this.revive()));
      children.push(this.buttonEl('RETRY', 'secondary', () => this.retry()));
    } else {
      children.push(this.buttonEl('RETRY', 'primary', () => this.retry()));
    }
    children.push(this.buttonEl('MENU', 'back', () => this.menu()));
    panel.add(...children);
    this.el.appendChild(panel.el);

    this.onKeyDown((event) => {
      if (event.code === 'Enter' || event.code === 'Space') this.retry();
    });
  }

  enter() {
    this.game.audio.playMusic('menu');
  }

  coinsEl(count) {
    const row = document.createElement('div');
    row.className = 'modal-score';
    row.innerHTML = `<img src="assets/ui/c.png" alt="" draggable="false"><span>${count.toLocaleString('en-US')}</span>`;
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

  buttonEl(label, variant, onClick) {
    return new Button({ label, variant, onClick });
  }

  retry() {
    this.game.audio.click();
    this.game.show(this.game.config.playTarget || 'gameplay', { level: this.level });
  }

  revive() {
    if (!SDK.isRewardedSupported()) return;
    this.game.audio.click();
    const button = this.el.querySelector('.btn-primary .btn-label');
    if (button) button.textContent = '...';
    SDK.showRewarded('revive').then((state) => {
      if (state === 'rewarded') {
        this.game.audio.sfx('win');
        this.game.show(this.game.config.playTarget || 'gameplay', {
          level: this.level,
          snapshot: this.snapshot || undefined
        });
      } else if (button) {
        button.textContent = 'REVIVE';
      }
    });
  }

  menu() {
    this.game.audio.click();
    this.game.show('menu');
  }
}
