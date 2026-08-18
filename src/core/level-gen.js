/* ============================================================
   LEVEL GENERATOR — 300 levels from a parametric curve.
   Deterministic (seeded PRNG per level). Every level is a
   pendulum timing puzzle: swing the hook, grab the crate,
   release it over the ship's hold.

   Depth ladder (mechanic evolution) :
     ~L15  WIND          — gusts push the hook (telegraphed)
     ~L30  MOVING SHIP   — the ship drifts along the dock
     ~L45  FRAGILE CRATES — striped crates break if dropped high
     ~L60  NARROW HOLD   — hold shrinks, crates must stack higher
     ~L75  STORM         — harder wind + faster rocking
     ~L90  TWO DOCKS     — crates on both sides, longer travel
     ~L120 GOLDEN CRATES — double-value crates
   ============================================================ */

const LevelGen = (() => {
  const W = 720;
  const H = 1280;
  const PIVOT_X = 360;
  const PIVOT_Y = 300;
  const SEED = 20260818;

  const WORLDS = [
    { index: 0, name: 'MORNING PIER', bg: 'w1', dir: 'w1', sub: 'GOAL: LOAD THE SHIP' },
    { index: 1, name: 'SUNNY MARINA', bg: 'w2', dir: 'w2', sub: 'ISLAND BAY' },
    { index: 2, name: 'GOLDEN HARBOR', bg: 'w3', dir: 'w3', sub: 'SUNSET DOCKS' },
    { index: 3, name: 'TROPICAL COVE', bg: 'w4', dir: 'w4', sub: 'SUNNY COVE' },
    { index: 4, name: 'DEEP BLUE SEA', bg: 'w5', dir: 'w5', sub: 'OPEN OCEAN' },
    { index: 5, name: 'MOONLIT BAY', bg: 'w6', dir: 'w6', sub: 'FINAL WORLD' }
  ];

  const CRATE_SPRITES = [
    'assets/game/crate-a.png',
    'assets/game/crate-b.png',
    'assets/game/crate-c.png',
    'assets/game/crate-d.png',
    'assets/game/crate-e.png',
    'assets/game/crate-f.png',
    'assets/game/crate-g.png'
  ];

  function rngFor(level) {
    let seed = (SEED ^ (level * 7919)) >>> 0;
    return function rng() {
      seed |= 0;
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;

  function worldFor(level) {
    const index = Math.min(WORLDS.length - 1, Math.floor((level - 1) / 50));
    return WORLDS[index];
  }

  function bannerFor(level, world) {
    if (level === 15) return { title: `LEVEL ${level}`, sub: 'WIND!' };
    if (level === 30) return { title: `LEVEL ${level}`, sub: 'MOVING SHIP!' };
    if (level === 45) return { title: `LEVEL ${level}`, sub: 'FRAGILE CRATES!' };
    if (level === 60) return { title: `LEVEL ${level}`, sub: 'NARROW HOLD!' };
    if (level === 75) return { title: `LEVEL ${level}`, sub: 'STORM!' };
    if (level === 90) return { title: `LEVEL ${level}`, sub: 'TWO DOCKS!' };
    if (level === 120) return { title: `LEVEL ${level}`, sub: 'GOLDEN CRATES!' };
    if (level % 50 === 1 && level > 1) return { title: world.name, sub: 'NEW WORLD' };
    if (level % 10 === 0) return { title: `LEVEL ${level}`, sub: 'MILESTONE' };
    if (level % 5 === 0) return { title: `LEVEL ${level}`, sub: 'SPECIAL' };
    return { title: `LEVEL ${level}`, sub: world.sub };
  }

  function doubleCoinsLevel(level) {
    return [5, 10, 20, 40, 80, 160, 250].indexOf(level) >= 0;
  }

  function generate(level) {
    const rng = rngFor(level);
    const world = worldFor(level);

    /* ---- difficulty curve (smooth linear, last level stays doable) ---- */
    const t = (level - 1) / 299;                 /* 0 → 1 */
    const ropeLen = Math.round(lerp(430, 560, t * 0.5 + Math.sin(t * Math.PI) * 0.25));
    const holdW = Math.round(lerp(520, 340, t));
    const crateCount = Math.min(9, 2 + Math.floor(level / 28));
    const timeBudget = Math.round(lerp(55, 100, t) + crateCount * 7);
    const rockSpeed = lerp(0.8, 1.7, t);
    const rockAmp = lerp(0.03, 0.07, t);

    /* ---- depth mechanics ---- */
    const hasWind = level >= 15;
    const windBase = hasWind ? Math.min(60, 6 + (level - 15) * 0.6) : 0;
    const windFreq = 0.35 + rng() * 0.4;
    const hasMovingShip = level >= 30;
    const shipSpeed = hasMovingShip ? Math.min(34, 10 + (level - 30) * 0.5) : 0;
    const shipRange = hasMovingShip ? Math.min(130, 40 + (level - 30) * 1.5) : 0;
    const hasFragile = level >= 45;
    const fragileChance = hasFragile ? Math.min(0.7, 0.3 + (level - 45) * 0.012) : 0;
    const storm = level >= 75;
    const windMult = storm ? 1.8 : 1;
    const twoDocks = level >= 90;
    const hasGolden = level >= 120;
    const goldenChance = hasGolden ? 0.18 : 0;

    /* ---- ship (dock at the bottom, hold on the deck) ---- */
    const ship = {
      x: 360,
      baseX: 360,
      y: 1060,
      holdW,
      holdH: 100,
      range: shipRange,
      speed: shipSpeed,
      phase: rng() * Math.PI * 2,
      rockAmp,
      rockSpeed,
      driftDir: rng() < 0.5 ? -1 : 1
    };

    /* ---- crates on the dock(s) ---- */
    const crates = [];
    const docks = twoDocks ? [-1, 1] : [rng() < 0.5 ? -1 : 1];
    let crateIndex = 0;
    docks.forEach((side) => {
      const perSide = Math.ceil(crateCount / docks.length);
      for (let i = 0; i < perSide && crateIndex < crateCount; i += 1) {
        const dx = 78 + (i % 3) * 118;
        const x = side < 0 ? 60 + dx : W - 60 - dx;
        const golden = hasGolden && rng() < goldenChance;
        crates.push({
          x,
          y: 780,
          w: 96,
          h: 74,
          side,
          fragile: !golden && hasFragile && rng() < fragileChance,
          golden,
          sprite: golden ? 'assets/game/crate.png' : CRATE_SPRITES[crateIndex % CRATE_SPRITES.length],
          index: crateIndex,
          grabbed: false,
          state: 'dock'          /* dock | held | falling | stacked | lost */
        });
        crateIndex += 1;
      }
    });

    /* ---- coins drifting above the water between docks ---- */
    const coins = [];
    const coinCount = Math.min(8, 2 + Math.floor(level / 22));
    for (let index = 0; index < coinCount; index += 1) {
      coins.push({
        x: clamp(140 + rng() * (W - 280), 100, W - 100),
        y: 700 + rng() * 230,
        value: 1,
        collected: false
      });
    }

    return {
      level,
      world: world.index,
      worldName: world.name,
      bg: world.bg,
      bgDir: world.dir,
      ropeLen,
      pivot: { x: PIVOT_X, y: PIVOT_Y },
      ship,
      crates,
      coins,
      wind: { active: hasWind, base: windBase * windMult, freq: windFreq, phase: rng() * Math.PI * 2 },
      storm,
      doubleCoins: doubleCoinsLevel(level),
      timeBudget,
      waterY: 940
    };
  }

  return {
    generate,
    worldFor,
    bannerFor,
    doubleCoinsLevel,
    W,
    H,
    PIVOT_X,
    PIVOT_Y,
    MAX_LEVEL: WORLDS.length * 50
  };
})();
