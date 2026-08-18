# HOOK MASTER — Game Design Spec (SPEC)

## 1. Identity

- **Title** : HOOK MASTER
- **Genre** : Skill-based timing game (pendulum crane)
- **Target** : Hypercasual mobile + desktop, portrait
- **Core concept (sacred)** : « Hook Master is a crane game where the player
  swings a hanging hook like a pendulum and must release it at the exact right
  moment to pick up a crate and drop it onto a cargo ship that rocks on the
  waves. Every level is a timing puzzle: one hook, one cargo hold, many crates. »
- **Gameplay chosen** : SWING & RELEASE (pendulum timing) — the hook hangs from a
  fixed pivot, the player pushes it to build momentum, grabs a crate, then
  releases at the exact moment so the crate lands inside the ship's hold.
- **Theme chosen** : MEDITERRANEAN PORT — sunny pastel harbor, terracotta roofs,
  turquoise sea, warm light. Bright, cheerful, readable.

## 2. Gameplay

- **Hook (< 3 s)** : a hook hangs from a crane and swings. Hold left/right to push
  it, release over a crate to GRAB it, release over the ship to DROP it.
- **Loop** : swing the hook → grab the crate → swing again → drop it into the
  moving ship → next crate → level complete (150-300 levels).
- **Action** : two buttons (◀ SWING LEFT / SWING RIGHT ▶) or hold screen sides to
  push the pendulum. A center GRAB/DROP button. All timing-based.
- **Goal** : load all crates into the ship's cargo hold before the level's time
  budget runs out. Crates that miss fall into the water → they are lost (a miss
  costs a "crate", 3 misses = run failed).
- **Rules** :
  - The hook is a rigid pendulum (rope length L, angle θ, angular velocity ω).
    Holding a direction applies angular acceleration; releasing lets it swing free.
  - GRAB: when the hook is above a crate (x within crate ± margin) and empty, tap
    GRAB → the hook descends, attaches, and returns to its swing with the crate.
  - DROP: when holding a crate and the hook is above the ship's hold (± margin),
    tap DROP → the crate falls with the hook's horizontal velocity, lands in the
    hold (stackable) or misses into the water.
  - The ship ROCKS on the waves (a sine-bobbing deck + slow horizontal sway in
    later levels) → the target moves.
  - Crates stack in the hold; the top crate must stay inside the hull silhouette.
  - 3 crates lost in the water → level failed (1 session heart lost).
  - Time budget per level (~45-120 s) shown in HUD; timeout → failed.
  - Coins fall occasionally with crates → collect by dropping crates on them.
- **Victory/defeat** : victory → VICTORY screen (stars 1-3 by accuracy/time left,
  coins, NEXT LEVEL, DOUBLE COINS via rewarded ad) ; defeat → 1 heart lost, level
  retries, at 0 → GAME OVER screen (RETRY / REVIVE via rewarded ad / MENU).
- **Session hearts** : a fresh run starts with 3 hearts (4 with the Extra Heart
  item). Failing a level costs a heart; retrying or moving on keeps remaining hearts.
- **Difficulty** : smooth LINEAR progression, last level stays doable. Parameters
  evolve: pendulum length, ship speed/sway, hold width (560→360 px), crate count
  (2→8), wind (visual gusts pushing the hook), fragile crates (drop height limit).

## 3. Depth systems (psychology)

Built on a tension → release loop rewarding timing mastery:

1. **PERFECT DROP** — dropping a crate dead-center in the hold triggers a golden
   "PERFECT!" popup + big combo. Perfects are tracked and feed the score.
2. **COMBO METER** — consecutive perfect drops build a combo multiplier (x1→x5),
   boosting coins and score. A miss resets the combo.
3. **NEAR-MISS** — a crate that lands on the hull edge (half in) is a close call:
   "SO CLOSE!" popup, small bonus, keeps tension.
4. **ONE-MORE-ROUND** — a failed level with 1 crate left shows "SO CLOSE — try
   again!", making the player want to retry immediately.
5. **ECONOMY** — coins earned even on failure (participation coins), first shop
   item ≈ 7 victories, shop has real VALUE.
6. **DEPTH LADDER (mechanic evolution, 2+ before level 60)** :
   - ~L15 : **WIND** — visual gusts that push the hook (telegraphed by drifting
     cloud streaks); the player must compensate.
   - ~L30 : **MOVING SHIP** — the ship drifts slowly along the dock and changes
     direction; timing must account for a moving target.
   - ~L45 : **FRAGILE CRATES** — striped crates break if dropped from high; the
     player must swing with low energy or release close above the hold.
   - ~L60 : **NARROW HOLD + HIGH STACK** — hold shrinks and crates must stack
     higher; angle control becomes precision work.
   - ~L75 : **STORM NIGHT** — storm visuals, harder wind, faster rocking.
   - ~L90+ : **MIRROR ZONES** — crates come from BOTH sides (two docks), the
     hook must travel further; combo chains across sides.
   - Later: golden crates (double value), moving dock, conveyor crates.
7. **META** : shop with illustrated items (image + name + price + BUY + WATCH AD
   on ≥ 50% of items) — extra heart, hook magnet (wider grab), golden hook (x2
   coins, 15 levels), double coins (15 levels), time extension per level.

## 4. Dimensions & presentation

- **Dimension : 2.5D** — justified: the port needs DEPTH. Layers: sky/clouds
  (far), sea with animated waves (mid), pier/dock (near), crane + hook (foreground,
  largest). Depth sorting: clouds behind sea behind pier behind crane. Parallax
  on menu. The ship sits ON the waterline with its hull overlapping the water
  surface; the hook swings in front of everything.
- **Responsive** : portrait AND landscape, mobile/tablet/desktop, NO black bars.
  Canvas fits the screen (cover-style), a blurred copy of the background fills
  side areas on desktop/landscape, gameplay area centered.
- **Art style** : bright pastel cartoon, consistent across worlds.

## 5. Worlds (assets DISTINCT per world, never a re-tint)

| World | Levels | Setting | Background (distinct files) |
|---|---|---|---|
| 1 | 1-50 | Morning fishing port | `game_background_1` layers (sky/sea/land/decor/cloud) |
| 2 | 51-100 | Afternoon marina | `game_background_2` layers (sky/sea/land/island/decor/cloud) |
| 3 | 101-150 | Golden sunset harbor | `game_background_3` layers (sky/sea/land/decor/cloud) |
| 4 | 151-200 | Tropical bay with sun | `game_background_4` layers (sky/sea/land/decor/cloud/sun) |
| 5 | 201-250 | Deep blue open ocean | OGA `pixel-ocean-and-sky` 4 layers |
| 6 | 251-300 | Moonlit night sea | OGA `moon-and-sea` 4 layers |

Each world swaps its own background files, its own sea color/sprite timing and a
distinct mood — structurally different images, proven by hash comparison in P5.

## 6. Screens

1. **Loading** — progress bar (real asset loading), Playgama `loadingProgress`.
2. **Menu** — animated background (parallax), big title, PLAY, SHOP, sound toggle,
   best score.
3. **Gameplay** — crane + hook + crates + ship + HUD (score, coins, hearts, time,
   crates left, combo).
4. **Pause** — resume / restart / menu, sound toggle.
5. **Victory** — stars, coins earned, PERFECT counter, NEXT LEVEL, DOUBLE COINS
   (rewarded), REPLAY, MENU. Animated + confetti.
6. **GameOver** — hearts lost, RETRY, REVIVE (rewarded, 1×/run), MENU.
7. **Shop** — illustrated items, BUY / WATCH AD (≥ 50% items).

## 7. Economy & meta numbers

- ~25-30 coins per victory (first levels), participation coins on fail (~8).
- 1st shop item (Extra Heart) ≈ 7 victories.
- Items: Extra Heart (permanent, 250), Hook Magnet (grab wider, 15 levels, 200),
  Golden Hook (x2 coins, 15 levels, 350), Double Coins (15 levels, 350),
  Time Boost (+20 s/level, 15 levels, 300). BUY with coins; WATCH AD grants a
  temporary use (≥ 50% of items support WATCH AD).
- Coins saved via bridge.storage (cloud) mirrored to localStorage fallback.

## 8. Audio

- **Music** : 2 distinct loops — menu track + gameplay track (downloaded CC0,
  reused from the CC0 pack used by previous games).
- **SFX** : click, hover, swing creak, grab, drop thud, perfect chime, miss splash,
  coin, win fanfare, lose sting, unlock (downloaded CC0).
- Mute toggle persisted, Playgama `isAudioEnabled` respected, pause during ads.

## 9. Playgama SDK

- Bridge script BEFORE game scripts; defensive wrapper (works with AND without).
- `game_ready` + `loadingProgress(p)`; pause/audio subscribed ONCE;
  `isAudioEnabled` at boot.
- **Interstitial** : after 2 consecutive runs with the same outcome, at
  transition, then reset.
- **Rewarded** (reward ONLY on `rewarded` event) : revive (resume exact state,
  1×/run), double coins at victory, WATCH AD shop items.
- **Storage** : `bridge.storage` pulled at boot + re-mirrored, localStorage fallback.
- Events: `level_started/paused/resumed/completed/failed` at the right moments.

## 10. Technical plan

- Structure (per template) : `index.html` (bridge BEFORE scripts) →
  `game-config.js` → `src/core/*` → `src/screens/*` → `src/main.js` ; assets in
  `assets/{ui,screens,game,audio}/`.
- Vanilla JS, canvas 2D, no frameworks, no console.log left, no dead code.
- Physics : rigid pendulum (angle + angular velocity + damping), simple free-fall
  for dropped crates, stack height tracking.
- Level generation : parametric (seeded) so 150-300 levels come from a generator
  with thresholds for each depth mechanic, deterministic per level number.

## 11. Verification checklist (P5)

- [ ] Zero console errors (with AND without SDK)
- [ ] Pixels : sprites really drawn (canvas pixel counting)
- [ ] Confetti : changing colored pixels measured on victory screen
- [ ] Worlds distinct : backgrounds compared (hash/screenshot) → structurally different
- [ ] Depth : new mechanics trigger at announced thresholds (wind ~L15, moving ship ~L30, fragile ~L45…)
- [ ] Placement : screenshots, nothing floats / overlaps / leaves frame
- [ ] Responsive portrait + landscape × mobile/tablet/desktop
- [ ] Stress : win/lose/revive/resize/pause ×10
- [ ] Economy balanced; shop illustrated; audio loops real; mute works
- [ ] All texts English `en-US`; `toLocaleString('en-US')`

## 12. Delivery (P6)

- Repo + commit + push ; GitHub Pages (HTTP 200) ; ZIP (index.html at root,
  no dev files). Provide the 3 links : repo, Pages, ZIP.
