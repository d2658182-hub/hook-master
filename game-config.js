/* ============================================================
   HOOK MASTER — GAME CONFIGURATION
   ------------------------------------------------------------
   Everything customizable for this game lives here.
   ============================================================ */

const GAME_CONFIG = {
  id: 'hook-master',
  firstScreen: 'loading',
  playTarget: 'gameplay',

  /* ----- identity ----- */
  title: 'HOOK MASTER',

  /* ----- loading screen: every asset the game uses ----- */
  loading: {
    loadTarget: 'menu',
    assets: [
      /* backgrounds — 6 distinct worlds */
      'assets/screens/w1/sky.png', 'assets/screens/w1/cloud.png', 'assets/screens/w1/sea.png', 'assets/screens/w1/land.png', 'assets/screens/w1/decor.png',
      'assets/screens/w2/sky.png', 'assets/screens/w2/cloud.png', 'assets/screens/w2/sea.png', 'assets/screens/w2/land.png', 'assets/screens/w2/island.png', 'assets/screens/w2/decor.png',
      'assets/screens/w3/sky.png', 'assets/screens/w3/cloud.png', 'assets/screens/w3/sea.png', 'assets/screens/w3/land.png', 'assets/screens/w3/decor.png',
      'assets/screens/w4/sky.png', 'assets/screens/w4/cloud.png', 'assets/screens/w4/sea.png', 'assets/screens/w4/land.png', 'assets/screens/w4/sun.png', 'assets/screens/w4/decor.png',
      'assets/screens/w5/pixel-oc_1_240.png', 'assets/screens/w5/pixel-oc_2_165.png', 'assets/screens/w5/pixel-oc_3_122.png', 'assets/screens/w5/pixel-oc_4_81.png',
      'assets/screens/w6/moon-and_1_262.png', 'assets/screens/w6/moon-and_2_182.png', 'assets/screens/w6/moon-and_3_134.png', 'assets/screens/w6/moon-and_4_91.png',
      'assets/screens/menu/menu-bg.png',
      /* game sprites */
      'assets/game/ship.png',
      'assets/game/ship-pirate.png',
      'assets/game/water.png',
      'assets/game/crate.png',
      'assets/game/crate-a.png', 'assets/game/crate-b.png', 'assets/game/crate-c.png',
      'assets/game/crate-d.png', 'assets/game/crate-e.png', 'assets/game/crate-f.png', 'assets/game/crate-g.png',
      'assets/game/hook.png',
      'assets/game/mast.png',
      'assets/game/rigging.png',
      'assets/game/sun.png',
      /* audio */
      'assets/audio/music-menu.ogg',
      'assets/audio/music-gameplay.ogg',
      'assets/audio/sfx-click.ogg',
      'assets/audio/sfx-select.ogg',
      'assets/audio/sfx-unlock.ogg',
      'assets/audio/sfx-pop.ogg',
      'assets/audio/sfx-rise.ogg',
      'assets/audio/sfx-tick.ogg',
      'assets/audio/sfx-cut.ogg',
      'assets/audio/sfx-collect.ogg',
      'assets/audio/sfx-win.ogg',
      'assets/audio/sfx-fail.ogg'
    ]
  },

  /* ----- backgrounds ----- */
  backgrounds: {
    menu: 'assets/screens/menu/menu-bg.png',
    gameplay: 'assets/screens/w1/sky.png'
  },

  /* ----- canvas / world ----- */
  world: {
    width: 720,
    height: 1280,
    maxLevel: 300
  },

  /* ----- optional features ----- */
  features: {
    shop: true
  },

  /* ----- shop items (illustrated, BUY + WATCH AD on >= 50%) ----- */
  shop: {
    items: [
      {
        id: 'extra_heart',
        name: 'EXTRA HEART',
        price: 250,
        icon: 'assets/ui/pr_ui_gold.png',
        desc: '+1 heart every run',
        canWatchAd: false
      },
      {
        id: 'hook_magnet',
        name: 'HOOK MAGNET',
        price: 200,
        icon: 'assets/game/hook.png',
        desc: 'Wider grab zone for 15 levels',
        canWatchAd: true,
        uses: 15
      },
      {
        id: 'golden_hook',
        name: 'GOLDEN HOOK',
        price: 350,
        icon: 'assets/game/crate.png',
        desc: 'x2 coins for 15 levels',
        canWatchAd: true,
        uses: 15
      },
      {
        id: 'double_coins',
        name: 'DOUBLE COINS',
        price: 350,
        icon: 'assets/ui/c.png',
        desc: 'x2 coins for 15 levels',
        canWatchAd: true,
        uses: 15
      },
      {
        id: 'time_boost',
        name: 'TIME BOOST',
        price: 300,
        icon: 'assets/ui/l1.png',
        desc: '+20s per level for 15 levels',
        canWatchAd: true,
        uses: 15
      }
    ]
  },

  /* ----- gameplay HUD ----- */
  hud: {
    showScore: true,
    showHearts: true,
    hearts: 3
  }
};
