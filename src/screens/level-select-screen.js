/* ============================================================
   LEVEL SELECT — world map with star progress.
   Each world shows a grid of its 50 levels; unlocked levels
   are playable (tap to replay for more stars). Worlds unlock
   by total star count (completionism + mastery loop).
   ============================================================ */

const STAR_THRESHOLDS = [0, 25, 60, 100, 145, 195]; /* stars needed to open world i+1 */
const WORLD_NAMES = ['CANDY MEADOW', 'LOLLIPOP FOREST', 'CHOCO MOUNTAIN', 'GUMDROP SKY', 'CANDY CASTLE', 'SWEET KINGDOM'];

class LevelSelectScreen extends BaseScreen {
  constructor(game) {
    super(game, 'levelselect');
    this.worldIndex = 0;
  }

  build() {
    this.el = document.createElement('div');
    this.el.className = 'screen levelselect-screen';
    this.el.style.backgroundImage = `url("${this.game.config.backgrounds.menu}")`;

    const panel = new Panel({ image: 'assets/ui/f.png' });
    panel.add(this.titleEl('LEVELS'), this.progressEl());
    this.worldChips = this.worldChipsEl();
    panel.add(this.worldChips);
    this.grid = document.createElement('div');
    this.grid.className = 'level-grid';
    panel.add(this.grid);
    panel.add(this.backButton());
    this.el.appendChild(panel.el);

    this.onKeyDown((event) => {
      if (event.code === 'Escape') this.game.show('menu');
    });

    this.renderWorld();
  }

  enter() {
    this.game.audio.playMusic('menu');
  }

  titleEl(text) {
    const h = document.createElement('h2');
    h.className = 'modal-title';
    h.textContent = text;
    return h;
  }

  starsMap() {
    return this.game.storage.get('stars', {});
  }

  totalStars() {
    const map = this.starsMap();
    return Object.keys(map).reduce((sum, key) => sum + (map[key] || 0), 0);
  }

  progressEl() {
    const row = document.createElement('div');
    row.className = 'levelselect-progress';
    const total = this.totalStars();
    const max = LevelGen.MAX_LEVEL * 3;
    row.innerHTML = `<span>⭐ ${total.toLocaleString('en-US')} / ${max.toLocaleString('en-US')} STARS</span>`;
    const bar = document.createElement('div');
    bar.className = 'levelselect-bar';
    const fill = document.createElement('div');
    fill.className = 'levelselect-fill';
    fill.style.width = `${Math.min(100, (total / max) * 100)}%`;
    bar.appendChild(fill);
    row.appendChild(bar);
    return row;
  }

  worldChipsEl() {
    const chips = document.createElement('div');
    chips.className = 'world-chips';
    for (let index = 0; index < WORLD_NAMES.length; index += 1) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'world-chip' + (index === this.worldIndex ? ' active' : '');
      chip.textContent = `W${index + 1}`;
      chip.setAttribute('title', WORLD_NAMES[index]);
      chip.addEventListener('click', () => {
        this.game.audio.click();
        this.worldIndex = index;
        chips.querySelectorAll('.world-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        this.renderWorld();
      });
      chips.appendChild(chip);
    }
    return chips;
  }

  worldUnlocked(worldIndex) {
    return this.totalStars() >= STAR_THRESHOLDS[worldIndex];
  }

  maxReached() {
    return this.game.storage.get('level', 1);
  }

  renderWorld() {
    const starsMap = this.starsMap();
    const worldIndex = this.worldIndex;
    const unlocked = this.worldUnlocked(worldIndex);
    const maxReached = this.maxReached();

    this.grid.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'world-header';
    const starsHere = Object.keys(starsMap)
      .filter((key) => LevelGen.worldFor(Number(key)).index === worldIndex)
      .reduce((sum, key) => sum + starsMap[key], 0);
    header.innerHTML = `<span>${WORLD_NAMES[worldIndex]}</span><span class="world-stars">⭐ ${starsHere} / 150</span>`;
    this.grid.appendChild(header);

    const cells = document.createElement('div');
    cells.className = 'level-cells';

    const first = worldIndex * 50 + 1;
    for (let offset = 0; offset < 50; offset += 1) {
      const level = first + offset;
      const isUnlockedLevel = unlocked && (level <= maxReached || starsMap[level]);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'level-cell' + (isUnlockedLevel ? ' open' : ' locked');
      const stars = starsMap[level] || 0;
      cell.innerHTML = `
        <span class="level-cell-num">${level.toLocaleString('en-US')}</span>
        <span class="level-cell-stars">${isUnlockedLevel ? '★'.repeat(stars) + '<i>☆</i>'.repeat(3 - stars) : '🔒'}</span>
      `;
      cell.addEventListener('click', () => {
        if (!isUnlockedLevel) {
          this.game.audio.click();
          return;
        }
        this.game.audio.click();
        this.game.show(this.game.config.playTarget || 'gameplay', { level });
      });
      cells.appendChild(cell);
    }
    this.grid.appendChild(cells);
  }

  backButton() {
    return new Button({
      label: 'BACK',
      variant: 'back',
      onClick: () => this.game.show('menu')
    });
  }
}
