class ShopScreen extends BaseScreen {
  constructor(game) {
    super(game, 'shop');
  }

  build() {
    const items = this.game.config.shop.items;

    this.el = document.createElement('div');
    this.el.className = 'screen shop-screen';
    this.el.style.backgroundImage = `url("${this.game.config.backgrounds.menu}")`;

    const panel = new Panel({ image: 'assets/ui/f.png' });
    panel.add(
      this.titleEl('SHOP'),
      this.coinsEl(),
      this.itemsEl(items),
      this.backButton()
    );
    this.el.appendChild(panel.el);

    this.onKeyDown((event) => {
      if (event.code === 'Escape') this.game.show('menu');
    });
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

  coinsEl() {
    const row = document.createElement('div');
    row.className = 'shop-coins';
    row.innerHTML = `<img src="assets/ui/c.png" alt="" draggable="false"><span>${this.getCoins().toLocaleString('en-US')}</span>`;
    return row;
  }

  getCoins() {
    return this.game.storage.get('coins', 0);
  }

  itemState(item) {
    const owned = this.game.storage.get('owned', []);
    const usesKey = `uses_${item.id}`;
    if (item.uses) {
      return { owned: owned.indexOf(item.id) >= 0, uses: this.game.storage.get(usesKey, 0) };
    }
    return { owned: owned.indexOf(item.id) >= 0, uses: 0 };
  }

  itemsEl(items) {
    const list = document.createElement('div');
    list.className = 'shop-list';
    items.forEach((item) => {
      const state = this.itemState(item);
      const row = document.createElement('div');
      row.className = 'shop-item' + (state.owned ? ' owned' : '');
      row.innerHTML = `
        <div class="shop-item-icon"><img src="${item.icon}" alt="" draggable="false"></div>
        <div class="shop-item-body">
          <span class="shop-item-name">${item.name}</span>
          <span class="shop-item-desc">${item.desc}</span>
          <span class="shop-item-status"></span>
        </div>
      `;
      const actions = document.createElement('div');
      actions.className = 'shop-item-actions';

      const buyButton = new Button({
        label: 'BUY',
        variant: 'secondary',
        onClick: () => this.buy(item, row, buyButton)
      });
      actions.appendChild(buyButton.el);

      if (item.canWatchAd && !state.owned) {
        const adButton = new Button({
          label: 'WATCH AD',
          variant: 'ad',
          onClick: () => this.watchAd(item, row, adButton)
        });
        actions.appendChild(adButton.el);
      }

      row.appendChild(actions);
      list.appendChild(row);
      this.refreshItemStatus(item, row);
    });
    return list;
  }

  refreshItemStatus(item, row) {
    const status = row.querySelector('.shop-item-status');
    if (!status) return;
    const state = this.itemState(item);
    if (item.uses) {
      status.textContent = state.uses > 0 ? `${state.uses.toLocaleString('en-US')} USES` : 'NOT OWNED';
    } else {
      status.textContent = state.owned ? 'OWNED' : 'NOT OWNED';
    }
    row.classList.toggle('owned', item.uses ? state.uses > 0 : state.owned);
  }

  buy(item, row, button) {
    const state = this.itemState(item);
    const owned = item.uses ? state.uses > 0 : state.owned;
    if (owned) {
      this.game.audio.click();
      return;
    }
    const coins = this.getCoins();
    if (coins >= item.price) {
      this.game.storage.set('coins', coins - item.price);
      this.grantItem(item);
      this.game.audio.sfx('unlock');
      button.el.querySelector('.btn-label').textContent = '✔';
      this.refreshCoins();
      this.refreshItemStatus(item, row);
    } else {
      this.game.audio.click();
      button.el.querySelector('.btn-label').textContent = '✖';
      window.setTimeout(() => {
        button.el.querySelector('.btn-label').textContent = 'BUY';
      }, 700);
    }
  }

  watchAd(item, row, button) {
    if (!SDK.isRewardedSupported()) return;
    button.el.querySelector('.btn-label').textContent = '...';
    SDK.showRewarded('shop_item').then((state) => {
      if (state === 'rewarded') {
        this.grantItem(item);
        this.game.audio.sfx('unlock');
        button.el.querySelector('.btn-label').textContent = '✔';
        this.refreshItemStatus(item, row);
      } else {
        button.el.querySelector('.btn-label').textContent = 'WATCH AD';
      }
    });
  }

  grantItem(item) {
    if (item.uses) {
      const key = `uses_${item.id}`;
      const uses = this.game.storage.get(key, 0);
      this.game.storage.set(key, uses + item.uses);
      const owned = this.game.storage.get('owned', []);
      if (owned.indexOf(item.id) < 0) {
        owned.push(item.id);
        this.game.storage.set('owned', owned);
      }
    } else {
      const owned = this.game.storage.get('owned', []);
      if (owned.indexOf(item.id) < 0) {
        owned.push(item.id);
        this.game.storage.set('owned', owned);
      }
    }
  }

  backButton() {
    return new Button({
      label: 'BACK',
      variant: 'back',
      onClick: () => this.game.show('menu')
    });
  }

  refreshCoins() {
    const value = this.el.querySelector('.shop-coins span');
    if (value) value.textContent = this.getCoins().toLocaleString('en-US');
  }
}
